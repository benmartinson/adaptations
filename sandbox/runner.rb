require "json"
require "fileutils"

SANDBOX_PATH = "/workspace"

begin
  code_file   = File.join(SANDBOX_PATH, "code.rb")
  input_file  = File.join(SANDBOX_PATH, "input.json")
  out_file    = File.join(SANDBOX_PATH, "out", "output.json")
  error_file  = File.join(SANDBOX_PATH, "out", "error.txt")
  FileUtils.mkdir_p(File.dirname(out_file))

  code  = File.read(code_file)
  input_data = JSON.parse(File.read(input_file))

  # Run code inside a new module safely
  sandbox = Module.new
  sandbox.module_eval <<~RUBY
    module_function
    #{code}
  RUBY

  # Check if input is batch format (array of {test_id, input} objects)
  if input_data.is_a?(Array) && input_data.first.is_a?(Hash) && input_data.first.key?("test_id")
    # Batch mode: run transformation for each test
    results = input_data.map do |test_data|
      test_id = test_data["test_id"]
      input = test_data["input"]
      
      begin
        output = sandbox.transformation_procedure(input)
        { "test_id" => test_id, "success" => true, "output" => output }
      rescue => e
        { "test_id" => test_id, "success" => false, "error" => "#{e.class}: #{e.message}" }
      end
    end
    
    File.write(out_file, JSON.dump(results))
  else
    # Legacy single-input mode for backwards compatibility
    result = sandbox.transformation_procedure(input_data)
    File.write(out_file, JSON.dump(result))
  end
rescue Exception => e
  # NOTE: SyntaxError is a ScriptError (not a StandardError), so `rescue => e`
  # does NOT catch it. We rescue Exception so we can always persist an error
  # into the mounted /workspace/out/ directory for the host to read.
  FileUtils.mkdir_p(File.dirname(error_file))
  File.write(error_file, "#{e.class}: #{e.message}\n#{e.backtrace.join("\n")}")
  exit 1
end
