Rails.application.routes.draw do
  namespace :api do
    get 'books/:isbn', to: 'books#show'
    get 'books/:work_id/editions', to: 'books#editions'
    # get 'authors', to: 'author#index'
    get 'authors/:slug', to: 'author#show'
    get 'authors/:slug/books', to: 'author#books'

    get 'try_api', to: 'try_api#index'
    post 'try_api', to: 'try_api#index'

    resources :tasks, only: %i[index show create] do
      member do
        post :cancel
      end
    end
  end

  mount ActionCable.server => "/cable"

  root "pages#index"
  get "*path", to: "pages#index", constraints: ->(req) { !req.xhr? && req.format.html? }
end
