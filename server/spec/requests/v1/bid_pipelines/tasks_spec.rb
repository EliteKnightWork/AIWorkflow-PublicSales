require 'rails_helper'

RSpec.describe 'V1::BidPipelines::Tasks' do
  let(:user) { create(:user) }
  let(:company) { user.company }
  let(:bid_pipeline) { create(:bid_pipeline, company: company) }
  let(:bid_pipeline_task_status) { create(:bid_pipeline_task_status, company: company) }
  let!(:task) { create(:bid_pipeline_task, bid_pipeline: bid_pipeline, status: bid_pipeline_task_status) }

  before { login_as(user) }

  describe 'GET /v1/bid_pipelines/:bid_pipeline_id/tasks' do
    context '正常な場合' do
      it 'タスク一覧が取得できること' do
        get "/v1/bid_pipelines/#{bid_pipeline.id}/tasks"
        assert_response_schema_confirm(200)
        expect(response.parsed_body.size).to eq(1)
      end
    end

    context '存在しない案件IDを指定した場合' do
      it '404エラーが返ること' do
        get "/v1/bid_pipelines/9999/tasks"
        expect(response.status).to eq(404)
      end
    end
  end

  describe 'GET /v1/bid_pipelines/:bid_pipeline_id/tasks/:id' do
    context '正常な場合' do
      it 'タスクが取得できること' do
        get "/v1/bid_pipelines/#{bid_pipeline.id}/tasks/#{task.id}"
        assert_response_schema_confirm(200)
        expect(response.parsed_body['id']).to eq(task.id)
      end
    end

    context '存在しないタスクIDを指定した場合' do
      it '404エラーが返ること' do
        get "/v1/bid_pipelines/#{bid_pipeline.id}/tasks/9999"
        expect(response.status).to eq(404)
      end
    end
  end

  describe 'POST /v1/bid_pipelines/:bid_pipeline_id/tasks' do
    let(:valid_params) do
      {
        title: 'テストタスク',
        description: 'タスクの説明',
        status: 'todo',
        due_date: (Date.current + 7.days).to_s,
        assigned_user_ids: [user.id]
      }
    end

    context '正常な場合' do
      it 'タスクが作成できること' do
        expect {
          post "/v1/bid_pipelines/#{bid_pipeline.id}/tasks", params: valid_params
        }.to change(bid_pipeline.tasks, :count).by(1)
        assert_response_schema_confirm(201)
        expect(response.parsed_body['title']).to eq('テストタスク')
      end

      it '添付ファイル付きでタスクが作成できること' do
        file = fixture_file_upload(Rails.root.join('spec/fixtures/files/test.pdf'), 'application/pdf')
        
        params = valid_params.merge(
          attachments_attributes: [ file ]
        )
        
        expect {
          post "/v1/bid_pipelines/#{bid_pipeline.id}/tasks", params: params
        }.to change(bid_pipeline.tasks, :count).by(1)
          .and change(BidPipelineTaskAttachment, :count).by(1)
        
        assert_response_schema_confirm(201)
        expect(response.parsed_body['title']).to eq('テストタスク')
        expect(response.parsed_body['attachments'].size).to eq(1)
        expect(response.parsed_body['attachments'].first['name']).to eq('test.pdf')
      end
    end

    context '不正なパラメータの場合' do
      it '422エラーが返ること' do
        expect {
          post "/v1/bid_pipelines/#{bid_pipeline.id}/tasks", params: { title: '' }
        }.not_to change(bid_pipeline.tasks, :count)
        expect(response.status).to eq(422)
      end
    end
  end

  describe 'PUT /v1/bid_pipelines/:bid_pipeline_id/tasks/:id' do
    let(:update_status) { create(:bid_pipeline_task_status, company: company) }
    let(:update_params) do
      {
        title: '更新タスク',
        bid_pipeline_task_status_id: update_status.id,
      }
    end

    context '正常な場合' do
      it 'タスクが更新できること' do
        expect {
          put "/v1/bid_pipelines/#{bid_pipeline.id}/tasks/#{task.id}", params: update_params
        }.to change { task.reload.title }.to('更新タスク')
        assert_response_schema_confirm(200)
        expect(response.parsed_body['title']).to eq('更新タスク')
        expect(response.parsed_body['status']['id']).to eq(update_status.id)
      end
    end

    context '不正なパラメータの場合' do
      it '422エラーが返ること' do
        expect {
          put "/v1/bid_pipelines/#{bid_pipeline.id}/tasks/#{task.id}", params: { title: '' }
        }.not_to(change { task.reload.title })
        expect(response.status).to eq(422)
      end
    end
  end

  describe 'DELETE /v1/bid_pipelines/:bid_pipeline_id/tasks/:id' do
    context '正常な場合' do
      it 'タスクが削除できること' do
        expect {
          delete "/v1/bid_pipelines/#{bid_pipeline.id}/tasks/#{task.id}"
        }.to change(bid_pipeline.tasks, :count).by(-1)
        expect(response.status).to eq(204)
      end
    end

    context '存在しないタスクIDを指定した場合' do
      it '404エラーが返ること' do
        expect {
          delete "/v1/bid_pipelines/#{bid_pipeline.id}/tasks/9999"
        }.not_to change(bid_pipeline.tasks, :count)
        expect(response.status).to eq(404)
      end
    end
  end

  describe 'POST /v1/bid_pipelines/:bid_pipeline_id/tasks/:id/duplicate' do
    context '正常な場合' do
      it 'タスクが複製できること' do
        expect {
          post "/v1/bid_pipelines/#{bid_pipeline.id}/tasks/#{task.id}/duplicate"
        }.to change(bid_pipeline.tasks, :count).by(1)
        assert_response_schema_confirm(201)
        expect(response.parsed_body['title']).to eq("#{task.title} - コピー")
      end
    end

    context '存在しないタスクIDを指定した場合' do
      it '404エラーが返ること' do
        expect {
          post "/v1/bid_pipelines/#{bid_pipeline.id}/tasks/9999/duplicate"
        }.not_to change(bid_pipeline.tasks, :count)
        expect(response.status).to eq(404)
      end
    end
  end

  describe 'POST /v1/bid_pipelines/:bid_pipeline_id/tasks/bulk_delete' do
    let!(:tasks) { create_list(:bid_pipeline_task, 3, bid_pipeline: bid_pipeline) }
    let(:task_ids) { tasks.pluck(:id) }
    let(:tasks_relation) { instance_double(TasksRelation) }


    context '正常な場合' do
      it '複数のタスクが一括で削除できること' do
        expect {
          post "/v1/bid_pipelines/#{bid_pipeline.id}/tasks/bulk_delete", params: { task_ids: task_ids }
        }.to change(bid_pipeline.tasks, :count).by(-3)
        assert_response_schema_confirm(204)
      end
    end

    context 'タスクIDが指定されていない場合' do
      it '400エラーが返ること' do
        expect {
          post "/v1/bid_pipelines/#{bid_pipeline.id}/tasks/bulk_delete", params: { task_ids: [] }
        }.not_to change(bid_pipeline.tasks, :count)
        assert_response_schema_confirm(400)
        expect(response.parsed_body['errors']).to include('タスクIDが指定されていません')
      end
    end

    context '一部のタスクの削除に失敗した場合' do
      before do
        allow_any_instance_of(ActiveRecord::Relation).to receive(:destroy_all).and_return(false)
      end

      it '500エラーが返ること' do
        post "/v1/bid_pipelines/#{bid_pipeline.id}/tasks/bulk_delete", params: { task_ids: task_ids }
        assert_response_schema_confirm(500)
        expect(response.parsed_body['errors']).to include('一部のタスクの削除に失敗しました')
      end
    end
  end

  describe 'POST /v1/bid_pipelines/:bid_pipeline_id/tasks/bulk_duplicate' do
    let!(:tasks) { create_list(:bid_pipeline_task, 3, bid_pipeline: bid_pipeline) }
    let(:task_ids) { tasks.pluck(:id) }

    context '正常な場合' do
      it '複数のタスクが一括で複製できること' do
        expect {
          post "/v1/bid_pipelines/#{bid_pipeline.id}/tasks/bulk_duplicate", params: { task_ids: task_ids }
        }.to change(bid_pipeline.tasks, :count).by(3)
        assert_response_schema_confirm(201)
        expect(response.parsed_body.size).to eq(3)
        expect(response.parsed_body.first['title']).to include('コピー')
      end
    end

    context 'タスクIDが指定されていない場合' do
      it '400エラーが返ること' do
        expect {
          post "/v1/bid_pipelines/#{bid_pipeline.id}/tasks/bulk_duplicate", params: { task_ids: [] }
        }.not_to change(bid_pipeline.tasks, :count)
        assert_response_schema_confirm(400)
        expect(response.parsed_body['errors']).to include('タスクIDが指定されていません')
      end
    end

    context 'タスクの複製に失敗した場合' do
      before do
        allow_any_instance_of(BidPipelineTask).to receive(:save).and_return(false)
      end

      it '500エラーが返ること' do
        post "/v1/bid_pipelines/#{bid_pipeline.id}/tasks/bulk_duplicate", params: { task_ids: task_ids }
        assert_response_schema_confirm(500)
        expect(response.parsed_body['errors']).to include('タスクの複製に失敗しました')
      end
    end
  end
end
