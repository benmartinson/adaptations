Rails.application.routes.draw do
  namespace :api do
    resources :books, only: [:index, :show]
  end

  root "pages#index"
  get "*path", to: "pages#index", constraints: ->(req) { !req.xhr? && req.format.html? }
end
