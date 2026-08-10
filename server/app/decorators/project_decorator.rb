class ProjectDecorator < ApplicationDecorator
  delegate_all

  def publication_date
    return if object.publication_date.blank?

    l(object.publication_date.to_date)
  end

  def bidding_deadline_date
    return if object.bidding_deadline_date.blank?

    l(object.bidding_deadline_date.to_date)
  end

  def application_document_deadline_date
    return if object.application_document_deadline_date.blank?

    l(object.application_document_deadline_date.to_date)
  end

  def proposal_document_deadline_date
    return if object.proposal_document_deadline_date.blank?

    l(object.proposal_document_deadline_date.to_date)
  end

  def briefing_session_date
    return if object.briefing_session_date.blank?

    l(object.briefing_session_date.to_date)
  end

  def registration_date
    return if object.registration_date.blank?

    l(object.registration_date.to_date)
  end

  def is_new_arrival
    return if object.publication_date.blank?

    object.publication_date >= Time.zone.today.in_time_zone
  end

  def url
    "#{ENV.fetch('CLIENT_ORIGIN')}/projects/#{object.uuid}"
  end

  def prefectures
    object.lg_codes.map(&:name)
  end

  def is_favorite?(user)
    return false unless user

    # exists?だとN+1問題が発生するためany?を使用
    user.favorites.any? { |favorite| favorite.project_id == object.id }
  end

  def is_summarized?(user)
    return false unless user
    return false unless user.company

    # exists?だとN+1問題が発生するためany?を使用
    user.company.project_summary_usages.any? { |project_summary_usage| project_summary_usage.project_id == object.id }
  end

  def hidden_at
    I18n.l(object.hidden_at, format: :long) if object.hidden_at
  end

  def has_browsed?(user)
    return false unless user

    user.browsing_histories.any? { |read| read.browsable_type == 'Project' && read.browsable_id == object.id }
  end
end
