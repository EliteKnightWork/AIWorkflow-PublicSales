# == Schema Information
#
# Table name: users
# Database name: primary
#
#  id                               :bigint           not null, primary key
#  email(メールアドレス)            :string(255)
#  name(ユーザー名)                 :string(255)
#  created_at                       :datetime
#  updated_at                       :datetime
#  auth0_user_id(Auth0のユーザーID) :string(255)      not null
#  company_id(企業ID)               :bigint
#
# Indexes
#
#  index_users_on_auth0_user_id  (auth0_user_id) UNIQUE
#  index_users_on_company_id     (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
class User < ApplicationRecord
  include UserSearchable
  MAX_SETTINGS_NEW_PROJECT = 2
  MAX_SETTINGS_TASK = 1

  has_many :favorites, dependent: :destroy
  has_many :favorite_projects, through: :favorites, source: :project
  has_many :search_filter_presets, dependent: :destroy
  has_many :search_filter_preset_notifications, dependent: :destroy
  has_many :notification_methods, dependent: :destroy
  has_many :browsing_histories, dependent: :destroy
  has_many :bid_pipeline_assignments, dependent: :destroy
  has_many :bid_pipeline_task_assignments, dependent: :destroy
  has_many :notification_timer_settings, dependent: :destroy
  has_many :enabled_notification_methods, -> { where(enabled: true) }, class_name: 'NotificationMethod', dependent: :destroy, inverse_of: :user
  has_many :user_tokens, dependent: :destroy
  has_many :calendar_events, dependent: :destroy
  has_many :calendar_subscriptions, dependent: :destroy
  has_many :proposal_jobs, dependent: :destroy
  has_many :proposal_documents, dependent: :destroy
  has_many :project_reactions, dependent: :destroy
  has_one :user_notification_timestamp, dependent: :destroy
  belongs_to :company, optional: true

  validate :company_id_write_once, on: :update
  validates :auth0_user_id, presence: true, uniqueness: true
  validates :email, uniqueness: true, allow_blank: true

  after_create :set_notification_methods
  after_create :set_default_notification_timer_settings
  after_create :set_default_task_notification_timer_settings

  class << self
    def from_token_payload(payload)
      begin
        find_or_create_by!(auth0_user_id: payload['sub']) do |user|
          user.email = user.auth0_email
        end
      rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotUnique
        retry
      end
    end
  end

  def notify(message)
    enabled_notification_methods.each do |notification_method|
      notification_method&.notify(message)
    end
  end

  def auth0_email
    AUTH0_CLIENT.user(auth0_user_id)['email'] if AUTH0_CLIENT
  rescue Auth0::NotFound => e
    Rails.logger.error("Auth0 user not found for #{auth0_user_id}, #{e}")
    nil
  end

  def notify_new_projects(last_notified_at: Time.zone.yesterday)
    return if search_filter_preset_notifications.empty?

    enabled_notification_methods.where(notification_type: 'new_project').find_each do |notification_method|
      notification_method.notifiable&.notify_new_projects(search_filter_preset_notifications:, last_notified_at:)
    end
  end

  def notify_task(days_before_due_date:)
    target_date = days_before_due_date.days.from_now.to_date
    tasks = BidPipelineTask.joins(:bid_pipeline_task_assignments)
                           .where(bid_pipeline_task_assignments: { user_id: id })
                           .where(due_date: target_date)
                           .not_done

    return if tasks.empty?

    enabled_notification_methods.where(notification_type: 'task').find_each do |notification_method|
      notification_method.notifiable&.notify_task(tasks: tasks, days_before_due_date: days_before_due_date)
    end
  end

  def notify_proposal_created(proposal_document_id:)
    enabled_notification_method&.notifiable&.notify_proposal_created(proposal_document_id:)
  end

  def update_with(args)
    ActiveRecord::Base.transaction do
      user_params = {}

      user_params[:name] = args[:name] if args.key?(:name)
      user_params[:email] = args[:email] if args.key?(:email)

      # company_idが空の場合は、companyをnilにする
      # company_idが空でない場合は、companyをセットする
      if args.key?(:company_id) && args[:company_id].present?
        company = Company.find(args[:company_id])
        user_params[:company] = company
      else
        user_params[:company] = nil
      end

      self.update!(user_params)
    end

    true
  rescue => e
    Rails.logger.error(e.message)
    Sentry.capture_exception(e)
    false
  end

  def update_notification_timer_settings!(notification_type:, hours:)
    return if hours.empty?

    unique_hours = hours.uniq

    begin
      ActiveRecord::Base.transaction do
        notification_timer_settings.where(notification_type: notification_type).destroy_all
        unique_hours.each do |hour|
          notification_timer_settings.create!(
            notification_type: notification_type,
            hour: hour
          )
        end
      end
    rescue => e
      Rails.logger.error(e.message)
      Sentry.capture_exception(e)
    end
  end

  def last_notified_at
    user_notification_timestamp&.last_notified_at
  end

  def update_last_notified_at(last_notified_at: Time.current)
    timestamp = user_notification_timestamp || create_user_notification_timestamp(last_notified_at: last_notified_at)
    timestamp.update(last_notified_at: last_notified_at)
  end

  private

  def company_id_write_once
    return unless will_save_change_to_company_id?

    old = attribute_in_database(:company_id)
    # company_idがnilへの変更は許可し、異なる値への変更のみ禁止
    if old.present? && company_id.present? && company_id != old
      errors.add(:company_id, '一度設定すると変更・削除できません')
    end
  end

  def set_notification_methods
    return if email.blank?

    begin
      # Create notification method for new_project
      new_project_notification_method = self.notification_methods.find_or_initialize_by(notifiable_type: 'EmailNotification', notification_type: 'new_project')

      if new_project_notification_method.notifiable.nil?
        new_project_notification_method.build_notifiable(email: email)
      else
        new_project_notification_method.notifiable.update!(email: email)
      end

      new_project_notification_method.update!(enabled: true)

      # Create notification method for task
      task_notification_method = self.notification_methods.find_or_initialize_by(notifiable_type: 'EmailNotification', notification_type: 'task')

      if task_notification_method.notifiable.nil?
        task_notification_method.build_notifiable(email: email)
      else
        task_notification_method.notifiable.update!(email: email)
      end

      task_notification_method.update!(enabled: true)
    rescue => e
      Rails.logger.error("Failed to create notification method user_id: #{id}, email: #{email}, #{e.message}")
      Sentry.capture_exception(e)
    end
  end

  def set_default_notification_timer_settings
    notification_timer_settings.create!(
      notification_type: NotificationTimerSetting::DEFAULT_NOTIFICATION_TYPE,
      hour: NotificationTimerSetting::DEFAULT_HOUR
    )
  end

  def set_default_task_notification_timer_settings
    notification_timer_settings.create!(
      notification_type: NotificationTimerSetting::DEFAULT_TASK_NOTIFICATION_TYPE,
      hour: NotificationTimerSetting::DEFAULT_HOUR,
      days_before_due_date: NotificationTimerSetting::DEFAULT_DAYS_BEFORE_DUE_DATE
    )
  end
end
