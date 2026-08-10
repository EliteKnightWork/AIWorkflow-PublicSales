class MicrosoftCalendarService
  def initialize(user_token)
    @user_token = user_token
  end

  def create_event(event_params)
    response = calendar_client.post('me/events') do |req|
      req.body = build_event_payload(event_params).to_json
    end

    if response.status != 201
      raise StandardError, "Microsoft Calendar API error: #{response.status} #{response.body}"
    end

    JSON.parse(response.body)
  end

  def start_subscription(webhook_url)
    client_state = SecureRandom.uuid

    subscription_payload = {
      changeType: "created,updated,deleted",
      notificationUrl: webhook_url,
      resource: "me/events",
      expirationDateTime: (10070.minutes.from_now).iso8601, # 10070.minutesは設定できる最大値
      clientState: client_state,
    }

    response = calendar_client.post("subscriptions") do |req|
      req.body = subscription_payload.to_json
    end

    if response.status != 201
      raise StandardError, "Microsoft Calendar subscription error: #{response.status} #{response.body}"
    end

    response_body = JSON.parse(response.body)

    subscription = CalendarSubscription.find_or_initialize_by(
      user: @user_token.user,
      provider: @user_token.token_provider,
    )

    subscription.assign_attributes(
      subscription_id: response_body["id"],
      expires_at: Time.zone.parse(response_body["expirationDateTime"]),
      webhook_url: webhook_url,
      resource_id: response_body["resource"],
      client_state: client_state,
    )

    subscription.save!

    subscription
  rescue StandardError => e
    Rails.logger.error("Failed to start Microsoft Calendar subscription: #{e.message}")
    raise e
  end

  def delete_event(event_id)
    # 存在確認のためにイベントを取得, 取得できなかった場合は削除しない
    get_response = calendar_client.get("me/events/#{event_id}")

    case get_response.status
    when 200
      delete_response = calendar_client.delete("me/events/#{event_id}")

      if delete_response.status != 204
        raise StandardError, "Microsoft Calendar API error: #{response.status} #{response.body}"
      end
    when 404, 410
      Rails.logger.info("Microsoft Calendar event not found or already deleted: #{event_id}")
      return
    else
      raise StandardError, "Unexpected response while checking event existence: #{get_response.status} #{get_response.body}"
    end
  rescue StandardError => e
    Rails.logger.error("Failed to delete Microsoft Calendar event: #{e.message}")
    raise e
  end

  def update_subscription(webhook_url)
    subscription = CalendarSubscription.find_by(
      user: @user_token.user,
      provider: @user_token.token_provider
    )

    unless subscription
      raise StandardError, "No subscription found for user #{@user_token.user.id} with provider #{@user_token.token_provider}"
    end

    response = calendar_client.patch("subscriptions/#{subscription.subscription_id}") do |req|
      req.body = {
        expirationDateTime: (10070.minutes.from_now).iso8601, # 10070.minutesは設定できる最大値
      }.to_json
    end

    if response.success?
      data = JSON.parse(response.body)
      subscription.update!(
        expires_at: Time.zone.parse(data["expirationDateTime"]),
        webhook_url: webhook_url
      )
    else
      raise StandardError, "Failed to update Microsoft Calendar subscription: #{response.status} #{response.body}"
    end

    subscription
  end

  private

  def build_event_payload(params)
    {
      subject: params[:summary],
      body: {
        contentType: "HTML",
        content: params[:description] || ""
      },
      start: build_date(params[:start], params[:all_day]),
      end: build_date(params[:end], params[:all_day]),
      isAllDay: params[:all_day] || false
    }
  end

  def build_date(date, all_day)
    if all_day
      { dateTime: date.to_date.to_s + "T00:00:00", timeZone: "Asia/Tokyo" }
    else
      { dateTime: date.iso8601, timeZone: "Asia/Tokyo" }
    end
  end

  def calendar_client
    if @calendar_client.nil? || @user_token.expired?
      refresh_access_token_if_needed!

      @calendar_client = Faraday.new(url: 'https://graph.microsoft.com/v1.0/') do |conn|
        conn.request :url_encoded
        conn.response :logger, Rails.logger, bodies: true
        conn.adapter Faraday.default_adapter
        conn.headers['Authorization'] = "Bearer #{@user_token.access_token}"
        conn.headers['Content-Type'] = 'application/json'
      end
    end

    @calendar_client
  end

  def refresh_access_token_if_needed!
    return unless @user_token.expired?

    response = Faraday.post("https://login.microsoftonline.com/common/oauth2/v2.0/token") do |req|
      req.headers["Content-Type"] = "application/x-www-form-urlencoded"
      req.body = URI.encode_www_form(
        client_id: ENV["MICROSOFT_CLIENT_ID"],
        client_secret: ENV["MICROSOFT_CLIENT_SECRET"],
        grant_type: "refresh_token",
        refresh_token: @user_token.refresh_token,
        redirect_uri: ENV["MICROSOFT_REDIRECT_URI"]
      )
    end

    if response.status != 200
      raise StandardError, "Failed to refresh token: #{response.status} #{response.body}"
    end

    data = JSON.parse(response.body)

    @user_token.update!(
      access_token: data["access_token"],
      refresh_token: data["refresh_token"],
      expires_at: Time.current + data["expires_in"].seconds
    )
  end
end
