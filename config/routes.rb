Rails.application.routes.draw do
  namespace :api do
    get 'books/:isbn', to: 'books#show'
    get 'books/:work_id/editions', to: 'books#editions'
    # get 'authors', to: 'author#index'
    get 'authors/:slug', to: 'author#show'
  end

  root "pages#index"
  get "*path", to: "pages#index", constraints: ->(req) { !req.xhr? && req.format.html? }
end
