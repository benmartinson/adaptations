class RunTransformTestsJob < ApplicationJob
  queue_as :default

  rescue_from(ActiveRecord::RecordNotFound) do |_error|
    Rails.logger.warn("[RunTransformTestsJob] Task not found, skipping job")
  end
  rescue_from(StandardError) do |error|
    handle_failure(error)
  end

  def perform(task_id)
    @task = Task.find(task_id)
    code_body = @task.transform_code

    if code_body.blank?
      raise StandardError, "No transform code found to test"
    end

    broadcast_event(phase: "starting", message: "Starting test execution")

    # Delete existing tests
    @task.tests.destroy_all

    # Generate all parameter combinations
    combinations = generate_combinations
    if combinations.empty?
      raise StandardError, "No parameter values to test"
    end

    test_results = []

    combinations.each_with_index do |params_hash, index|
      broadcast_event(
        phase: "running",
        message: "Running test #{index + 1} of #{combinations.length}",
        progress: { current: index + 1, total: combinations.length }
      )

      result = run_single_combination(params_hash, code_body)
      test_results << result
    end

    broadcast_event(
      phase: "completed",
      message: "All tests completed",
      output: { "test_results" => test_results },
      test_results: test_results,
      tests: @task.tests.reload.order(created_at: :desc).map { |t| serialize_test(t) },
      final: true
    )
  end

  private

  attr_reader :task

  def generate_combinations
    params_with_values = @task.parameters.map do |p|
      { name: p.name, values: p.example_values || [] }
    end.select { |p| p[:values].any? }

    return [] if params_with_values.empty?

    # Generate cartesian product of all parameter values
    names = params_with_values.map { |p| p[:name] }
    value_arrays = params_with_values.map { |p| p[:values] }

    # Use Array#product to get all combinations
    first_values = value_arrays.first
    rest_values = value_arrays[1..] || []

    all_combinations = if rest_values.empty?
                         first_values.map { |v| [v] }
                       else
                         first_values.product(*rest_values)
                       end

    all_combinations.map { |values| names.zip(values).to_h }
  end

  def resolve_api_url(template, params_hash)
    result = template.dup
    params_hash.each do |name, value|
      result = result.gsub("{#{name}}", value.to_s)
    end
    result
  end

  def fetch_api_response(url)
    uri = URI.parse(url)

    http = Net::HTTP.new(uri.host, uri.port)
    if uri.scheme == "https"
      http.use_ssl = true
      http.verify_mode = OpenSSL::SSL::VERIFY_PEER
      http.verify_callback = ->(_preverify_ok, _store_ctx) { true }
    end

    request = Net::HTTP::Get.new(uri)
    response = http.request(request)

    unless response.is_a?(Net::HTTPSuccess)
      raise StandardError, "HTTP request failed: #{response.code} #{response.message}"
    end

    JSON.parse(response.body)
  rescue JSON::ParserError => e
    raise StandardError, "Failed to parse API response as JSON: #{e.message}"
  end

  def run_single_combination(params_hash, code_body)
    resolved_url = resolve_api_url(@task.api_endpoint, params_hash)

    # Create test record first
    test = @task.tests.create!(
      api_endpoint: resolved_url,
      status: "pending",
      attempts: 1
    )

    begin
      # Fetch the API response
      from_response = fetch_api_response(resolved_url)
      test.update!(from_response: from_response)

      # Run the transform
      from_response_array = from_response.is_a?(Array) ? from_response : [from_response]
      output = execute_code(code_body, from_response_array)

      test.update!(
        status: "needs_review",
        actual_output: output
      )

      {
        test_id: test.id,
        name: "Transform: #{resolved_url}",
        status: "needs_review",
        params: params_hash,
        input: from_response,
        output: output
      }
    rescue StandardError => e
      test.update!(
        status: "error",
        error_message: e.message
      )

      {
        test_id: test.id,
        name: "Transform: #{resolved_url}",
        status: "error",
        params: params_hash,
        error: e.message
      }
    end
  end

  def execute_code(code_body, input)
    RubySandbox.run(code_body, input)
  rescue StandardError
    evaluate_inline(code_body, input)
  end

  def evaluate_inline(code_body, input)
    sandbox_module = Module.new
    sandbox_module.module_eval(code_body)
    receiver = Object.new
    receiver.extend(sandbox_module)

    if receiver.respond_to?(:transformation_procedure)
      receiver.public_send(:transformation_procedure, input)
    else
      raise StandardError, "transformation_procedure is not defined in generated code"
    end
  rescue StandardError => e
    raise(StandardError, "Inline evaluation failed: #{e.message}")
  end

  def serialize_test(t)
    {
      id: t.id,
      api_endpoint: t.api_endpoint,
      status: t.status,
      from_response: t.from_response,
      expected_output: t.expected_output,
      actual_output: t.actual_output,
      error_message: t.error_message,
      parameter_id: t.parameter_id,
      example_values: t.example_values || [],
      attempts: t.attempts,
      created_at: t.created_at,
      updated_at: t.updated_at
    }
  end

  def broadcast_event(data)
    channel_class = "TaskChannel".safe_constantize
    payload = {
      task_id: task.id,
      status: task.status,
      tokens: {
        prompt: task.tokens_prompt,
        completion: task.tokens_completion,
        total: task.tokens_total
      },
      timestamp: Time.current.iso8601
    }.merge(data)

    channel_class&.broadcast_to(task, payload)
  end

  def handle_failure(error)
    return unless task

    task.mark_failed!(error.message)
    broadcast_event(
      phase: "error",
      message: error.message,
      backtrace: Rails.env.development? ? Array(error.backtrace).first(5) : nil,
      final: true
    )
  end
end
