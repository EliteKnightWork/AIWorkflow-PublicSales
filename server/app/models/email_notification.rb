# == Schema Information
#
# Table name: email_notifications
# Database name: primary
#
#  id                    :bigint           not null, primary key
#  email(メールアドレス) :text(65535)
#  created_at            :datetime
#  updated_at            :datetime
#
class EmailNotification < ApplicationRecord
  encrypts :email, deterministic: true

  include Notifiable

  VALUE = 'email'.freeze

  def notify(message)
    # TODO: Implement email notification
    logger.debug("Email notification: #{message}")
    raise NotImplementedError
  end

  def notify_new_projects(search_filter_preset_notifications:, last_notified_at:)
    new_projects = Project.for_company(nil).fetch_new_projects(search_filter_preset_notifications:, last_notified_at:)

    new_recommendations = Project.for_company(nil).fetch_new_recommendations(search_filter_preset_notifications:)
    UserMailer.with(email: email, new_projects: new_projects, new_recommendations: new_recommendations).new_projects.deliver_now
  end

  def notify_task(tasks:, days_before_due_date:)
    UserMailer.with(email: email, tasks: tasks, days_before_due_date: days_before_due_date).task.deliver_now
  end
end
