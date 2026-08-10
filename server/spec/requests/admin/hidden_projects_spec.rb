require 'rails_helper'

RSpec.describe 'Admin::HiddenProjects' do
  before do
    login_as(build(:user))
  end

  describe 'GET /v1/admin/hidden_projects' do
    it '200ステータスが返ること' do
      create(:project, hidden_at: Time.current)
      get '/v1/admin/hidden_projects'
      assert_response_schema_confirm(200)
    end
  end
end
