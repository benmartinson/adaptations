module Api
  class TryApiController < ApplicationController
    skip_before_action :verify_authenticity_token

    require 'tmpdir'
    require 'fileutils'
    require 'json'

    def index
      request.format = :json
      from_response = params[:fromResponse]
      to_response = params[:toResponse]
    # chat = GeminiChat.new
        # prompt = "Can you write a ruby data transformation: def transformation_procedure(data) ...something... end 
        # Where data param is a list of records in this data format: #{from_response} 
        # And transforms the data into a list of records in this format: #{to_response}
        # This is important: only return the code, no other text or comments."
        # response = chat.generate_response(prompt)
      begin
        code = <<~RUBY
          def transformation_procedure(data)
            data["entries"].map do |entry|
              {
                work_id: entry["key"].split('/').last,
                cover_id: entry["covers"].first,
                title: entry["title"]
              }
            end
          end
        RUBY

        input_data = {
          "entries" => [
            {
              "key" => "/works/OL44337192W",
              "covers" => [9003030],
              "title" => "Fabeldieren & Waar Ze Te Vinden"
            }
          ]
        }

        Dir.mktmpdir("sandbox_", "/Users/benmartinson/workspace/adaptations/tmp") do |tmp_dir|
          out_dir = File.join(tmp_dir, "out")
          FileUtils.mkdir_p(out_dir)

          code_path = File.join(tmp_dir, "code.rb")
          File.write(code_path, code)

          input_path = File.join(tmp_dir, "input.json")
          File.write(input_path, input_data.to_json)

          response = RubySandbox.run(code, input_data)
          render json: { response: response }
        end

      rescue => e
        render json: { error: e.message, backtrace: e.backtrace }, status: :internal_server_error
      end
    end
  end
end
