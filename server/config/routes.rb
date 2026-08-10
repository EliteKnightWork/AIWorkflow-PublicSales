Rails.application.routes.draw do
  namespace :v1 do
    resources :projects, only: [:show] do
      collection do
        get :search
        get :business_description_search
      end
      member do
        get :similar_projects
        get :similar_awarded_projects, controller: 'projects/similar_awarded_projects', action: :index
        post :browsing_histories, controller: 'projects/browsing_histories', action: :create
        post :chat, controller: 'projects/chat', action: :update
        get :chat, controller: 'projects/chat', action: :show
        put :reaction, controller: 'projects/reaction', action: :update
      end
    end
    resources :awarded_projects, only: [] do
      member do
        get :similar_projects, controller: 'awarded_projects/similar_projects', action: :index
      end
    end
    resources :favorites, only: [:index, :create] do
      collection do
        get :check, path: 'check/:uuid'
        delete :destroy, path: '/:uuid'
      end
    end
    resources :reacted_projects, only: [:index]
    resource :health, only: [:show]
    namespace :settings do
      resources :search_filter_presets, only: [:index, :show, :create, :update, :destroy] do
        member do
          put :subscribe, controller: 'search_filter_presets/subscribe', action: :update
          put :unsubscribe, controller: 'search_filter_presets/unsubscribe', action: :update
          put :recommended, controller: 'search_filter_presets/recommended', action: :update
          put :unrecommended, controller: 'search_filter_presets/unrecommended', action: :update
        end
      end
      resources :notification_methods, only: [:index] do
        collection do
          get :email, controller: 'notification_methods/email', action: :show
          put :email, controller: 'notification_methods/email', action: :update
          get :slack, controller: 'notification_methods/slack', action: :show
          put :slack, controller: 'notification_methods/slack', action: :update
        end
      end
      resource :notification_method, only: [:show, :update], controller: 'notification_method'
      resource :notification_timer_setting, only: [:update, :show], controller: 'notification_timer_setting'
    end
    namespace :companies do
      resources :me, only: [:index] do
        collection do
          get :members, controller: 'me/members', action: :index
          get :functional_limitation, controller: 'me/functional_limitation', action: :index
          get :security_qualifications, controller: 'me/security_qualifications', action: :index
          put :security_qualifications, controller: 'me/security_qualifications', action: :update
          get :participate_qualifications, controller: 'me/participate_qualifications', action: :index
          post :participate_qualifications, controller: 'me/participate_qualifications', action: :create
          patch :participate_qualifications, path: 'participate_qualifications/:id', controller: 'me/participate_qualifications', action: :update
          delete :participate_qualifications, path: 'participate_qualifications/:id', controller: 'me/participate_qualifications', action: :destroy
        end
      end
      resource :me, only: [:update], controller: 'me'
      resources :invitation, only: [:index], controller: 'invitation' do
        collection do
          get :verify
          get :check_limitation
        end
      end
      resources :join, only: [:create], controller: 'join'
      resource :company_information, only: [:show, :update], controller: 'company_information'
    end
    namespace :users do
      resources :me, only: [:index]
      resource :me, only: [:update], controller: 'me'
    end
    resources :project_summary_usages do
      collection do
        get :summarize, path: 'summarize/:uuid'
        get :check, path: 'check/:uuid'
      end
    end
    resources :bid_companies do
      collection do
        get :search
      end
    end
    resources :organizations, only: [] do
      collection do
        get :search
      end
    end
    namespace :admin do
      get 'projects/search', to: 'projects#search', as: :search_projects
      get 'projects/:uuid/detail', to: 'projects#show_by_uuid', as: :show_project_by_uuid
      resources :projects, only: [:create, :show, :update], constraints: { id: /[^\/]+/ } do
        member do
          patch 'key', to: 'projects#update_key'
        end
      end
      delete 'projects/:uuid', to: 'projects#destroy', as: :project_destroy
      resources :awarded_projects, only: [:create]
      resources :hidden_projects, only: [:index]
      resources :companies, only: [:index, :show, :create, :update, :destroy]
      get 'company_features', to: 'company_features#index', as: :company_features
      get 'users/search', to: 'users#search', as: :search_users
      resources :users, only: [:show, :update, :destroy, :create]
      resources :external_documents, only: [:show]
      resources :proposal_jobs, only: [:index, :show]
      resources :participate_qualifications, only: [:index]
      resource :health, only: [:show]
    end
    resources :business_description_formats, only: [:index, :create, :destroy]
    resources :suggestions, only: [:index]
    resources :recommendations, only: [:index]
    resources :bid_pipeline_statuses, only: [:index, :create, :update, :destroy]
    resources :bid_pipeline_tasks, only: [:index]
    resources :bid_pipelines, only: [:index, :show, :create, :update, :destroy] do
      resources :tasks, controller: 'bid_pipelines/tasks' do
        resources :attachments, controller: 'bid_pipelines/tasks/attachments'
        collection do
          post :bulk_delete
          post :bulk_duplicate
        end
        member do
          post :duplicate
        end
        resources :calendar_events, controller: 'bid_pipelines/tasks/calendar_events', only: [:create]
      end
      resources :calendar_events, controller: 'bid_pipelines/calendar_events', only: [:create]
      resources :custom_objects, controller: 'bid_pipelines/custom_objects', only: [:index]
    end
    resources :bid_pipeline_task_statuses, only: [:index, :create, :update, :destroy]

    resources :proposal_templates, only: [:index, :show, :create, :destroy]

    namespace :proposal do
      resource :template, only: [:create], controller: 'template'
    end

    resources :proposal_jobs, only: [:create, :update]

    resources :custom_object_templates, only: [:index, :create, :show, :update, :destroy]
    resources :companies, only: [] do
      resources :custom_object_filter_items, only: [:index], controller: 'companies/custom_object_filter_items'
    end

    resources :custom_objects, only: [] do
      resource :custom_object_items, only: [:update], controller: 'custom_objects/custom_object_items'
    end

    resources :participate_qualifications, only: [:index]

    namespace :internal do
      resources :projects, param: :uuid, only: [:show]
    end

    get 'auth/:provider', to: redirect('/auth/%{provider}'), constraints: { provider: /google_oauth2|microsoft_graph/ }
    delete 'auth/:provider', to: 'omni_auth#destroy', constraints: { provider: /google_oauth2|microsoft_graph/ }

    resources :microsoft_calendar_webhooks, only: [:create]
    resources :google_calendar_webhooks, only: [:create]
    resources :company_projects, only: [:create, :update, :destroy] do
      resources :attachments, only: [:create, :destroy], controller: 'company_projects/attachments'
    end

    namespace :guest_feature_usages do
      post :reset, controller: '/v1/guest_feature_usages', action: :reset
    end

    resources :security_qualifications, only: [:index]
  end

  # OmniAuth callback routes
  get '/auth/:provider/callback', to: 'v1/omni_auth#callback', constraints: { provider: /google_oauth2|microsoft_graph/ }
  get '/auth/failure', to: 'v1/omni_auth#failure'

  mount LetterOpenerWeb::Engine, at: "/letter_opener" if Rails.env.development?

  # Return 404 for any unmatched paths except those bound for Rails-provided actions
  match '*path', to: 'application#render_404', via: :all, constraints: lambda { |req|
    req.path !~ %r{^/rails}
  }
end
