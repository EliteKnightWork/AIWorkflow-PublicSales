namespace :once_scripts do
  desc 'タイムスタンプがセットされていないテーブルに現在時刻を追加する'
  task :set_timestamp => :environment do
    #　bid_companies
    BidCompany.where(created_at: nil).find_each do |bid_company|
      bid_company.update(created_at: Time.current)
      bid_company.update(updated_at: Time.current)

      bid_company.save!
    end

    # bidders
    Bidder.where(created_at: nil).find_each do |bidder|
      bidder.update(created_at: Time.current)
      bidder.update(updated_at: Time.current)

      bidder.save!
    end

    # chatwork_notifications
    ChatworkNotification.where(created_at: nil).find_each do |chatwork_notification|
      chatwork_notification.update(created_at: Time.current)
      chatwork_notification.update(updated_at: Time.current)

      chatwork_notification.save!
    end

    # email_notifications
    EmailNotification.where(created_at: nil).find_each do |email_notification|
      email_notification.update(created_at: Time.current)
      email_notification.update(updated_at: Time.current)

      email_notification.save!
    end

    # external_documents
    ExternalDocument.where(created_at: nil).find_each do |external_document|
      external_document.update(created_at: Time.current)
      external_document.update(updated_at: Time.current)

      external_document.save!
    end

    # notification_methods
    NotificationMethod.where(created_at: nil).find_each do |notification_method|
      notification_method.update(created_at: Time.current)
      notification_method.update(updated_at: Time.current)

      notification_method.save!
    end

    # search_filter_presets
    SearchFilterPreset.where(created_at: nil).find_each do |search_filter_preset|
      search_filter_preset.update(created_at: Time.current)
      search_filter_preset.update(updated_at: Time.current)

      search_filter_preset.save!
    end

    # slack_notifications
    SlackNotification.where(created_at: nil).find_each do |slack_notification|
      slack_notification.update(created_at: Time.current)
      slack_notification.update(updated_at: Time.current)

      slack_notification.save!
    end

    # users
    User.where(created_at: nil).find_each do |user|
      user.update(created_at: Time.current)
      user.update(updated_at: Time.current)

      user.save!
    end
  end
end
