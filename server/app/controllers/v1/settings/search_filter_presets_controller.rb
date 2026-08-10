module V1
  module Settings
    class SearchFilterPresetsController < ApplicationController
      def index
        # NOTE: 組織に所属していない場合は自身の検索条件プリセットのみを返す
        owner = current_user.company || current_user
        search_filter_presets = if params[:project_type].present?
                                  owner.search_filter_presets.includes(:search_filter_preset_notifications).where(project_type: params[:project_type])
                                else
                                  owner.search_filter_presets.includes(:search_filter_preset_notifications)
                                end

        # NOTE: おすすめ条件フラグを設定
        if params[:recommended].present?
          search_filter_presets = search_filter_presets.where(recommended: params[:recommended])
        end

        # NOTE: 通知要否を設定
        search_filter_presets.map do |preset|
          preset.notification_required = preset.search_filter_preset_notifications.exists?(user: current_user)
        end

        render json: search_filter_presets, each_serializer: V1::SearchFilterPresetSerializer, adapter: :json, root: 'searchFilterPresets'
      end

      def show
        owner = current_user.company || current_user
        search_filter_preset = owner.search_filter_presets.find(params[:id])
        if search_filter_preset
          render json: search_filter_preset, serializer: V1::SearchFilterPresetSerializer, adapter: :json, root: 'searchFilterPreset'
        else
          render json: { errors: ['Not Found'] }, status: :not_found
        end
      end

      def create
        ActiveRecord::Base.transaction do
          search_filter_preset = current_user.search_filter_presets.build(search_filter_preset_params_for_create)

          if search_filter_preset.save

            service = SearchFilterPresetNotificationService.new(current_user)
            
            if ActiveRecord::Type::Boolean.new.cast(params[:subscribed]) && service.remaining_notification_count > 0
              SearchFilterPresetNotification.create!(user: current_user, search_filter_preset: search_filter_preset)

              # 既存の有効な通知設定を確認
              existing_enabled_notification = current_user.notification_methods.find_by(enabled: true)

              # 有効な通知設定がない場合のみ、メール通知を設定
              if existing_enabled_notification.nil?
                notification_method = current_user.notification_methods.find_or_initialize_by(notifiable_type: "EmailNotification")
                
                if notification_method.new_record?
                  email_notification = EmailNotification.new(email: current_user.email)
                  notification_method.notifiable = email_notification
                end
                
                notification_method.enabled = true
                notification_method.save!
              end

            end

            if ActiveRecord::Type::Boolean.new.cast(params[:recommended])
              search_filter_preset.update!(recommended: true)
            end

            render json: { id: search_filter_preset.id }, status: :created
          else
            render json: { errors: search_filter_preset.errors.full_messages }, status: :internal_server_error
          end
        end
      end

      def update
        owner = current_user.company || current_user
        search_filter_preset = owner.search_filter_presets.find(params[:id])

        if search_filter_preset.clear_and_update(search_filter_preset_params_for_update)
          render json: {}, status: :ok
        else
          render json: { errors: search_filter_preset.errors.full_messages }, status: :internal_server_error
        end
      end

      def destroy
        owner = current_user.company || current_user
        search_filter_preset = owner.search_filter_presets.find(params[:id])

        if search_filter_preset.destroy
          render json: {}, status: :ok
        else
          render json: { errors: search_filter_preset.errors.full_messages }, status: :internal_server_error
        end
      end

      private

      def search_filter_preset_params
        {
          title: params[:title],
          project_type: params[:project_type],
          keywords: params[:filter][:keywords],
          or_keywords: params[:filter][:or_keywords],
          not_keywords: params[:filter][:not_keywords],
          use_synonym_search: params[:filter][:use_synonym_search],
          prefectures: params[:filter][:prefectures],
          organizations: params[:filter][:organizations],
          procedure_types: params[:filter][:procedure_types],
          procedure_type_groups: params[:filter][:procedure_type_groups],
          period: params[:filter][:period],
          publication_date_from: params[:filter][:publication_date_from],
          publication_date_to: params[:filter][:publication_date_to],
          planned_price_from: params[:filter][:planned_price_from],
          planned_price_to: params[:filter][:planned_price_to],
          is_experience_required: params[:filter][:is_experience_required],
          is_office_required: params[:filter][:is_office_required],
          project_security_qualifications: params[:filter][:project_security_qualifications],
          deadline_days_remaining: params[:filter][:deadline_days_remaining],
          participate_qualification_ids: params[:filter][:participate_qualification_ids],
          participate_qualification_grade_ids: params[:filter][:participate_qualification_grade_ids],
          participate_qualification_types: params[:filter][:participate_qualification_types],
          participate_qualification_prefectures: params[:filter][:participate_qualification_prefectures],
          no_qualification: params[:filter][:no_qualification],
          tender_opening_date_from: params[:filter][:tender_opening_date_from],
          tender_opening_date_to: params[:filter][:tender_opening_date_to],
          business_description: params[:business_description]
        }
      end

      def search_filter_preset_params_for_create
        search_filter_preset_params.merge({ project_type: params[:project_type] })
      end

      def search_filter_preset_params_for_update
        update_params = search_filter_preset_params.except(:project_type)
        if params.key?(:recommended)
          update_params[:recommended] = params[:recommended]
        else
          update_params[:recommended] = false
        end
        update_params
      end
    end
  end
end
