require "open3"
require "fileutils"

class AiBundleBuilder
  OUTPUT_DIR = Rails.root.join("public", "ai_bundles").freeze
  ENTRYPOINT = Rails.root.join("app", "javascript", "ai_bundles", "preview_list_entry.jsx").freeze
  REACT_SHIM = Rails.root.join("app", "javascript", "ai_bundles", "react_shim.js").freeze

  class BundleError < StandardError; end

  def self.ensure_preview_list_bundle!(force: false)
    FileUtils.mkdir_p(OUTPUT_DIR)

    existing = newest_bundle_path
    return existing if existing && !force

    build_preview_list_bundle!
    newest_bundle_path || raise(BundleError, "esbuild completed but no bundle was written to #{OUTPUT_DIR}")
  end

  def self.newest_bundle_path
    Dir[OUTPUT_DIR.join("previewlist-*.js").to_s]
      .map { |p| Pathname.new(p) }
      .max_by { |p| p.mtime.to_i }
  end

  def self.build_preview_list_bundle!
    cmd = [
      "npx",
      "esbuild",
      ENTRYPOINT.to_s,
      "--bundle",
      "--format=esm",
      "--platform=browser",
      "--target=es2020",
      "--outdir=#{OUTPUT_DIR}",
      "--entry-names=previewlist-[hash]",
      "--alias:react=#{Rails.root.join('app/javascript/ai_bundles/react_shim.js')}",
      "--loader:.js=jsx",
      "--loader:.jsx=jsx"
    ]

    stdout, stderr, status = Open3.capture3(*cmd, chdir: Rails.root.to_s)
    return if status.success?

    raise BundleError, <<~MSG
      Failed to build preview list bundle (exit #{status.exitstatus}).
      cmd: #{cmd.join(" ")}
      stdout: #{stdout}
      stderr: #{stderr}
    MSG
  end

  def self.build_component_bundle!(component_code, entry_name: "task-preview")
    # Generate unique filename
    timestamp = Time.current.to_i
    hash = Digest::MD5.hexdigest(component_code)[0..7]
    filename = "task_preview_#{timestamp}_#{hash}.jsx"

    # Save component to ai_bundles directory
    component_path = Rails.root.join("app", "javascript", "ai_bundles", filename)
    File.write(component_path, component_code)

    # Create a dynamic entry point that imports our component
    entry_content = <<~JSX
      export { default } from "./#{filename}";
    JSX

    entry_path = Rails.root.join("app", "javascript", "ai_bundles", "#{entry_name}_entry_#{timestamp}_#{hash}.jsx")
    File.write(entry_path, entry_content)

    # Build the bundle
    FileUtils.mkdir_p(OUTPUT_DIR)

    cmd = [
      "npx",
      "esbuild",
      entry_path.to_s,
      "--bundle",
      "--format=esm",
      "--platform=browser",
      "--target=es2020",
      "--outdir=#{OUTPUT_DIR}",
      "--entry-names=#{entry_name}-[hash]",
      "--alias:react=#{Rails.root.join('app/javascript/ai_bundles/react_shim.js')}",
      "--loader:.js=jsx",
      "--loader:.jsx=jsx"
    ]

    stdout, stderr, status = Open3.capture3(*cmd, chdir: Rails.root.to_s)

    unless status.success?
      Rails.logger.error("Bundle build failed: #{stderr}")
      raise BundleError, <<~MSG
        Failed to build component bundle (exit #{status.exitstatus}).
        cmd: #{cmd.join(" ")}
        stdout: #{stdout}
        stderr: #{stderr}
      MSG
    end

    # Find the generated bundle file
    bundle_files = Dir[OUTPUT_DIR.join("#{entry_name}-*.js").to_s]
    newest_bundle = bundle_files.max_by { |f| File.mtime(f) }

    unless newest_bundle
      raise BundleError, "Bundle build completed but no output file found"
    end

    # Return relative path for the bundle (public directory is served at root)
    "/ai_bundles/#{File.basename(newest_bundle)}"
  end
end


