require 'rails_helper'

RSpec.describe 'V1::BidPipelineTasks' do
  let(:user) { create(:user) }
  let(:company) { user.company }
  let(:project) { create(:project) }
  let(:bid_pipeline) { create(:bid_pipeline, company: company, project: project) }
  let(:status) { create(:bid_pipeline_task_status, company: company) }
  let(:assigned_user) { create(:user, company: company) }

  before do
    login_as(user)
  end

  describe 'GET /v1/bid_pipeline_tasks' do
    context '正常な場合' do
      it 'タスク一覧が取得できること' do
        task = create(:bid_pipeline_task, bid_pipeline: bid_pipeline, status: status, assigned_users: [assigned_user])

        get '/v1/bid_pipeline_tasks'

        aggregate_failures do
          assert_response_schema_confirm(200)
          expect(response.parsed_body.size).to eq(1)
          expect(response.parsed_body.first['id']).to eq(task.id)
          expect(response.parsed_body.first['pipeline']['projectId']).to eq(project.id)
          expect(response.parsed_body.first['pipeline']['projectTitle']).to eq(project.title)
          expect(response.parsed_body.first['assignedUsers'].size).to eq(1)
          expect(response.parsed_body.first['assignedUsers'].first['id']).to eq(assigned_user.id)
          expect(response.parsed_body.first['status']['id']).to eq(status.id)
        end
      end

      it 'ステージでフィルタリングできること' do
        todo_status = create(:bid_pipeline_task_status, company: company, stage: 'todo')
        doing_status = create(:bid_pipeline_task_status, company: company, stage: 'doing')
        done_status = create(:bid_pipeline_task_status, company: company, stage: 'done')

        task = create(:bid_pipeline_task, bid_pipeline: bid_pipeline, status: todo_status)
        create(:bid_pipeline_task, bid_pipeline: bid_pipeline, status: doing_status)
        create(:bid_pipeline_task, bid_pipeline: bid_pipeline, status: done_status)

        get '/v1/bid_pipeline_tasks', params: { bid_pipeline_task_status_stages: ['todo'] }

        aggregate_failures do
          assert_response_schema_confirm(200)
          expect(response.parsed_body.size).to eq(1)
          expect(response.parsed_body.first['id']).to eq(task.id)
          expect(response.parsed_body.first['status']['stage']).to eq('todo')
        end
      end

      it '複数のステージでフィルタリングできること' do
        todo_status = create(:bid_pipeline_task_status, company: company, stage: 'todo')
        doing_status = create(:bid_pipeline_task_status, company: company, stage: 'doing')
        done_status = create(:bid_pipeline_task_status, company: company, stage: 'done')

        create(:bid_pipeline_task, bid_pipeline: bid_pipeline, status: todo_status)
        create(:bid_pipeline_task, bid_pipeline: bid_pipeline, status: doing_status)
        create(:bid_pipeline_task, bid_pipeline: bid_pipeline, status: done_status)

        get '/v1/bid_pipeline_tasks', params: { bid_pipeline_task_status_stages: ['todo', 'doing'] }

        aggregate_failures do
          assert_response_schema_confirm(200)
          expect(response.parsed_body.size).to eq(2)
          expect(response.parsed_body.map { |t| t['status']['stage'] }).to contain_exactly('todo', 'doing')
        end
      end

      it 'カレンダーイベントが作成済みかどうかのフラグが含まれること' do
        task = create(:bid_pipeline_task, bid_pipeline: bid_pipeline, status: status, assigned_users: [assigned_user])
        create(:calendar_event, registrable: task, user: user)

        get '/v1/bid_pipeline_tasks'

        aggregate_failures do
          assert_response_schema_confirm(200)
          expect(response.parsed_body.first['eventCreated']).to be true
        end
      end
    end

    context '他の企業のタスクがある場合' do
      let(:other_company) { create(:company) }
      let(:other_project) { create(:project) }
      let(:other_bid_pipeline) { create(:bid_pipeline, company: other_company, project: other_project) }

      it '自分の企業のタスクのみが取得できること' do
        task = create(:bid_pipeline_task, bid_pipeline: bid_pipeline, status: status, assigned_users: [assigned_user])
        create(:bid_pipeline_task, bid_pipeline: other_bid_pipeline)

        get '/v1/bid_pipeline_tasks'
        assert_response_schema_confirm(200)
        expect(response.parsed_body.size).to eq(1)
        expect(response.parsed_body.first['id']).to eq(task.id)
      end
    end
  end
end
