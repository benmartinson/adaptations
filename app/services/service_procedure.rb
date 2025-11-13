class ServiceProcedure
  def initialize(service_name)
    @service = ApiService.find_by(name: service_name)
    if @service.nil?
      raise "Service not found: #{service_name}"
    end
  end

  def run_service(params)
    requests = ApiRequest.where(api_service_id: @service.id).sort_by(&:order)

    data = {}
    requests.each do |request|
      if request.order == 1
        expected_number_of_params = request.url.scan(/#\{[^}]*\}/).count
        if expected_number_of_params != params.count
          raise "Expected #{expected_number_of_params} parameters, got #{params.count}"
        end

        params.each do |param_name, param_value|
          request.url = request.url.gsub(/#\{#{param_name}\}/, param_value)
        end
      end
      response = run_request(request)
      procedures = RequestProcedure.where(api_request_id: request.id).sort_by(&:order)
      procedures.each do |procedure|
        data = run_procedure(response, procedure)
      end
    end
    data
  end

  private

  def run_request(request)
    begin
    response = HTTParty.get(@service.base_url + request.url)
      if response.success?
        return response.parsed_response
      else
        raise "Failed to run request: #{response.body}"
      end
    rescue StandardError => e
      raise "Failed to run request: #{e.message}"
    end
  end

  def run_procedure(response, procedure)
    procedure_fields = ProcedureField.where(request_procedure_id: procedure.id)
    return if procedure_fields.empty?
    if procedure.procedure_type == "map"
      values_to_map = get_and_check_nested_path(response, procedure_fields)
      return run_map_procedure(values_to_map, procedure, procedure_fields)
    end
  end

  def eval_transform(transform_expr, value, key)
    return nil unless value&.dig(key).present?
    if transform_expr.start_with?('.')
      eval("value[key]#{transform_expr}", binding)
    else
      value[key].send(eval(transform_expr))
    end
  end

  def run_map_procedure(values_to_map, procedure, procedure_fields)
    mapped_values = values_to_map.map do |value|
      object_to_map = {}
      procedure_fields.each do |field|
        key = field.from.split('/').last
        
        if field["transform"].present? 
          object_to_map[field.to] = eval_transform(field["transform"], value, key)
        else
          object_to_map[field.to] = value[key]
        end
      end
      object_to_map
    end
    mapped_values
  end

  def get_and_check_nested_path(response, procedure_fields)
    nested_keys = procedure_fields.first.from.split('/')
    response_clone = response.clone
    begin
      nested_keys.each_with_index do |key, index|
        response_clone = response_clone[key] unless index == nested_keys.length - 1
      end
    rescue StandardError => e
      raise "Bad path: #{procedure_fields.first.from}"
    end
    response_clone
  end
end 
