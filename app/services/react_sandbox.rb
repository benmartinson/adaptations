require "json"
require "securerandom"
require "fileutils"
require "open3"

class ReactSandbox
  SANDBOX_IMAGE = "react-sandbox"
  CONTAINER_WORKSPACE_PATH = "/workspace"
  TMP_ROOT = Rails.root.join("tmp", "react_sandbox")

  class RenderError < StandardError; end

  # Validate that a React component renders without errors given the provided data
  #
  # @param bundle_file_name [String] The file_name from TaskUiFile (e.g., "/ai_bundles/task-preview-XYZ.js")
  # @param data [Hash] The data to pass as props to the component
  # @return [Hash] Result with :success, :error keys
  def self.validate_render(bundle_file_name, data)
    # Convert URL path to filesystem path
    bundle_path = Rails.root.join("public", bundle_file_name.sub(/^\//, ""))
    
    unless File.exist?(bundle_path)
      return {
        success: false,
        error: "Bundle file not found: #{bundle_file_name}",
        error_type: "not_found"
      }
    end

    FileUtils.mkdir_p(TMP_ROOT)

    Dir.mktmpdir("react_sandbox_", TMP_ROOT) do |tmp|
      FileUtils.chmod(0o755, tmp)
      out_dir = File.join(tmp, "out")
      FileUtils.mkdir_p(out_dir)
      FileUtils.chmod(0o777, out_dir)

      # Copy the bundle file and write data
      component_dest = File.join(tmp, "component.js")
      data_path = File.join(tmp, "data.json")

      FileUtils.cp(bundle_path, component_dest)
      File.write(data_path, data.to_json)

      cmd = [
        "docker", "run",
        "--rm",
        "--network", "none",
        "-v", "#{tmp}:#{CONTAINER_WORKSPACE_PATH}",
        SANDBOX_IMAGE,
        "node", "/app/render_test.js"
      ]

      stdout, stderr, status = Open3.capture3(*cmd)

      # Check for Docker-level failures
      if !status.success? && status.exitstatus >= 125
        return {
          success: false,
          error: "Docker run failed (#{status.exitstatus}): #{stderr.presence || stdout}",
          error_type: "docker"
        }
      end

      # Read the result
      result_file = File.join(out_dir, "result.json")
      error_file = File.join(out_dir, "error.txt")

      if File.exist?(result_file)
        result = JSON.parse(File.read(result_file))
        result.symbolize_keys
      elsif File.exist?(error_file)
        {
          success: false,
          error: File.read(error_file),
          error_type: "fatal"
        }
      else
        {
          success: false,
          error: "Unknown sandbox error - no output produced",
          error_type: "unknown"
        }
      end
    end
  rescue StandardError => e
    {
      success: false,
      error: "ReactSandbox error: #{e.message}",
      error_type: "service"
    }
  end

  # Validate multiple renders in batch
  #
  # @param bundle_file_name [String] The file_name from TaskUiFile
  # @param data_items [Array<Hash>] Array of { test_id:, data: } hashes
  # @return [Array<Hash>] Array of results with test_id and render validation status
  def self.validate_batch(bundle_file_name, data_items)
    data_items.map do |item|
      result = validate_render(bundle_file_name, item[:data] || item["data"])
      {
        test_id: item[:test_id] || item["test_id"],
        ui_validation: result
      }
    end
  end

  # Check if the React sandbox Docker image is available
  def self.available?
    stdout, _stderr, status = Open3.capture3("docker", "images", "-q", SANDBOX_IMAGE)
    status.success? && stdout.strip.present?
  end
end
