require 'rails_helper'

RSpec.describe 'BidPipelineStatuses' do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }

  describe 'GET /bid_pipeline_statuses' do
    context 'ログインしている場合' do
      before { login_as(user) }

      it '200が返ること' do
        for i in 1..3 do
          create(:bid_pipeline_status, company: company, order: i)
        end
        get '/v1/bid_pipeline_statuses'

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelineStatuses'].length).to eq(3)
        end
      end

      it '編集不可のステータスが含まれること' do
        create(:bid_pipeline_status, company: company, order: 1, is_uneditable: true)
        create(:bid_pipeline_status, company: company, order: 2, is_uneditable: false)

        get '/v1/bid_pipeline_statuses'

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelineStatuses'].length).to eq(2)
          expect(json['bidPipelineStatuses'][0]['isUneditable']).to be(true)
          expect(json['bidPipelineStatuses'][1]['isUneditable']).to be(false)
        end
      end


      it 'companyが存在しない場合、403が返ること' do
        user.company = nil
        get '/v1/bid_pipeline_statuses'
        expect(response).to have_http_status(:forbidden)
      end
    end

    context 'ログインしていない場合' do
      it '401が返ること' do
        get '/v1/bid_pipeline_statuses'
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'POST /bid_pipeline_statuses' do
    context 'ログインしている場合' do
      before { login_as(user) }

      it '最初に作成する場合はorder=1, is_deafult=Trueで作成されること' do
        post '/v1/bid_pipeline_statuses', params: { name: 'test', stage: 'doing' }

        aggregate_failures do
          assert_response_schema_confirm(201)
          expect(BidPipelineStatus.count).to eq(1)
          expect(BidPipelineStatus.first.name).to eq('test')
          expect(BidPipelineStatus.first.stage).to eq('doing')
          expect(BidPipelineStatus.first.order).to eq(1)
        end
      end

      it '3個目のステータスはorder=3, デフォルトフラグがfalseであること' do
        for i in 1..2 do
          create(:bid_pipeline_status, company: company, order: i)
        end
        post '/v1/bid_pipeline_statuses', params: { name: 'test', stage: 'doing' }

        aggregate_failures do
          assert_response_schema_confirm(201)
          expect(BidPipelineStatus.count).to eq(3)
          expect(BidPipelineStatus.last.name).to eq('test')
          expect(BidPipelineStatus.last.stage).to eq('doing')
          expect(BidPipelineStatus.last.order).to eq(3)
        end
      end

      it 'stageをdoneで作成できること' do
        post '/v1/bid_pipeline_statuses', params: { name: 'test', stage: 'done' }

        aggregate_failures do
          assert_response_schema_confirm(201)
          expect(BidPipelineStatus.count).to eq(1)
          expect(BidPipelineStatus.first.stage).to eq('done')
        end
      end

      it 'stageが指定されていない場合はデフォルト値doingが設定されて201が返ること' do
        post '/v1/bid_pipeline_statuses', params: { name: 'test' }

        aggregate_failures do
          expect(response).to have_http_status(:created)
          assert_response_schema_confirm(201)
          created_status = company.bid_pipeline_statuses.find_by(name: 'test')
          expect(created_status.stage).to eq('doing')
        end
      end

      it '不正なstageを指定した場合は400が返ること' do
        post '/v1/bid_pipeline_statuses', params: { name: 'test', stage: 'invalid' }

        aggregate_failures do
          assert_response_schema_confirm(400)
          json = response.parsed_body
          expect(json['errors']).to be_present
        end
      end
    end

    context 'ログインしていない場合' do
      it '401が返ること' do
        post '/v1/bid_pipeline_statuses', params: { name: 'test', stage: 'doing' }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'PUT /bid_pipeline_statuses/:id' do
    context 'ログインしている場合' do
      before { login_as(user) }

      it 'ステータスの更新ができること' do
        status = create(:bid_pipeline_status, company: company)
        put "/v1/bid_pipeline_statuses/#{status.id}", params: { name: 'updated' }

        aggregate_failures do
          assert_response_schema_confirm(200)
          expect(status.reload.name).to eq('updated')
        end
      end

      it 'orderの更新ができること' do
        for i in 1..3 do
          create(:bid_pipeline_status, company: company, order: i)
        end
        status = create(:bid_pipeline_status, company: company, order: 4)
        put "/v1/bid_pipeline_statuses/#{status.id}", params: { order: 2 }

        aggregate_failures do
          assert_response_schema_confirm(200)
          expect(status.reload.order).to eq(2)
        end
      end
    end

    context 'ログインしていない場合' do
      it '401が返ること' do
        put "/v1/bid_pipeline_statuses/#{create(:bid_pipeline_status, company: company).id}", params: { name: 'updated' }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'DELETE /bid_pipeline_statuses/:id' do
    context 'ログインしている場合' do
      before { login_as(user) }

      it 'ステータスの削除ができること' do
        status = create(:bid_pipeline_status, company: company)
        delete "/v1/bid_pipeline_statuses/#{status.id}"

        aggregate_failures do
          assert_response_schema_confirm(200)
          expect(BidPipelineStatus.count).to eq(0)
        end
      end

      it '編集不可のステータスは削除できないこと' do
        status = create(:bid_pipeline_status, company: company, is_uneditable: true)
        expect(status.company_id).to eq(user.company_id) # Ensure status belongs to user's company
        
        delete "/v1/bid_pipeline_statuses/#{status.id}"

        aggregate_failures do
          assert_response_schema_confirm(400)
          expect(response).to have_http_status(:bad_request)
          json = response.parsed_body
          expect(json['errors']).to include('Is uneditable編集不可のステータスは削除できません')
          expect(BidPipelineStatus.exists?(status.id)).to be(true)
        end
      end
    end

    context 'ログインしていない場合' do
      it '401が返ること' do
        delete "/v1/bid_pipeline_statuses/#{create(:bid_pipeline_status, company: company).id}"
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
