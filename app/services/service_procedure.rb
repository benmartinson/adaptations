class ServiceProcedure
  def initialize(service_name)
    @service_name = service_name
    @service_adapter = load_service_adapter(service_name)
  end

  def get_request_url(request_name, params)
    @service_adapter.get_request_url(request_name, params)
  end

  def run_request_procedure(request_name, data)
    @service_adapter.run_request_procedure(request_name, data)
  end

  def run_service(request_name, params)
    url = get_request_url(request_name, params)
    response = run_request(url)
    data = response.clone
    run_request_procedure(request_name, data)
  end

  private

  def load_service_adapter(service_name)
    case service_name
    when "OpenLibrary"
      OpenLibraryServiceProcedure.new
    else
      raise "Unknown service: #{service_name}"
    end
  end

  def run_request(url)
    begin
    response = HTTParty.get(url)
      if response.success?
        return response.parsed_response
      else
        raise "Failed to run request: #{response.body}"
      end
    rescue StandardError => e
      raise "Failed to run request: #{e.message}"
    end
  end
end 
