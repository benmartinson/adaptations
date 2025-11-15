require "json"
require "securerandom"
require "fileutils"
require "open3"

class RubySandbox
  SANDBOX_IMAGE = "ruby-sandbox"
  CONTAINER_SANDBOX_PATH = "/workspace"
  CONTAINER_RUNNER_PATH = "/app/runner.rb"
  TMP_ROOT = Rails.root.join("tmp", "sandbox")

  def self.run(code_string, input_data)
    FileUtils.mkdir_p(TMP_ROOT)

    Dir.mktmpdir("sandbox_", TMP_ROOT) do |tmp|
      FileUtils.chmod(0o755, tmp)
      out_dir = File.join(tmp, "out")
      FileUtils.mkdir_p(out_dir)
      FileUtils.chmod(0o777, out_dir)

      # Write files inside the temp directory
      code_path  = File.join(tmp, "code.rb")
      input_path = File.join(tmp, "input.json")

      File.write(code_path, code_string)
      File.write(input_path, input_data.to_json)

      cmd = [
        "docker", "run",
        "--rm",
        "--network", "none",
        "-v", "#{tmp}:#{CONTAINER_SANDBOX_PATH}",   # mount the whole temp folder
        SANDBOX_IMAGE,
        "ruby", CONTAINER_RUNNER_PATH
      ]

      stdout, stderr, status = Open3.capture3(*cmd)
      unless status.success?
        raise("Docker run failed (#{status.exitstatus}): #{stderr.presence || stdout}")
      end

      output_file = File.join(out_dir, "output.json")
      error_file  = File.join(out_dir, "error.txt")

      if File.exist?(output_file)
        JSON.parse(File.read(output_file))
      else
        raise(File.exist?(error_file) ? File.read(error_file) : "Unknown sandbox error")
      end
    end
  end
end
