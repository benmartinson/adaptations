require "fileutils"

# Pry tries to write history to ~/.local/share/pry by default, which can fail in
# some environments (e.g. background jobs, containers, different users).
# Force Pry history into the Rails tmp directory so debugging doesn't error.
if defined?(Pry)
  history_path = Rails.root.join("tmp", "pry_history")
  FileUtils.mkdir_p(history_path.dirname)

  Pry.config.history_file = history_path.to_s
end


