Rails.application.routes.draw do
  namespace :api do
    get 'books/:isbn', to: 'books#show'
    get 'books/:work_id/editions', to: 'books#editions'
    # get 'authors', to: 'author#index'
    get 'authors/:slug', to: 'author#show'
    get 'authors/:slug/books', to: 'author#books'
    get "ai_bundles/preview_list", to: "ai_bundles#preview_list"

    # Apps CRUD
    resources :apps, only: %i[index create destroy]

    # App runner - executes TransformProcess and returns data for UI rendering
    post 'apps/run', to: 'apps#run'

    resources :tasks, only: %i[index show create update destroy] do
      collection do
        get :system_tags
        get "by_system_tag/:system_tag", to: "tasks#by_system_tag"
      end
      member do
        post :run_job
        post :run_tests
        get :sub_tasks
        post :create_sub_task
        patch "sub_tasks/:sub_task_id", to: "tasks#update_sub_task"
        post "sub_tasks/:sub_task_id/generate_ui", to: "tasks#generate_subtask_ui"
        delete "sub_tasks/:sub_task_id", to: "tasks#delete_sub_task"
        get :list_links
        post :create_list_link
        post :generate_list_link
        post :attach_links
        post :set_active_link
      end
      resources :ui_files, only: [:index], controller: "ui_files"
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
