class GoogleCalendarService
  def initialize(user_token, calendar_id: 'primary')
    @user_token = user_token
    @calendar_id = calendar_id
  end

  def create_event(event_params)
    calendar_client.insert_event(@calendar_id, build_event(event_params))
  end

  def start_subscription(webhook_url)
    channel_id = SecureRandom.uuid
    client_state = SecureRandom.uuid

    channel = Google::Apis::CalendarV3::Channel.new(
      id: channel_id,
      type: 'web_hook',
      address: webhook_url + "?client_state=#{client_state}",
    )

    res = calendar_client.watch_event(@calendar_id, channel)

    expires_at = Time.zone.at(res.expiration.to_i / 1000).utc

    subscription = CalendarSubscription.find_or_initialize_by(
      user: @user_token.user,
      provider: @user_token.token_provider,
    )

    subscription.assign_attributes(
      subscription_id: res.id,
      expires_at: expires_at,
      webhook_url: webhook_url,
      resource_id: res.resource_id,
      client_state: client_state,
    )

    subscription.save!

    subscription
  rescue StandardError => e
    Rails.logger.error("Failed to start Google Calendar subscription: #{e.message}")
    raise e
  end

  def list_events(sync_token)
    next_sync_token = nil
    page_token = nil
    events = []

    loop do
      response = calendar_client.list_events(
        @calendar_id,
        page_token: page_token,
        sync_token: sync_token,
        show_deleted: true,
        single_events: true
      )

      events.concat(response.items.map { |event| { id: event.id, status: event.status } })
      page_token = response.next_page_token
      next_sync_token = response.next_sync_token.presence
    break unless page_token
    end

    { events: events, next_sync_token: next_sync_token }
  rescue Google::Apis::ClientError => e
    if e.status_code == 410
      # 410 Gone エラーは、sync tokenが期限切れの場合に発生する
      Rails.logger.info("Google Calendar sync token expired, full sync required")
      return list_events(nil)
    end

    Rails.logger.error("Failed to list Google Calendar events: #{e.message}")
    raise e
  rescue StandardError => e
    Rails.logger.error("Unexpected error while listing Google Calendar events: #{e.message}")
    raise e
  end

  def delete_event(event_id)
    # 存在確認のためにイベントを取得, 取得できなかった場合は削除しない
    calendar_client.get_event(@calendar_id, event_id)
    calendar_client.delete_event(@calendar_id, event_id)
  rescue Google::Apis::ClientError => e
    if e.status_code == 404 || e.status_code == 410
      Rails.logger.info("Google Calendar event not found or already deleted: #{event_id}")
      return
    else
      Rails.logger.error("Failed to delete Google Calendar event: #{e.message}")
      raise e
    end
  rescue StandardError => e
    Rails.logger.error("Unexpected error while deleting Google Calendar event: #{e.message}")
    raise e
  end

  def update_subscription(webhook_url)
    subscription = CalendarSubscription.find_by(
      user: @user_token.user,
      provider: @user_token.token_provider,
    )

    unless subscription
      raise StandardError, "No subscription found for user #{@user_token.user.id} with provider #{@user_token.token_provider}"
    end

    # subscriptionが期限切れではない場合は停止する
    unless subscription.expired?
      stop_channel = Google::Apis::CalendarV3::Channel.new(
        id: subscription.subscription_id,
        resource_id: subscription.resource_id
      )

      calendar_client.stop_channel(stop_channel)
    end

    channel_id = SecureRandom.uuid

    channel = Google::Apis::CalendarV3::Channel.new(
      id: channel_id,
      type: 'web_hook',
      address: webhook_url + "?client_state=#{subscription.client_state}",
    )

    res = calendar_client.watch_event(@calendar_id, channel)

    subscription.update!(
      subscription_id: channel_id,
      expires_at:  Time.zone.at(res.expiration.to_i / 1000).utc,
      webhook_url: webhook_url
    )

    subscription
  end

  private

  def build_event(params)
    Google::Apis::CalendarV3::Event.new(
      summary: params[:summary],
      description: params[:description] || "",
      start: build_date(params[:start], params[:all_day]),
      end: build_date(params[:end], params[:all_day]),
    )
  end

  def build_date(date, all_day)
    if all_day
      { date: date.to_date.to_s }
    else
      { date_time: date.iso8601, time_zone: "Asia/Tokyo" }
    end
  end

  def calendar_client
    @calendar_client ||= begin
      service = Google::Apis::CalendarV3::CalendarService.new
      service.authorization = ensure_valid_oauth_client
      service
    end
  end

  def ensure_valid_oauth_client
    client = Signet::OAuth2::Client.new(
      client_id: ENV['GOOGLE_CLIENT_ID'],
      client_secret: ENV['GOOGLE_CLIENT_SECRET'],
      token_credential_uri: 'https://oauth2.googleapis.com/token',
      access_token: @user_token.access_token,
      refresh_token: @user_token.refresh_token
    )

    if @user_token.expired?
      client.refresh!
      @user_token.update!(
        access_token: client.access_token,
        refresh_token: client.refresh_token,
        expires_at: Time.current + client.expires_in.seconds
      )
    end

    client
  end
end
