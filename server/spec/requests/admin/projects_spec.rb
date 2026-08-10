require 'rails_helper'

RSpec.describe 'Admin::Projects' do
  before do
    login_as(build(:user))
  end

  describe 'GET /v1/admin/projects/:key' do
    context '指定したkeyとsourceのプロジェクトが存在する場合' do
      it '200ステータスが返ること' do
        create(:project, key: 'key_1', source: 'source_1')
        get "/v1/admin/projects/key_1", params: { source: 'source_1' }
        assert_response_schema_confirm(200)
      end
    end

    context '指定したkeyとsourceのプロジェクトが存在しない場合' do
      it '404ステータスが返ること' do
        get "/v1/admin/projects/key_1", params: { source: 'source_1' }
        assert_response_schema_confirm(404)
      end
    end

    context 'only_awardedパラメータがtrueの場合' do
      let!(:awarded_project) { create(:awarded_project) }
      let!(:project_only_awarded) { create(:project, key: 'key_2', source: 'source_2', awarded_project: awarded_project) }
      # project_without_awardedはテスト内で参照されているためlet!をletに変更
      let(:project_without_awarded) { create(:project, key: 'key_3', source: 'source_2') }

      it 'awarded_projectが設定されているプロジェクトのみ検索されること' do
        get "/v1/admin/projects/key_2", params: { source: 'source_2', only_awarded: 'true' }
        assert_response_schema_confirm(200)
        expect(response.parsed_body['uuid']).to eq(project_only_awarded.uuid)
      end

      it 'awarded_projectが設定されていないプロジェクトは検索されないこと' do
        get "/v1/admin/projects/key_3", params: { source: 'source_2', only_awarded: 'true' }
        assert_response_schema_confirm(404)
      end
    end

    context 'only_awardedパラメータがfalseまたは未指定の場合' do
      let!(:project_without_awarded) { create(:project, key: 'key_4', source: 'source_3') }

      it 'awarded_projectの有無に関わらず検索されること' do
        get "/v1/admin/projects/key_4", params: { source: 'source_3', only_awarded: 'false' }
        assert_response_schema_confirm(200)
        expect(response.parsed_body['uuid']).to eq(project_without_awarded.uuid)
      end
    end
  end

  describe 'POST /v1/admin/projects' do
    context 'パラメーターが正常な場合' do
      it 'success' do
        project_params = attributes_for(:project)
        project_params[:prefectures] = ['東京都', '神奈川県']
        expect {
          post '/v1/admin/projects', params: project_params
        }.to change(Project, :count).by(1).
          and change(ProjectLgCode, :count).by(2)
        assert_response_schema_confirm(201)
      end
    end

    context 'prefectureがあり、prefecturesが空の場合' do
      it 'prefectureの値を使ってProjectLgCodeのレコードを作成すること' do
        project_params = attributes_for(:project)
        project_params[:prefecture] = '東京都'
        expect {
          post '/v1/admin/projects', params: project_params
        }.to change(Project, :count).by(1).
          and change(ProjectLgCode, :count).by(1)
        assert_response_schema_confirm(201)
      end
    end

    context 'keyとsourceが重複している場合' do
      it '409エラーが返ること' do
        create(:project, key: 'key_1', source: 'source_1')
        project_params = attributes_for(:project, key: 'key_1', source: 'source_1')
        project_params[:prefectures] = ['東京都', '神奈川県']
        expect {
          post '/v1/admin/projects', params: project_params
        }.to not_change(Project, :count).
          and not_change(ProjectLgCode, :count)
        assert_response_schema_confirm(409)
      end
    end
  end

  describe 'DELETE /v1/admin/projects/:uuid' do
    context 'when the project exists' do
      it 'deletes the project and returns status 200' do
        project = create(:project)
        expect {
          delete "/v1/admin/projects/#{project.uuid}", headers: { 'x-labid-admin-key' => 'hogehoge' }
        }.to change(Project, :count).by(-1)
        expect(response).to have_http_status(200)
      end
    end

    context 'when the project does not exist' do
      it 'returns status 404' do
        delete '/v1/admin/projects/nonexistent_key', headers: { 'x-labid-admin-key' => 'hogehoge' }
        expect(response).to have_http_status(404)
      end
    end
  end

  describe 'PATCH /v1/admin/projects/:uuid' do
    context '指定したuuidのプロジェクトが存在する場合' do
      it 'success' do
        project = create(:project)
        project_params = attributes_for(:project)
        project_params[:prefectures] = ['東京都', '神奈川県']
        patch "/v1/admin/projects/#{project.uuid}", params: project_params
        project.reload
        expect(project.lg_codes.pluck(:code)).to contain_exactly('13', '14')
        assert_response_schema_confirm(200)
      end
    end

    context '指定したuuidのプロジェクトが存在しない場合' do
      it '404エラーが返ること' do
        project_params = attributes_for(:project)
        project_params[:prefectures] = ['東京都', '神奈川県']
        patch '/v1/admin/projects/1', params: project_params
        assert_response_schema_confirm(404)
      end
    end
  end

  describe 'PATCH /v1/admin/projects/:uuid/key' do
    context '正常にkeyを更新できる場合' do
      it 'keyが更新され200が返ること' do
        project = create(:project, key: 'old-key')
        new_key_params = { key: 'new-key' }
        
        patch "/v1/admin/projects/#{project.uuid}/key", params: new_key_params
        
        expect(response).to have_http_status(200)
        assert_response_schema_confirm(200)
        
        project.reload
        expect(project.key).to eq('new-key')
      end
    end

    context 'keyが既に存在する場合' do
      it '409エラーが返ること' do
        create(:project, key: 'existing-key', source: 'test-source')
        project = create(:project, key: 'old-key', source: 'test-source')
        
        duplicate_key_params = { key: 'existing-key' }
        patch "/v1/admin/projects/#{project.uuid}/key", params: duplicate_key_params
        
        expect(response).to have_http_status(409)
        assert_response_schema_confirm(409)
        
        project.reload
        expect(project.key).to eq('old-key')
      end
    end

    context 'keyが空の場合' do
      it '409エラーが返ること' do
        project = create(:project, key: 'old-key')
        empty_key_params = { key: '' }
        
        patch "/v1/admin/projects/#{project.uuid}/key", params: empty_key_params
        
        expect(response).to have_http_status(409)
        
        project.reload
        expect(project.key).to eq('old-key')
      end
    end

    context 'keyがnilの場合' do
      it '409エラーが返ること' do
        project = create(:project, key: 'old-key')
        nil_key_params = { key: nil }
        
        patch "/v1/admin/projects/#{project.uuid}/key", params: nil_key_params
        
        expect(response).to have_http_status(409)
        
        project.reload
        expect(project.key).to eq('old-key')
      end
    end

    context '指定したuuidのプロジェクトが存在しない場合' do
      it '404エラーが返ること' do
        key_params = { key: 'new-key' }
        patch '/v1/admin/projects/non-existent-uuid/key', params: key_params
        
        expect(response).to have_http_status(404)
        assert_response_schema_confirm(404)
      end
    end
  end

  describe 'GET /v1/admin/projects/:uuid/detail' do
    context '指定したuuidのプロジェクトが存在し、visibleな場合' do
      it '200ステータスが返り、プロジェクト情報が正しく返されること' do
        project = create(:project, hidden_at: nil)
        get "/v1/admin/projects/#{project.uuid}/detail"
        
        expect(response).to have_http_status(200)
        assert_response_schema_confirm(200)
        
        json = response.parsed_body
        expect(json['uuid']).to eq(project.uuid)
        expect(json['key']).to eq(project.key)
        expect(json['title']).to eq(project.title)
      end
    end

    context 'external_documentsとscreenshotsが関連付けられている場合' do
      it 'attachmentsとscreenshotsの情報が正しく返されること' do
        project = create(:project, hidden_at: nil)
        create(:external_document, attachable: project)
        create(:screenshot, attachable: project)
        
        get "/v1/admin/projects/#{project.uuid}/detail"
        
        expect(response).to have_http_status(200)
        assert_response_schema_confirm(200)
        
        json = response.parsed_body
        expect(json['attachments']).to be_present
        expect(json['screenshots']).to be_present
      end
    end

    context '指定したuuidのプロジェクトが存在しない場合' do
      it '404エラーが返ること' do
        get '/v1/admin/projects/non-existent-uuid/detail'
        
        expect(response).to have_http_status(404)
        assert_response_schema_confirm(404)
      end
    end

    context 'プロジェクトがhidden_atが設定されている場合' do
      it '404エラーが返ること' do
        project = create(:project, hidden_at: Time.current)
        
        get "/v1/admin/projects/#{project.uuid}/detail"
        
        expect(response).to have_http_status(404)
        assert_response_schema_confirm(404)
      end
    end
  end

  describe 'GET /v1/admin/projects/search', :elasticsearch do
    describe '日付範囲による検索' do
      context '応募書類提出期日の範囲検索' do
        let!(:project_null_date) { create(:project, application_document_deadline_date: nil) }

        before do
          Project.__elasticsearch__.refresh_index!
        end

        it 'nullの検索が正しく動作すること' do
          get '/v1/admin/projects/search', params: {
            application_document_deadline_date_eq: "null",
            page: 1,
            per_page: 25
          }

          json = response.parsed_body
          expect(response).to have_http_status(200)
          expect(json['projects'].length).to eq(1)
          expect(json['projects'][0]['uuid']).to eq(project_null_date.uuid)
        end
      end

      context '複数の日付フィルターの組み合わせ' do
        let!(:project_match_both) { create(:project, application_document_deadline_date: Time.zone.today, proposal_document_deadline_date: Time.zone.today) }
        let!(:project_match_single) { create(:project, application_document_deadline_date: Time.zone.today, proposal_document_deadline_date: Time.zone.today + 3.months) }

        before do
          Project.__elasticsearch__.refresh_index!
        end

        it 'proposal_document_deadline_dateのみ一致する場合' do
          get '/v1/admin/projects/search', params: {
            application_document_deadline_date_from: Time.zone.today - 1.month,
            application_document_deadline_date_to: Time.zone.today + 1.month,
            page: 1,
            per_page: 25
          }

          json = response.parsed_body
          expect(response).to have_http_status(200)
          expect(json['projects'].length).to eq(2)
          expect(json['projects'].pluck('uuid')).to contain_exactly(
            project_match_both.uuid,
            project_match_single.uuid
          )
        end
      end
    end

    describe 'キーワード検索' do
      let!(:project_sns) {
        create(:project).tap do |p|
          p.update!(
            raw_title: 'SNSプロモーション案件',
            title: 'SNSプロモーション案件'
          )
        end
      }

      let!(:project_video) {
        create(:project).tap do |p|
          p.update!(
            raw_title: '動画制作案件',
            title: '動画制作案件',
            description: 'SNSでの展開も'
          )
        end
      }

      let!(:project_print) {
        create(:project).tap do |p|
          p.update!(
            raw_title: '印刷物とポスター制作',
            title: '印刷物とポスター制作'
          )
        end
      }

      let!(:project_mixed) {
        create(:project).tap do |p|
          p.update!(
            raw_title: 'SNS動画プロモーション',
            title: 'SNS動画プロモーション'
          )
        end
      }

      before do
        Project.__elasticsearch__.create_index! force: true
        Project.import
        Project.__elasticsearch__.refresh_index!
      end

      context 'AND検索 (すべて含む)' do
        it '単一キーワードでの検索' do
          params = {
            keywords: ['SNS'],
            page: 1,
            per_page: 25
          }
          get '/v1/admin/projects/search', params: params

          json = response.parsed_body

          expect(response).to have_http_status(200)
          expect(json['projects'].pluck('uuid')).to contain_exactly(
            project_sns.uuid,
            project_mixed.uuid
          )
        end

        it '複数キーワードでの検索 (AND)' do
          params = {
            keywords: ['SNS', 'プロモーション'],
            page: 1,
            per_page: 25
          }
          get '/v1/admin/projects/search', params: params

          json = response.parsed_body

          expect(response).to have_http_status(200)
          expect(json['projects'].pluck('uuid')).to contain_exactly(
            project_sns.uuid,
            project_mixed.uuid
          )
        end
      end

      context 'OR検索 (いずれかを含む)' do
        it '複数キーワードでの検索 (OR)' do
          params = {
            or_keywords: ['動画', '印刷'],
            page: 1,
            per_page: 25
          }

          get '/v1/admin/projects/search', params: params

          json = response.parsed_body

          expect(response).to have_http_status(200)
          expect(json['projects'].pluck('uuid')).to contain_exactly(
            project_video.uuid,
            project_print.uuid,
            project_mixed.uuid
          )
        end
      end

      context 'NOT検索 (含まない)' do
        it 'NOTキーワードでの除外' do
          params = {
            not_keywords: ['印刷', 'ポスター'],
            page: 1,
            per_page: 25
          }

          get '/v1/admin/projects/search', params: params

          json = response.parsed_body

          expect(response).to have_http_status(200)
          expect(json['projects'].pluck('uuid')).not_to include(project_print.uuid)
        end
      end
    end
  end
end
