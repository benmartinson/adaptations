class LinkTransformProcess
  class NotFoundError < StandardError; end
  class TransformError < StandardError; end

  # For link tasks:
  # - from_system_tag: identifies the source task AND the link task (task.kind == "link")
  # - to_system_tag: identifies the target task
  # - api_endpoint: optional override for the initial fetch (defaults to From_Task.api_endpoint)
  def initialize(from_system_tag:, to_system_tag:, api_endpoint: nil, log_tests: false)
    @from_system_tag = from_system_tag
    @to_system_tag = to_system_tag
    @api_endpoint = api_endpoint
    @log_tests = log_tests
  end

  def call
    link_task = find_link_task!
    from_task, to_task = find_from_and_to_tasks!(link_task)

    from_endpoint = api_endpoint.presence || from_task.api_endpoint
    raise TransformError, "From task '#{from_task.system_tag}' has no api_endpoint" if from_endpoint.blank?

    from_data = fetch_data(from_endpoint)
    first_output = execute_transform(from_task.transform_code, from_data)
    second_output = execute_transform(link_task.transform_code, first_output)

    next_endpoint = second_output.to_s.strip
    raise TransformError, "Link transformation did not produce a valid endpoint" if next_endpoint.blank?

    to_data = fetch_data(next_endpoint)
    final_output = execute_transform(to_task.transform_code, to_data)

    log_test_result(link_task, from_endpoint, from_data, final_output) if log_tests
    final_output
  end

  private

  attr_reader :from_system_tag, :to_system_tag, :api_endpoint, :log_tests

  def find_link_task!
    task = Task.find_by(kind: "link", system_tag: from_system_tag, to_system_tag: to_system_tag)
    raise NotFoundError, "No link Task found with from_system_tag: #{from_system_tag} and to_system_tag: #{to_system_tag}" unless task
    raise NotFoundError, "Link Task '#{from_system_tag} -> #{to_system_tag}' has no transform_code" if task.transform_code.blank?
    task
  end

  def find_from_and_to_tasks!(link_task)
    from_task = Task.find_by(kind: "api_transform", system_tag: link_task.system_tag)
    raise NotFoundError, "No From Task found with system_tag: #{link_task.system_tag}" unless from_task
    raise NotFoundError, "From Task '#{from_task.system_tag}' has no transform_code" if from_task.transform_code.blank?

    to_task = Task.find_by(kind: "api_transform", system_tag: link_task.to_system_tag)
    raise NotFoundError, "No To Task found with system_tag: #{link_task.to_system_tag}" unless to_task
    raise NotFoundError, "To Task '#{to_task.system_tag}' has no transform_code" if to_task.transform_code.blank?

    [from_task, to_task]
  end

  def fetch_data(url)
    response = HTTParty.get(url)
    if response.success?
      response.parsed_response
    else
      raise TransformError, "Failed to fetch data from #{url}: #{response.code}"
    end
  rescue HTTParty::Error, JSON::ParserError => e
    raise TransformError, "Failed to fetch data: #{e.message}"
  end

  def execute_transform(code_body, input)
    raise TransformError, "transform_code is blank" if code_body.blank?

    # begin
    #   RubySandbox.run(code_body, input)
    # rescue StandardError
      evaluate_inline(code_body, input)
    # end
  rescue StandardError => e
    raise TransformError, "Transform execution failed: #{e.message}"
  end

  def evaluate_inline(code_body, input)
    sandbox_module = Module.new
    sandbox_module.module_eval(code_body)
    receiver = Object.new
    receiver.extend(sandbox_module)

    if receiver.respond_to?(:transformation_procedure)
      receiver.public_send(:transformation_procedure, input)
    else
      raise StandardError, "transformation_procedure is not defined in transform code"
    end
  end

  # Mirrors TransformProcess behavior: create ONE automated test per unique initial endpoint
  def log_test_result(link_task, from_endpoint, input_data, output)
    found_test = link_task.tests.find_by(api_endpoint: from_endpoint)
    Test.create!(
      task: link_task,
      api_endpoint: from_endpoint,
      from_response: from_endpoint,
      actual_output: output,
      status: "pass",
      test_type: "automated"
    ) unless found_test
  rescue StandardError => e
    Rails.logger.warn("[LinkTransformProcess] Failed to log test: #{e.message}")
  end
end


