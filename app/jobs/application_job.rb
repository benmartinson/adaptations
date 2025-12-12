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
end
