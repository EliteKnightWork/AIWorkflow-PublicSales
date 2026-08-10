require 'rails_helper'

RSpec.describe 'BidPipelines' do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }

  before { login_as(user) }

  describe 'GET /bid_pipelines' do
    let(:status_ahead) { create(:bid_pipeline_status, company: company, order: 1) }
    let(:status_after) { create(:bid_pipeline_status, company: company, order: 2) }
    let(:other_user_ahead) { create(:user, company: company, name: 'abc') }
    let(:other_user_after) { create(:user, company: company, name: 'bcd') }
    let(:project_ahead) { create(:project, bidding_deadline_date: Time.zone.today, raw_title: 'abc') }
    let(:project_after) { create(:project, bidding_deadline_date: Time.zone.today + 1.day, raw_title: 'bcd') }

    context '通常系' do
      it 'bid_pipelinesが取得できること（1件）' do
        pipeline = create(:bid_pipeline, company: company, project: project_ahead, status: status_ahead)
        create(:bid_pipeline_assignment, bid_pipeline: pipeline, user: other_user_ahead)

        get '/v1/bid_pipelines'

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelines'].length).to eq(1)
          expect(json['bidPipelines'][0]['project']['uuid']).to eq(project_ahead.uuid)
          expect(json['bidPipelines'][0]['status']['name']).to eq(status_ahead.name)
          expect(json['bidPipelines'][0]['assignedUsers'][0]['name']).to eq(other_user_ahead.name)
        end
      end

      it 'bid_pipelinesが取得できること（複数件）' do
        pipeline1 = create(:bid_pipeline, company: company, project: project_ahead, status: status_ahead)
        pipeline2 = create(:bid_pipeline, company: company, project: project_after, status: status_ahead)
        create(:bid_pipeline_assignment, bid_pipeline: pipeline1, user: other_user_ahead)
        create(:bid_pipeline_assignment, bid_pipeline: pipeline2, user: other_user_ahead)

        get '/v1/bid_pipelines'

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelines'].length).to eq(2)
          expect(json['bidPipelines'][0]['project']['uuid']).to eq(project_ahead.uuid)
          expect(json['bidPipelines'][0]['status']['name']).to eq(status_ahead.name)
          expect(json['bidPipelines'][0]['assignedUsers'][0]['name']).to eq(other_user_ahead.name)
          expect(json['bidPipelines'][1]['project']['uuid']).to eq(project_after.uuid)
          expect(json['bidPipelines'][1]['status']['name']).to eq(status_ahead.name)
          expect(json['bidPipelines'][1]['assignedUsers'][0]['name']).to eq(other_user_ahead.name)
        end
      end

      it '直近のタスクが取得できること' do
        pipeline = create(:bid_pipeline, company: company, project: project_ahead, status: status_ahead)
        pending = create(:bid_pipeline_task_status, name: '予定', stage: 'todo')
        in_progress = create(:bid_pipeline_task_status, name: '進行中', stage: 'doing')
        completed = create(:bid_pipeline_task_status, name: '完了', stage: 'done')

        create(:bid_pipeline_task, bid_pipeline: pipeline, due_date: 1.day.since, status: completed)
        create(:bid_pipeline_task, bid_pipeline: pipeline, due_date: 2.days.since, status: in_progress)
        create(:bid_pipeline_task, bid_pipeline: pipeline, due_date: 3.days.since, status: pending)

        get '/v1/bid_pipelines'

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelines'].length).to eq(1)
          expect(json['bidPipelines'][0]['upcommingTask']['dueDate']).to eq(2.days.since.to_date.to_s)
        end
      end
    end

    context '検索条件が有効な場合' do
      it '入札締切日範囲検索が有効なこと' do
        pipeline1 = create(:bid_pipeline, company: company, project: project_ahead, status: status_ahead)
        pipeline2 = create(:bid_pipeline, company: company, project: project_after, status: status_ahead)
        create(:bid_pipeline_assignment, bid_pipeline: pipeline1, user: other_user_ahead)
        create(:bid_pipeline_assignment, bid_pipeline: pipeline2, user: other_user_ahead)

        get '/v1/bid_pipelines', params: {
          bidding_deadline_date_from: Time.zone.today,
          bidding_deadline_date_to: Time.zone.today
        }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelines'].length).to eq(1)
          expect(json['bidPipelines'][0]['project']['uuid']).to eq(project_ahead.uuid)
        end
      end

      it 'ステータス検索が有効なこと' do
        pipeline1 = create(:bid_pipeline, company: company, project: project_ahead, status: status_ahead)
        pipeline2 = create(:bid_pipeline, company: company, project: project_after, status: status_after)
        create(:bid_pipeline_assignment, bid_pipeline: pipeline1, user: other_user_ahead)
        create(:bid_pipeline_assignment, bid_pipeline: pipeline2, user: other_user_ahead)

        get '/v1/bid_pipelines', params: { bid_pipeline_status_ids: [status_ahead.id] }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelines'].length).to eq(1)
          expect(json['bidPipelines'][0]['project']['uuid']).to eq(project_ahead.uuid)
        end
      end

      it 'アサインユーザー検索が有効なこと' do
        pipeline1 = create(:bid_pipeline, company: company, project: project_ahead, status: status_ahead)
        pipeline2 = create(:bid_pipeline, company: company, project: project_after, status: status_ahead)
        create(:bid_pipeline_assignment, bid_pipeline: pipeline1, user: other_user_ahead)
        create(:bid_pipeline_assignment, bid_pipeline: pipeline2, user: other_user_after)

        get '/v1/bid_pipelines', params: { assigned_user_ids: [other_user_ahead.id] }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelines'].length).to eq(1)
          expect(json['bidPipelines'][0]['project']['uuid']).to eq(project_ahead.uuid)
        end
      end

      it 'ステージ検索が有効なこと' do
        doing_status1 = create(:bid_pipeline_status, company: company, stage: 'doing', name: '検討中')
        doing_status2 = create(:bid_pipeline_status, company: company, stage: 'doing', name: '入札参加')
        done_status1 = create(:bid_pipeline_status, company: company, stage: 'done', name: '落札')
        done_status2 = create(:bid_pipeline_status, company: company, stage: 'done', name: '失注')

        create(:bid_pipeline, company: company, project: project_ahead, status: doing_status1)
        create(:bid_pipeline, company: company, project: project_after, status: doing_status2)
        create(:bid_pipeline, company: company, project: create(:project), status: done_status1)
        create(:bid_pipeline, company: company, project: create(:project), status: done_status2)

        get '/v1/bid_pipelines', params: { bid_pipeline_status_stages: ['doing'] }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelines'].length).to eq(2)
          expect(json['bidPipelines'].map { |p| p['project']['uuid'] }).to include(project_ahead.uuid, project_after.uuid)
        end
      end

      it '複数のステージで検索できること' do
        doing_status1 = create(:bid_pipeline_status, company: company, stage: 'doing', name: '検討中')
        doing_status2 = create(:bid_pipeline_status, company: company, stage: 'doing', name: '入札参加')
        done_status1 = create(:bid_pipeline_status, company: company, stage: 'done', name: '落札')
        done_status2 = create(:bid_pipeline_status, company: company, stage: 'done', name: '失注')

        create(:bid_pipeline, company: company, project: project_ahead, status: doing_status1)
        create(:bid_pipeline, company: company, project: project_after, status: doing_status2)
        create(:bid_pipeline, company: company, project: create(:project), status: done_status1)
        create(:bid_pipeline, company: company, project: create(:project), status: done_status2)

        get '/v1/bid_pipelines', params: { bid_pipeline_status_stages: ['doing', 'done'] }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelines'].length).to eq(4)
        end
      end

      it '全ての検索条件が有効なこと' do
        doing_status1 = create(:bid_pipeline_status, company: company, stage: 'doing', name: '検討中')
        doing_status2 = create(:bid_pipeline_status, company: company, stage: 'doing', name: '入札参加')

        pipeline1 = create(:bid_pipeline, company: company, project: project_ahead, status: doing_status1)
        pipeline2 = create(:bid_pipeline, company: company, project: project_after, status: doing_status2)
        create(:bid_pipeline_assignment, bid_pipeline: pipeline1, user: other_user_ahead)
        create(:bid_pipeline_assignment, bid_pipeline: pipeline2, user: other_user_after)

        get '/v1/bid_pipelines', params: {
          bidding_deadline_date_from: Time.zone.today,
          bidding_deadline_date_to: Time.zone.today,
          bid_pipeline_status_ids: [doing_status1.id],
          assigned_user_ids: [other_user_ahead.id],
          bid_pipeline_status_stages: ['doing']
        }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelines'].length).to eq(1)
          expect(json['bidPipelines'][0]['project']['uuid']).to eq(project_ahead.uuid)
        end
      end

      it '検索条件が一致しない場合は空配列が返ること' do
        pipeline1 = create(:bid_pipeline, company: company, project: project_ahead, status: status_ahead)
        pipeline2 = create(:bid_pipeline, company: company, project: project_after, status: status_after)
        create(:bid_pipeline_assignment, bid_pipeline: pipeline1, user: other_user_ahead)
        create(:bid_pipeline_assignment, bid_pipeline: pipeline2, user: other_user_after)

        get '/v1/bid_pipelines', params: {
          bidding_deadline_date_from: Time.zone.today,
          bidding_deadline_date_to: Time.zone.today,
          bid_pipeline_status_ids: [status_after.id],
          assigned_user_ids: [other_user_after.id]
        }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelines'].length).to eq(0)
        end
      end

      it 'イベントが作成済みかどうかのフラグが取得できること' do
        pipeline = create(:bid_pipeline, company: company, project: project_ahead, status: status_ahead)
        create(:calendar_event, user: user, registrable: pipeline, sync_status: 'synced', due_date_type: 'application_document_deadline_date')

        get '/v1/bid_pipelines'

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelines'].length).to eq(1)
          expect(json['bidPipelines'][0]['eventCreatedDueDateTypes']).to eq(['application_document_deadline_date'])
        end
      end
    end

    context '並び順指定が有効な場合' do
      it '案件のタイトル昇順で取得できること' do
        create(:bid_pipeline, company: company, project: project_ahead, status: status_ahead)
        create(:bid_pipeline, company: company, project: project_after, status: status_ahead)

        get '/v1/bid_pipelines', params: { sort_key: 'project_title' }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelines'].length).to eq(2)
          expect(json['bidPipelines'][0]['project']['uuid']).to eq(project_ahead.uuid)
          expect(json['bidPipelines'][1]['project']['uuid']).to eq(project_after.uuid)
        end
      end

      it '案件のタイトル降順で取得できること' do
        create(:bid_pipeline, company: company, project: project_ahead, status: status_ahead)
        create(:bid_pipeline, company: company, project: project_after, status: status_ahead)

        get '/v1/bid_pipelines', params: { sort_key: 'project_title', sort_order: 'desc' }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelines'].length).to eq(2)
          expect(json['bidPipelines'][0]['project']['uuid']).to eq(project_after.uuid)
          expect(json['bidPipelines'][1]['project']['uuid']).to eq(project_ahead.uuid)
        end
      end

      it '入札締切日昇順で取得できること' do
        create(:bid_pipeline, company: company, project: project_ahead, status: status_ahead)
        create(:bid_pipeline, company: company, project: project_after, status: status_ahead)

        get '/v1/bid_pipelines', params: { sort_key: 'bidding_deadline_date' }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelines'].length).to eq(2)
          expect(json['bidPipelines'][0]['project']['uuid']).to eq(project_ahead.uuid)
          expect(json['bidPipelines'][1]['project']['uuid']).to eq(project_after.uuid)
        end
      end

      it '入札締切日降順で取得できること' do
        create(:bid_pipeline, company: company, project: project_ahead, status: status_ahead)
        create(:bid_pipeline, company: company, project: project_after, status: status_ahead)

        get '/v1/bid_pipelines', params: { sort_key: 'bidding_deadline_date', sort_order: 'desc' }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelines'].length).to eq(2)
          expect(json['bidPipelines'][0]['project']['uuid']).to eq(project_after.uuid)
          expect(json['bidPipelines'][1]['project']['uuid']).to eq(project_ahead.uuid)
        end
      end

      it 'ステータス昇順で取得できること' do
        create(:bid_pipeline, company: company, project: project_ahead, status: status_ahead)
        create(:bid_pipeline, company: company, project: project_after, status: status_after)

        get '/v1/bid_pipelines', params: { sort_key: 'status' }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelines'].length).to eq(2)
          expect(json['bidPipelines'][0]['project']['uuid']).to eq(project_ahead.uuid)
          expect(json['bidPipelines'][1]['project']['uuid']).to eq(project_after.uuid)
        end
      end

      it 'ステータス降順で取得できること' do
        create(:bid_pipeline, company: company, project: project_ahead, status: status_ahead)
        create(:bid_pipeline, company: company, project: project_after, status: status_after)

        get '/v1/bid_pipelines', params: { sort_key: 'status', sort_order: 'desc' }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelines'].length).to eq(2)
          expect(json['bidPipelines'][0]['project']['uuid']).to eq(project_after.uuid)
          expect(json['bidPipelines'][1]['project']['uuid']).to eq(project_ahead.uuid)
        end
      end

      it 'アサインユーザー昇順で取得できること' do
        pipeline1 = create(:bid_pipeline, company: company, project: project_ahead, status: status_ahead)
        pipeline2 = create(:bid_pipeline, company: company, project: project_after, status: status_ahead)
        create(:bid_pipeline_assignment, bid_pipeline: pipeline1, user: other_user_ahead)
        create(:bid_pipeline_assignment, bid_pipeline: pipeline2, user: other_user_after)

        get '/v1/bid_pipelines', params: { sort_key: 'assigned_user' }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelines'].length).to eq(2)
          expect(json['bidPipelines'][0]['project']['uuid']).to eq(project_ahead.uuid)
          expect(json['bidPipelines'][1]['project']['uuid']).to eq(project_after.uuid)
        end
      end

      it 'アサインユーザー降順で取得できること' do
        pipeline1 = create(:bid_pipeline, company: company, project: project_ahead, status: status_ahead)
        pipeline2 = create(:bid_pipeline, company: company, project: project_after, status: status_ahead)
        create(:bid_pipeline_assignment, bid_pipeline: pipeline1, user: other_user_ahead)
        create(:bid_pipeline_assignment, bid_pipeline: pipeline2, user: other_user_after)

        get '/v1/bid_pipelines', params: { sort_key: 'assigned_user', sort_order: 'desc' }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelines'].length).to eq(2)
          expect(json['bidPipelines'][0]['project']['uuid']).to eq(project_after.uuid)
          expect(json['bidPipelines'][1]['project']['uuid']).to eq(project_ahead.uuid)
        end
      end
    end

    context '並び順指定が無効な場合' do
      it 'デフォルトの並び順で取得できること' do
        pipeline1 = create(:bid_pipeline, company: company, project: project_ahead, status: status_ahead, created_at: 1.day.ago)
        pipeline2 = create(:bid_pipeline, company: company, project: project_after, status: status_ahead, created_at: Time.zone.now)
        create(:bid_pipeline_assignment, bid_pipeline: pipeline1, user: other_user_ahead)
        create(:bid_pipeline_assignment, bid_pipeline: pipeline2, user: other_user_after)

        get '/v1/bid_pipelines', params: { sort_key: 'hogehoge' }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['bidPipelines'].length).to eq(2)
          # デフォルトの並び順が案件の期限日の順番であること
          expect(json['bidPipelines'][0]['project']['uuid']).to eq(project_ahead.uuid)
          expect(json['bidPipelines'][1]['project']['uuid']).to eq(project_after.uuid)
        end
      end
    end
  end

  describe 'GET /bid_pipelines/:id' do
    it 'bid_pipelineが取得できること' do
      project = create(:project)
      status = create(:bid_pipeline_status, company: company)
      pipeline = create(:bid_pipeline, company: company, project: project, status: status)
      create(:bid_pipeline_assignment, bid_pipeline: pipeline, user: user)

      get "/v1/bid_pipelines/#{pipeline.id}"

      aggregate_failures do
        assert_response_schema_confirm(200)
        json = response.parsed_body
        expect(json['project']['uuid']).to eq(project.uuid)
        expect(json['status']['name']).to eq(status.name)
        expect(json['assignedUsers'][0]['name']).to eq(user.name)
      end
    end
  end

  describe 'POST /bid_pipelines' do
    context 'パラメータが有効な場合' do
      it 'bid_pipelineが作成されること' do
        project = create(:project)
        create(:bid_pipeline_status, company: company)
        status = create(:bid_pipeline_status, company: company)
        other_user = create(:user, company: company)

        post '/v1/bid_pipelines', params: {
          project_uuid: project.uuid,
          bid_pipeline_status_id: status.id,
          assigned_user_ids: [other_user.id]
        }

        aggregate_failures do
          assert_response_schema_confirm(201)
          expect(BidPipeline.count).to eq(1)
          expect(BidPipeline.first.project_id).to eq(project.id)
          expect(BidPipeline.first.company_id).to eq(company.id)
          expect(BidPipeline.first.bid_pipeline_status_id).to eq(status.id)
          expect(BidPipeline.first.bid_pipeline_assignments.count).to eq(1)
          expect(BidPipeline.first.bid_pipeline_assignments.first.user_id).to eq(other_user.id)
        end
      end

      it 'bid_pipeline_status_idが指定されていない場合はデフォルトのステータスが設定されること' do
        project = create(:project)
        default_status = create(:bid_pipeline_status, company: company)
        other_user = create(:user, company: company)

        post '/v1/bid_pipelines', params: {
          project_uuid: project.uuid,
          assigned_user_ids: [other_user.id]
        }

        aggregate_failures do
          assert_response_schema_confirm(201)
          expect(BidPipeline.count).to eq(1)
          expect(BidPipeline.first.project_id).to eq(project.id)
          expect(BidPipeline.first.company_id).to eq(company.id)
          expect(BidPipeline.first.bid_pipeline_status_id).to eq(default_status.id)
          expect(BidPipeline.first.bid_pipeline_assignments.count).to eq(1)
          expect(BidPipeline.first.bid_pipeline_assignments.first.user_id).to eq(other_user.id)
        end
      end

      it 'assigned_user_idsが指定されていない場合は, assignmentsは作成しない' do
        project = create(:project)
        default_status = create(:bid_pipeline_status, company: company)

        post '/v1/bid_pipelines', params: { project_uuid: project.uuid }

        aggregate_failures do
          assert_response_schema_confirm(201)
          expect(BidPipeline.count).to eq(1)
          expect(BidPipeline.first.project_id).to eq(project.id)
          expect(BidPipeline.first.company_id).to eq(company.id)
          expect(BidPipeline.first.bid_pipeline_status_id).to eq(default_status.id)
          expect(BidPipeline.first.bid_pipeline_assignments.count).to eq(0)
        end
      end
    end
  end

  describe 'PUT /bid_pipelines/:id' do
    context 'パラメータが有効な場合' do
      it 'bid_pipelineが更新されること' do
        pipeline = create(:bid_pipeline, company: company)
        status = create(:bid_pipeline_status, company: company)
        other_user = create(:user, company: company)

        put "/v1/bid_pipelines/#{pipeline.id}", params: {
          bid_pipeline_status_id: status.id,
          assigned_user_ids: [other_user.id]
        }

        aggregate_failures do
          assert_response_schema_confirm(200)
          expect(pipeline.reload.bid_pipeline_status_id).to eq(status.id)
          expect(pipeline.bid_pipeline_assignments.count).to eq(1)
          expect(pipeline.bid_pipeline_assignments.first.user_id).to eq(other_user.id)
        end
      end

      it 'bid_pipeline_status_idが指定されていない場合はステータスは更新されないこと' do
        pipeline = create(:bid_pipeline, company: company)
        other_user = create(:user, company: company)

        put "/v1/bid_pipelines/#{pipeline.id}", params: {
          assigned_user_ids: [other_user.id]
        }

        aggregate_failures do
          assert_response_schema_confirm(200)
          expect(pipeline.reload.bid_pipeline_status_id).to eq(pipeline.bid_pipeline_status_id)
          expect(pipeline.bid_pipeline_assignments.count).to eq(1)
          expect(pipeline.bid_pipeline_assignments.first.user_id).to eq(other_user.id)
        end
      end

      it 'assigned_user_idsが指定されていない場合は, assignmentsは更新されないこと' do
        pipeline = create(:bid_pipeline, company: company)
        status = create(:bid_pipeline_status, company: company)

        put "/v1/bid_pipelines/#{pipeline.id}", params: {
          bid_pipeline_status_id: status.id
        }

        aggregate_failures do
          assert_response_schema_confirm(200)
          expect(pipeline.reload.bid_pipeline_status_id).to eq(status.id)
          expect(pipeline.bid_pipeline_assignments.count).to eq(0)
        end
      end
    end
  end

  describe 'DELETE /bid_pipelines/:id' do
    it 'bid_pipelineが削除されること' do
      pipeline = create(:bid_pipeline, company: company)

      delete "/v1/bid_pipelines/#{pipeline.id}"

      aggregate_failures do
        assert_response_schema_confirm(200)
        expect(BidPipeline.count).to eq(0)
      end
    end

    context 'bid_pipelineに紐づくcustom_objectsがある場合' do
      before do
        create_list(:custom_object_template, 2, company: company)
      end

      let(:pipeline) { create(:bid_pipeline, company: company) }

      it 'bid_pipelineに紐づくcustom_objectsが削除されること' do
        
        expect(pipeline.custom_objects.count).to eq(2)
        expect(CustomObject.count).to eq(2)

        delete "/v1/bid_pipelines/#{pipeline.id}"

        expect(CustomObject.count).to eq(0)
        assert_response_schema_confirm(200)
      end
    end

    context 'custom_objectsに紐づくcustom_object_itemsがある場合' do
      let(:pipeline) { create(:bid_pipeline, company: company) }

      before do
        create_list(:custom_object_template, 2, company: company)
        create(:custom_object_item, custom_object: pipeline.custom_objects.first)
        create(:custom_object_item, custom_object: pipeline.custom_objects.second)
      end



      it 'custom_objectsに紐づくcustom_object_itemsも削除されること' do

        expect(CustomObjectItem.count).to eq(2)

        delete "/v1/bid_pipelines/#{pipeline.id}"

        expect(CustomObjectItem.count).to eq(0)
        assert_response_schema_confirm(200)
      end
    end
  end
end
