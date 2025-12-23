class ApplicationJob < ActiveJob::Base
  # Automatically retry jobs that encountered a deadlock
  # retry_on ActiveRecord::Deadlocked

  # Most jobs are safe to ignore if the underlying records are no longer available
  # discard_on ActiveJob::DeserializationError

  private

  def fetch_endpoint_data(url)
    return [] if url.blank?

    uri = URI.parse(url)
    http = Net::HTTP.new(uri.host, uri.port)

    if uri.scheme == "https"
      http.use_ssl = true
      http.verify_mode = OpenSSL::SSL::VERIFY_NONE
    end

    request = Net::HTTP::Get.new(uri.request_uri)
    response = http.request(request)

    if response.is_a?(Net::HTTPSuccess)
      JSON.parse(response.body)
    else
      Rails.logger.error("[#{self.class.name}] Failed to fetch endpoint: #{response.code} #{response.message}")
      []
    end
  rescue StandardError => e
    Rails.logger.error("[#{self.class.name}] Error fetching endpoint: #{e.message}")
    []
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

  def broadcast_event(data)
    channel_class = "TaskChannel".safe_constantize
    payload = {
      task_id: task.id,
      status: task.status,
      timestamp: Time.current.iso8601
    }

    # Include tokens if available on the task
    if task.respond_to?(:tokens_prompt) && task.respond_to?(:tokens_completion) && task.respond_to?(:tokens_total)
      payload[:tokens] = {
        prompt: task.tokens_prompt,
        completion: task.tokens_completion,
        total: task.tokens_total
      }
    end

    payload.merge!(data)
    channel_class&.broadcast_to(task, payload)
  end

  def extract_code(raw_response)
    # Extract code from markdown or plain text
    if raw_response.include?("```")
      # Extract from markdown code block
      code_match = raw_response.match(/```(?:jsx?|javascript)?\n?(.*?)\n?```/m)
      return code_match[1].strip if code_match
    end

    # Try to find where the code starts (import, export, or declaration) and return everything from there
    code_match = raw_response.match(/(?:import\s+|export\s+|(?:function|const|class)\s+\w+)[\s\S]*/m)
    return code_match[0].strip if code_match

    # Fallback: return the whole response cleaned up
    raw_response.strip
  end

  def cleanup_task_ui_files(task)
    task.task_ui_files.each do |ui_file|
      begin
        if ui_file.file_name.present?
          # Delete the final bundle file in public/ai_bundles
          # Strip leading slash since file_name is like "/ai_bundles/task-preview-XXX.js"
          full_bundle_path = Rails.root.join("public", ui_file.file_name.sub(/^\//, ""))
          FileUtils.rm_f(full_bundle_path)

          # Clean up source files in app/javascript/ai_bundles
          # The source files use a hash of the source_code, so we can compute it
          if ui_file.source_code.present?
            source_hash = Digest::MD5.hexdigest(ui_file.source_code)[0..7]
            # Delete matching source files (task_preview_*_{hash}.jsx and task-preview_entry_*_{hash}.jsx)
            Dir.glob(Rails.root.join("app", "javascript", "ai_bundles", "*_#{source_hash}.jsx")).each do |temp_file|
              FileUtils.rm_f(temp_file)
            end
          end
        end
      rescue => e
        Rails.logger.warn("[#{self.class.name}] Failed to delete file #{ui_file.file_name}: #{e.message}")
      end
      ui_file.destroy!
    end
  end
end
