require 'rails_helper'

RSpec.describe 'BrowsingHistory', type: :request do
  describe 'POST /v1/projects/:id/browsing_histories' do
    context 'ログインしている場合' do
      let(:user) { create(:user) }

      before { login_as(user) }

      it '正常に既読にできること' do
        project = create(:project)
        post "/v1/projects/#{project.uuid}/browsing_histories"
        assert_response_schema_confirm(201)
      end

      it '既読済みの場合でもエラーにならないこと' do
        project = create(:project)
        create(:browsing_history, user: user, browsable: project)
        post "/v1/projects/#{project.uuid}/browsing_histories"
        assert_response_schema_confirm(201)
      end

      it '存在しない入札案件の場合エラーになること' do
        post "/v1/projects/invalid_uuid/browsing_histories"
        assert_response_schema_confirm(404)
      end
    end

    context 'ログインしていない場合' do
      it 'エラーになること' do
        project = create(:project)
        post "/v1/projects/#{project.uuid}/browsing_histories"
        assert_response_schema_confirm(401)
      end
    end
  end
end
