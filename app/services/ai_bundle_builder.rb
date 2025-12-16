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
end


