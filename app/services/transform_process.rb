class TransformProcess
  class NotFoundError < StandardError; end
  class TransformError < StandardError; end

  def initialize(system_tag:, api_endpoint:, log_tests: false)
    @system_tag = system_tag
    @api_endpoint = api_endpoint
    @log_tests = log_tests
  end

  def call
    task = find_task!
    data = fetch_data
    result = execute_transform(task.transform_code, data)
    result = execute_subtasks(task, result)
    result = attach_list_links(result)
    log_test_result(task, data, result) if @log_tests
    result
  end

  private

  attr_reader :system_tag, :api_endpoint, :log_tests

  def find_task!
    task = Task.find_by(system_tag: system_tag)
    raise NotFoundError, "No Task found with system_tag: #{system_tag}" unless task
    raise NotFoundError, "Task '#{system_tag}' has no transform_code" if task.transform_code.blank?
    task
  end

  def fetch_data
    response = HTTParty.get(api_endpoint)
    if response.success?
      response.parsed_response
    else
      raise TransformError, "Failed to fetch data from #{api_endpoint}: #{response.code}"
    end
  rescue HTTParty::Error, JSON::ParserError => e
    raise TransformError, "Failed to fetch data: #{e.message}"
  end

  def execute_transform(code_body, input)
    sandbox_module = Module.new
    sandbox_module.module_eval(code_body)
    receiver = Object.new
    receiver.extend(sandbox_module)

    if receiver.respond_to?(:transformation_procedure)
      receiver.public_send(:transformation_procedure, input)
    else
      raise TransformError, "transformation_procedure is not defined in transform code"
    end
  rescue SyntaxError, StandardError => e
    raise TransformError, "Transform execution failed: #{e.message}"
  end

  def execute_subtasks(task, result)
    sub_tasks = task.sub_tasks
    return result unless sub_tasks.any?

    merged_output = result.is_a?(Hash) ? result.dup : { "data" => result }

    sub_tasks.each do |sub_task|
      begin
        # Find the child task that handles this subtask's data transformation
        child_task = Task.find_by(kind: "api_transform", system_tag: sub_task.system_tag)
        next unless child_task&.transform_code.present?

        # Find the link task that produces the API endpoint for this subtask
        link_task = Task.find_by(kind: "subtask_connector", system_tag: sub_task.parent_system_tag)
        next unless link_task&.transform_code.present?

        # Execute the link transform to get the subtask's API endpoint
        sub_task_api_endpoint = execute_transform(link_task.transform_code, result)
        next if sub_task_api_endpoint.blank?

        # Fetch data from the subtask's endpoint
        sub_task_data = fetch_endpoint_data(sub_task_api_endpoint)
        next if sub_task_data.blank?

        # Execute the child task's transform on the fetched data
        sub_output = execute_transform(child_task.transform_code, sub_task_data)
        next unless sub_output.present?

        # Attach list links for this subtask before merging
        sub_output = attach_list_links(sub_output, sub_task.system_tag)
        merged_output[sub_task.system_tag] = sub_output
      rescue StandardError => e
        merged_output[sub_task.system_tag] = nil
        Rails.logger.warn("[TransformProcess] Error executing subtask #{sub_task.system_tag}: #{e.message}")
      end
    end

    merged_output
  end

  def fetch_endpoint_data(endpoint_url)
    response = HTTParty.get(endpoint_url)
    return response.parsed_response if response.success?
    nil
  rescue StandardError => e
    Rails.logger.warn("[TransformProcess] Failed to fetch endpoint data from #{endpoint_url}: #{e.message}")
    nil
  end

  def attach_list_links(result, tag = system_tag)
    # Find active list_link_connector task for the given system_tag
    list_links_task = Task.find_by(kind: "list_link_connector", system_tag: tag, is_active: true)
    return result unless list_links_task&.transform_code.present?

    # Determine the items array to process
    items = if result.is_a?(Array)
              result
            elsif result.is_a?(Hash) && result["items"].is_a?(Array)
              result["items"]
            else
              return result # No items to process
            end

    # Process each item and add api_endpoint_link
    items.each do |item|
      begin
        link_result = execute_transform(list_links_task.transform_code, item)
        item["api_endpoint_link"] = link_result if link_result.present?
      rescue StandardError => e
        Rails.logger.warn("[TransformProcess] Failed to attach list link for item: #{e.message}")
      end
    end

    result
  end

  def log_test_result(task, input_data, output)
    found_test = task.tests.find_by(api_endpoint: api_endpoint)
    Test.create!(
      task: task,
      api_endpoint: api_endpoint,
      from_response: input_data,
      actual_output: output,
      status: "pass",
      test_type: "automated"
    ) unless found_test
  rescue StandardError => e
    Rails.logger.warn("[TransformProcess] Failed to log test: #{e.message}")
  end
end

