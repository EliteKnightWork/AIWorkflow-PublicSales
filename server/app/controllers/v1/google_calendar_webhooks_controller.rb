module V1
  class GoogleCalendarWebhooksController < ApplicationController
    skip_before_action :require_login

    GOOGLE_HEADER_KEYS = %w[
      X-Goog-Channel-Id
      X-Goog-Channel-Token
      X-Goog-Resource-Id
      X-Goog-Resource-Uri
      X-Goog-Message-Number
      X-Goog-Resource-State
      X-Goog-Changed
    ].freeze

    def create
      channel_id = request.headers['X-Goog-Channel-ID']
      resource_state = request.headers['X-Goog-Resource-State']

      client_state = params['client_state']

      subscription = CalendarSubscription.find_by(subscription_id: channel_id)
      unless subscription
        render json: { error: 'Subscription not found' }, status: :not_found
        return
      end

      subscription.calendar_webhook_logs.create!(
        provider: 'google_oauth2',
        raw_payload: extract_google_headers(request),
        received_at: Time.zone.now,
      )

      unless subscription.check_client_state(client_state)
        render json: { error: 'Invalid client state' }, status: :bad_request
        return
      end

      if resource_state == 'sync'
        # sync通知はsubscriptionを新規作成した直後に1回だけ送信される
        # next_sync_tokenを更新して、今後の変更を検知できるようにする
        list_events_with_update_next_sync_token(subscription)
        render json: { message: 'Sync event received, no action taken' }, status: :ok
        return
      end

      deleted_events = check_deleted_events(subscription)
      if deleted_events.empty?
        render json: { message: 'No deleted events found' }, status: :ok
        return
      end

      # 案件管理や案件管理タスク経由で、残っているカレンダーイベントを全て削除した後、
      # 案件管理や案件管理タスク自体も削除する
      deleted_events.each do |event|
        # キャッシュを利用しないようにDBから再取得
        CalendarEvent.where(registrable: event.registrable, due_date_type: event.due_date_type).find_each do |e|
          e.destroy_with_external_calendar_event!
        end

        # 案件管理タスクの場合は、案件管理タスク自体も削除
        if event.registrable_type == 'BidPipelineTask'
          event.registrable.destroy!
        end
      end

      render json: { message: 'Webhook received successfully' }, status: :ok
    end

    private

    # Googleのヘッダー情報を抽出
    def extract_google_headers(request)
      GOOGLE_HEADER_KEYS.index_with do |key|
        request.headers[key]
      end
    end

    # next_sync_tokenを更新しつつ、イベント一覧を取得
    def list_events_with_update_next_sync_token(subscription)
      token = subscription.user.user_tokens.find_by(token_provider: 'google_oauth2')

      # subscriptionのnext_sync_tokenが存在すればそれを利用し、存在しなければnilを渡してフルスキャン実行
      next_sync_token = subscription.next_sync_token.presence

      response = GoogleCalendarService.new(token).list_events(next_sync_token)

      # 新しいsync_tokenを保存
      subscription.update!(next_sync_token: response[:next_sync_token])

      response[:events]
    end

    # 削除されたCalendarEventのインスタンスを取得
    def check_deleted_events(subscription)
      events = list_events_with_update_next_sync_token(subscription)
      return [] if events.empty?

      calendar_events = subscription.user.calendar_events.where(
        provider: subscription.provider,
        start_time: (7.days.ago).., # 7日前からのイベントを対象（7日前までしか同期しない）
      )
      calendar_event_hash = calendar_events.index_by(&:event_id)

      events.filter_map do |event|
        calendar_event_hash[event[:id]] if event[:status] == 'cancelled' && calendar_event_hash[event[:id]].present?
      end
    end
  end
end
