module Api
  class AiBundlesController < ApplicationController
    def preview_list
      bundle_path = AiBundleBuilder.ensure_preview_list_bundle!
      render json: { url: "/ai_bundles/#{bundle_path.basename}" }
    rescue AiBundleBuilder::BundleError => e
      render json: { error: e.message }, status: :internal_server_error
    end
  end
end


