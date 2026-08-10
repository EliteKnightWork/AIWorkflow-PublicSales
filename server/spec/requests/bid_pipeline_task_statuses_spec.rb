require 'rails_helper'

RSpec.describe 'BidPipelineTaskStatuses' do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }

  describe 'GET /bid_pipeline_task_statuses' do
    context 'ログインしている場合' do
      before { login_as(user) }

      it '200が返ること' do
        for i in 1..3 do
          create(:bid_pipeline_task_status, company: company, order: i)
        end
        get '/v1/bid_pipeline_task_statuses'

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelineTaskStatuses'].length).to eq(3)
        end
      end

      it 'companyが存在しない場合、403が返ること' do
        user.company = nil
        get '/v1/bid_pipeline_task_statuses'
        expect(response).to have_http_status(:forbidden)
      end
    end

    context 'ログインしていない場合' do
      it '401が返ること' do
        get '/v1/bid_pipeline_task_statuses'
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'POST /bid_pipeline_task_statuses' do
    context 'ログインしている場合' do
      before { login_as(user) }

      it '最初に作成する場合はorder=1, is_deafult=Trueで作成されること' do
        post '/v1/bid_pipeline_task_statuses', params: { name: 'test' }

        aggregate_failures do
          expect(response).to have_http_status(:created)
          expect(BidPipelineTaskStatus.count).to eq(1)
          expect(BidPipelineTaskStatus.first.name).to eq('test')
          expect(BidPipelineTaskStatus.first.order).to eq(1)
          expect(BidPipelineTaskStatus.first.is_default).to be(true)
        end
      end

      it '2個目以降のステータスはデフォルトフラグがfalseであること' do
        create(:bid_pipeline_task_status, company: company)
        post '/v1/bid_pipeline_task_statuses', params: { name: 'test' }

        aggregate_failures do
          expect(response).to have_http_status(:created)
          expect(BidPipelineTaskStatus.count).to eq(2)
          expect(BidPipelineTaskStatus.last.is_default).to be(false)
        end
      end
    end
  end

  context 'ログインしていない場合' do
    it '401が返ること' do
      post '/v1/bid_pipeline_task_statuses', params: { name: 'test' }
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'PUT /bid_pipeline_task_statuses/:id' do
    context 'ログインしている場合' do
      before { login_as(user) }

      it 'ステータス名が更新されること' do
        status = create(:bid_pipeline_task_status, company: company)

        put "/v1/bid_pipeline_task_statuses/#{status.id}", params: { name: 'new name' }

        aggregate_failures do
          expect(response).to have_http_status(:ok)
          expect(status.reload.name).to eq('new name')
        end
      end

      it 'orderの更新ができること' do
        status1 = create(:bid_pipeline_task_status, company: company, order: 1)
        status2 = create(:bid_pipeline_task_status, company: company, order: 2)

        put "/v1/bid_pipeline_task_statuses/#{status1.id}", params: { order: 2 }

        aggregate_failures do
          expect(response).to have_http_status(:ok)
          expect(status1.reload.order).to eq(2)
          expect(status2.reload.order).to eq(1)
        end
      end

      it 'is_defaultの更新ができること' do
        status1 = create(:bid_pipeline_task_status, company: company, is_default: true)
        status2 = create(:bid_pipeline_task_status, company: company, is_default: false)

        put "/v1/bid_pipeline_task_statuses/#{status2.id}", params: { is_default: true }

        aggregate_failures do
          expect(response).to have_http_status(:ok)
          expect(status1.reload.is_default).to be(false)
          expect(status2.reload.is_default).to be(true)
        end
      end
    end

    context 'ログインしていない場合' do
      it '401が返ること' do
        status = create(:bid_pipeline_task_status, company: company)
        put "/v1/bid_pipeline_task_statuses/#{status.id}", params: { name: 'new name' }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'DELETE /bid_pipeline_task_statuses/:id' do
    context 'ログインしている場合' do
      before { login_as(user) }

      it 'ステータスが削除されること' do
        status = create(:bid_pipeline_task_status, company: company)

        delete "/v1/bid_pipeline_task_statuses/#{status.id}"

        aggregate_failures do
          expect(response).to have_http_status(:ok)
          expect(BidPipelineTaskStatus.count).to eq(0)
        end
      end
    end

    context 'ログインしていない場合' do
      it '401が返ること' do
        delete "/v1/bid_pipeline_task_statuses/#{create(:bid_pipeline_task_status, company: company).id}"
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
