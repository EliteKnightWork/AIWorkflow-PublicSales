# == Schema Information
#
# Table name: slack_notifications
# Database name: primary
#
#  id                       :bigint           not null, primary key
#  webhook_url(Webhook URL) :text(65535)      not null
#  created_at               :datetime         not null
#  updated_at               :datetime         not null
#
class SlackNotification < ApplicationRecord
  encrypts :webhook_url

  include Notifiable
  require 'uri'

  VALUE = 'slack'.freeze
  MAX_MESSAGE_LENGTH = 10_000

  def notify(message)
    return if webhook_url.blank?

    begin
      notifier = Slack::Notifier.new(webhook_url)
      lines = message.split("\n")
      chunks = []
      current_chunk = ""

      lines.each do |line|
        if (current_chunk + line + "\n").size > MAX_MESSAGE_LENGTH
          chunks << current_chunk
          current_chunk = line + "\n"
        else
          current_chunk << (line + "\n")
        end
      end

      chunks << current_chunk unless current_chunk.empty?

      chunks.each_with_index do |chunk, idx|
        prefix = chunks.size > 1 ? "(#{idx + 1}/#{chunks.size})\n" : ""
        notifier.ping("#{prefix}#{chunk}")
        sleep 0.5 # Slackへの連投を避けるために少し間隔を空ける
      end
      logger.debug("Slack notification sent: #{message}")
    rescue => e
      logger.error("Failed to send Slack notification: #{e.message}")
      logger.error(e.backtrace.join("\n"))
    end
  end

  def notify_new_projects(search_filter_preset_notifications:, last_notified_at:)
    new_projects = Project.for_company(nil).fetch_new_projects(search_filter_preset_notifications:, last_notified_at:)

    new_recommendations = Project.for_company(nil).fetch_new_recommendations(search_filter_preset_notifications:)
    message = build_notification_message(new_projects, new_recommendations)
    notify(message)
  end

  def notify_task(tasks:, days_before_due_date:)
    message = build_notification_message_for_task(tasks, days_before_due_date)
    notify(message)
  end

  private

  def build_notification_message(new_projects, new_recommendations)
    total_projects = new_projects.values.sum(&:count)
    message = "いつもLabidをご利用いただき、ありがとうございます！\n"
    message += "絞り込み条件にマッチした新着案件は【合計#{total_projects}件】でした！\n\n"
    message += "【#{Time.zone.today.strftime('%Y/%m/%d')} 絞り込み条件にマッチした新着案件】\n"

    new_projects.each.with_index(1) do |(preset, projects), index|

      message += "\n--------------------------------------------------\n"
      message += "設定した絞り込み条件#{index}\n"
      message += "#{preset.as_text}\n"
      message += "--------------------------------------------------\n"

      if projects.count > 0
        message += "<入札案件>\n"
      end
      ProjectDecorator.decorate_collection(projects).each.with_index(1) do |project, project_index|
        message += "☆#{project_index}件目☆\n"
        message += "【#{project.title}】\n"
        message += "#{project.url}\n"
        message += "発注機関: #{project.organization_name}\n"
        message += "公告日: #{project.publication_date}\n"
        message += "入札締切日: #{project.bidding_deadline_date}\n\n\n"
      end

      if new_recommendations[preset].present?
        message += "<イチオシ案件>\n"
        message += "新着のイチオシ案件があります！\n"
        ProjectDecorator.decorate_collection(new_recommendations[preset]).each.with_index(1) do |project, rec_index|
          message += "☆#{rec_index}件目☆\n"
          message += "【#{project.title}】\n"
          message += "#{project.url}\n"
          message += "発注機関: #{project.organization_name}\n"
          message += "公告日: #{project.publication_date}\n"
          message += "入札締切日: #{project.bidding_deadline_date}\n\n\n"
        end
      end

      message += "この絞り込み条件の新着入札案件は【#{projects.count}件】でした\n"
      if projects.count > 0
        message += "この絞り込み条件の受付中案件はこちら\n"
        message += "#{ENV.fetch('CLIENT_ORIGIN')}/projects?#{preset.as_query.gsub(/publicationDateFrom=[^&]*&?|publicationDateTo=[^&]*&?/, '')}&publicationDateFrom=#{1.day.ago.strftime('%Y-%m-%d')}&publicationDateTo=#{Time.zone.today.strftime('%Y-%m-%d')}\n"
      end
      message += "\n"
    end

    message
  end

  def build_notification_message_for_task(tasks, days_before_due_date)
    return if tasks.empty?

    message = "いつもLabidをご利用いただき、ありがとうございます！\n"

    if days_before_due_date == 0
      message += "🚨本日がタスクの期日です🚨　確認して対応しましょう！\n\n"
    else
      message += "🚨タスクの期日が#{days_before_due_date}日後に迫っています🚨　確認して対応しましょう！\n\n"
    end

    tasks.each do |task|
      message += "--------------------------------------------------\n"
      message += "タスク名: #{task.title}\n"
      message += "期日: #{task.due_date.strftime('%Y年%m月%d日')}\n"
      message += "URL: #{ENV.fetch('CLIENT_ORIGIN')}/management?type=tasks&filters=#{URI.encode_www_form_component(task.title)}\n"
      message += "--------------------------------------------------\n\n"
    end
    message
  end
end
