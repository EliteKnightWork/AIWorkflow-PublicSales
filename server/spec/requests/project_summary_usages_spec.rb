require 'rails_helper'

RSpec.describe 'ProjectSummaryUsages' do
  let(:company) { create(:company) }
  let(:user) { create(:user, company:) }

  before { login_as(user) }

  describe 'GET /check' do
    context 'サマリ済の時' do
      it 'trueが返ること' do
        project = create(:project)
        create(:project_summary_usage, company: company, project: project)
        get "/v1/project_summary_usages/check/#{project.uuid}"

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['isSummarized']).to be(true)
        end
      end
    end

    context '未サマリの時' do
      it 'falseが返ること' do
        project = create(:project)
        get "/v1/project_summary_usages/check/#{project.uuid}"

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['isSummarized']).to be(false)
        end
      end
    end
  end
end
