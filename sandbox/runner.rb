require "json"

SANDBOX_PATH = "/workspace"

begin
  code_file   = File.join(SANDBOX_PATH, "code.rb")
  input_file  = File.join(SANDBOX_PATH, "input.json")
  out_file    = File.join(SANDBOX_PATH, "out", "output.json")
  error_file  = File.join(SANDBOX_PATH, "out", "error.txt")

  code  = File.read(code_file)
  input = JSON.parse(File.read(input_file))

  # Run code inside a new module safely
  sandbox = Module.new
  sandbox.module_eval <<~RUBY
    module_function
    #{code}
  RUBY

  # Call the AI-defined method
  result = sandbox.transformation_procedure(input)

  File.write(out_file, JSON.dump(result))
rescue => e
  File.write(error_file, "#{e.class}: #{e.message}\n#{e.backtrace.join("\n")}")
  exit 1
end
