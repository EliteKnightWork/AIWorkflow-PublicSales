require 'rails_helper'

RSpec.describe 'Admin::ProposalJobs' do
  before do
    login_as(build(:user))
  end

  describe 'GET /v1/admin/proposal_jobs' do
    let(:company) { create(:company) }
    let(:user) { create(:user, company: company) }
    let(:project) { create(:project) }

    before do
      # 異なるステータスのProposalJobを作成
      create(:proposal_job, :completed, company: company, user: user, project: project, created_at: 3.days.ago)
      create(:proposal_job, :processing, company: company, user: user, project: project, created_at: 2.days.ago)
      create(:proposal_job, :failed, company: company, user: user, project: project, created_at: 1.day.ago)
      create(:proposal_job, :completed, company: company, user: user, project: project, created_at: 1.hour.ago)
    end

    context 'フィルターなしの場合' do
      it '全てのproposal_jobsが取得できること' do
        get '/v1/admin/proposal_jobs'
        
        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['proposalJobs'].length).to eq(4)
          expect(json['meta']['pagination']).to be_present
        end
      end
    end

    context 'completedフィルターがtrueの場合' do
      it 'completedステータスのみが取得できること' do
        get '/v1/admin/proposal_jobs', params: { completed: true }
        
        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['proposalJobs'].length).to eq(2)
          expect(json['proposalJobs'].all? { |job| job['status'] == 'completed' }).to be true
        end
      end
    end

    context 'completedフィルターがfalseの場合' do
      it '全てのproposal_jobsが取得できること' do
        get '/v1/admin/proposal_jobs', params: { completed: false }
        
        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['proposalJobs'].length).to eq(4)
        end
      end
    end

    context 'ページネーション' do
      before do
        # 追加のデータを作成してページネーションをテスト
        10.times do
          create(:proposal_job, company: company, user: user, project: project)
        end
      end

      it 'ページ指定なしの場合、最初のページが返ること' do
        get '/v1/admin/proposal_jobs'
        
        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['meta']['pagination']['current']).to eq(1)
          expect(json['meta']['pagination']['count']).to eq(14)
        end
      end

      it 'ページ指定がある場合、指定されたページが返ること' do
        get '/v1/admin/proposal_jobs', params: { page: 2 }
        
        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['meta']['pagination']['current']).to eq(2)
        end
      end
    end

    context 'proposal_jobsが存在しない場合' do
      before do
        ProposalJob.destroy_all
      end

      it '空の配列が返ること' do
        get '/v1/admin/proposal_jobs'
        
        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['proposalJobs']).to be_empty
          expect(json['meta']['pagination']['count']).to eq(0)
        end
      end
    end
  end
end
