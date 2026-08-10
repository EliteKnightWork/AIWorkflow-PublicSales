require 'rails_helper'

RSpec.describe 'V1::BidPipelines::CalendarEvents' do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let(:user_token) { create(:user_token, user: user, token_provider: 'google_oauth2') }

  let(:bid_pipeline) { create(:bid_pipeline, company: company) }

  before { login_as(user) }

  describe 'POST /bid_pipelines/:bid_pipeline_id/calendar_events' do
    let(:start_date_time) { Time.current }
    let(:params) do
      {
        start_date_time: start_date_time,
        all_day: false,
        duration: 60, # 1 hour
        due_date_type: 'application_document_deadline_date', # Example type
      }
    end

    it 'creates calendar events for assigned users' do
      bid_pipeline.assigned_users << user

      allow(GoogleCalendarService).to receive(:new).with(user_token)
        .and_return(instance_double(
          GoogleCalendarService,
          create_event: { 'id' => 'event123' },
          start_subscription: {},
        ))

      post "/v1/bid_pipelines/#{bid_pipeline.id}/calendar_events", params: params

      aggregate_failures do
        expect(response).to have_http_status(:created)
        expect(user.calendar_events.count).to eq(1)
        event = user.calendar_events.first
        expect(event.registrable).to eq(bid_pipeline)
        expect(event.provider).to eq(user_token.token_provider)
        expect(event.event_id).to eq('event123')
        expect(event.sync_status).to eq('synced')
        expect(event.due_date_type).to eq('application_document_deadline_date')
      end
    end

    it 'returns error if start date time is missing' do
      params[:start_date_time] = nil

      post "/v1/bid_pipelines/#{bid_pipeline.id}/calendar_events", params: params

      expect(response).to have_http_status(:bad_request)
      expect(response.body).to include('Start date time is required')
    end

    it 'handles errors when creating calendar events' do
      bid_pipeline.assigned_users << user
      allow(GoogleCalendarService).to receive(:new).with(user_token)
      allow_any_instance_of(GoogleCalendarService).to receive(:start_subscription).and_raise(StandardError.new('API error'))

      post "/v1/bid_pipelines/#{bid_pipeline.id}/calendar_events", params: params

      expect(response).to have_http_status(:internal_server_error)
      expect(user.calendar_events.count).to eq(1)
      expect(user.calendar_events.first.sync_status).to eq('syncing_failed')
    end

    it 'does not create duplicate calendar events for the same user' do
      bid_pipeline.assigned_users << user
      user.calendar_events.create!(
        registrable: bid_pipeline,
        provider: user_token.token_provider,
        event_id: 'existing_event',
        sync_status: 'synced',
        due_date_type: 'application_document_deadline_date',
        start_time: start_date_time,
        duration_minutes: 60
      )

      post "/v1/bid_pipelines/#{bid_pipeline.id}/calendar_events", params: params

      expect(response).to have_http_status(:created)
      expect(user.calendar_events.count).to eq(1) # Should not create a duplicate
    end

    it 'creates calendar events with other due date type' do
      params[:due_date_type] = 'proposal_document_deadline_date'

      bid_pipeline.assigned_users << user
      user.calendar_events.create!(
        registrable: bid_pipeline,
        provider: user_token.token_provider,
        event_id: 'existing_event',
        sync_status: 'synced',
        due_date_type: 'application_document_deadline_date',
        start_time: start_date_time,
        duration_minutes: 60
      )

      allow(GoogleCalendarService).to receive(:new).with(user_token)
        .and_return(instance_double(
          GoogleCalendarService,
          create_event: { 'id' => 'event456' },
          start_subscription: {},
        ))

      post "/v1/bid_pipelines/#{bid_pipeline.id}/calendar_events", params: params

      aggregate_failures do
        expect(response).to have_http_status(:created)
        expect(user.calendar_events.count).to eq(2) # Should create a new event
        event = user.calendar_events.find_by(due_date_type: 'proposal_document_deadline_date')
        expect(event.registrable).to eq(bid_pipeline)
        expect(event.provider).to eq(user_token.token_provider)
        expect(event.event_id).to eq('event456')
        expect(event.sync_status).to eq('synced')
      end
    end
  end
end
