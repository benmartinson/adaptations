Rails.application.routes.draw do
  namespace :api do
    get 'books/:isbn', to: 'books#show'
    get 'books/:work_id/editions', to: 'books#editions'
    # get 'authors', to: 'author#index'
    get 'authors/:slug', to: 'author#show'
    get 'authors/:slug/books', to: 'author#books'

    resources :tasks, only: %i[index show create update destroy] do
      collection do
        get :system_tags
      end
      member do
        post :run_job
        post :run_tests
      end
      resources :tests, only: %i[index create show update] do
        member do
          post :run_job
        end
      end
    end
  end

  mount ActionCable.server => "/cable"

  root "pages#index"
  get "*path", to: "pages#index", constraints: ->(req) { !req.xhr? && req.format.html? }
end
