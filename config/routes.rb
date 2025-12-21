Rails.application.routes.draw do
  namespace :api do
    get 'books/:isbn', to: 'books#show'
    get 'books/:work_id/editions', to: 'books#editions'
    # get 'authors', to: 'author#index'
    get 'authors/:slug', to: 'author#show'
    get 'authors/:slug/books', to: 'author#books'
    get "ai_bundles/preview_list", to: "ai_bundles#preview_list"

    resources :tasks, only: %i[index show create update destroy] do
      collection do
        get :system_tags
        get "by_system_tag/:system_tag", to: "tasks#by_system_tag"
      end
      member do
        post :run_job
        post :run_tests
        get :ui_files
        get :sub_tasks
        post :create_sub_task
        delete "sub_tasks/:sub_task_id", to: "tasks#delete_sub_task"
      end
      resources :tests, only: %i[index create show update destroy] do
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
