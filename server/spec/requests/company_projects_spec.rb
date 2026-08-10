require 'rails_helper'

RSpec.describe 'V1::CompanyProjectsController', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let(:other_company) { create(:company) }
  let(:other_user) { create(:user, company: other_company) }

  before do
    # Projectの作成時のコールバック（埋め込み生成）を無効化
    allow_any_instance_of(Project).to receive(:check_and_build_project_embeddings)
  end

  describe 'POST /v1/company_projects' do
    let(:valid_params) do
      {
        title: 'テスト会社プロジェクト',
        procedure_type: '一般競争入札',
        organization_name: 'テスト組織',
        publication_date: Date.current.to_s,
        application_document_deadline_date: (Date.current + 10.days).to_s,
        bidding_deadline_date: (Date.current + 20.days).to_s,
        planned_price: 1000000,
        is_experience_required: true,
        is_office_required: false
      }
    end

    context 'ユーザーが認証されていて、company_idがある場合' do
      before { login_as(user) }

      it '会社プロジェクトを作成し、201ステータスを返すこと' do
        expect {
          post '/v1/company_projects', params: valid_params
        }.to change(CompanyProject, :count).by(1)
         .and change(Project, :count).by(1)

        assert_response_schema_confirm(201)
      end

      it '作成されたプロジェクトが正しい属性を持つこと' do
        post '/v1/company_projects', params: valid_params

        company_project = CompanyProject.last
        project = company_project.project

        aggregate_failures do
          expect(company_project.company_id).to eq(user.company_id)
          expect(project.title).to eq('テスト会社プロジェクト')
          expect(project.procedure_type).to eq('一般競争入札')
          expect(project.organization_name).to eq('テスト組織')
          expect(project.is_experience_required).to be true
          expect(project.is_office_required).to be false
        end
      end

      it 'ProjectSerializerでシリアライズされたJSONを返すこと' do
        post '/v1/company_projects', params: valid_params

        json = response.parsed_body
        expect(json).to have_key('uuid')
        expect(json).to have_key('title')
        expect(json).to have_key('organizationName')
        expect(json['companyProjectId']).to eq(CompanyProject.last.id)
      end

      it 'key, source, registration_date が自動設定されること' do
        post '/v1/company_projects', params: valid_params

        project = Project.last
        expect(project.key).to be_present
        expect(project.key).to match(/\A[0-9a-f-]+\z/) # UUIDフォーマット
        expect(project.source).to eq("company_project-#{user.company_id}")
        expect(project.registration_date).to eq(Time.zone.now.to_date)
      end

      context '無効なパラメータの場合' do
        it 'titleが空の場合、422ステータスとエラーメッセージを返すこと' do
          invalid_params = valid_params.merge(title: '')
          
          post '/v1/company_projects', params: invalid_params

          assert_response_schema_confirm(422)
        end
      end
    end

    context 'ユーザーが認証されているが、company_idがない場合' do
      let(:user_without_company) { create(:user, company: nil) }
      
      before { login_as(user_without_company) }

      it '403ステータスとforbiddenエラーを返すこと' do
        post '/v1/company_projects', params: valid_params

        assert_response_schema_confirm(403)
      end

      it 'CompanyProjectを作成しないこと' do
        expect {
          post '/v1/company_projects', params: valid_params
        }.not_to change(CompanyProject, :count)
      end
    end
  end

  describe 'PATCH /v1/company_projects/:id' do
    let!(:company_project) { create(:company_project, :with_project, company: company) }
    let(:company_project_id) { company_project.id }
    
    let(:update_params) do
      {
        title: '更新されたタイトル',
        procedure_type: '指名競争入札',
        organization_name: '更新された組織',
        planned_price: 2000000,
        is_experience_required: false,
        is_office_required: true
      }
    end

    context 'ユーザーが認証されていて、自社のプロジェクトの場合' do
      before { login_as(user) }

      it 'プロジェクトを更新し、200ステータスを返すこと' do
        patch "/v1/company_projects/#{company_project_id}", params: update_params

        assert_response_schema_confirm(200)
      end

      it 'プロジェクトの属性が正しく更新されること' do
        patch "/v1/company_projects/#{company_project_id}", params: update_params

        project = company_project.project.reload
        aggregate_failures do
          expect(project.title).to eq('更新されたタイトル')
          expect(project.procedure_type).to eq('指名競争入札')
          expect(project.organization_name).to eq('更新された組織')
          expect(project.planned_price).to eq(2000000)
          expect(project.is_experience_required).to be false
          expect(project.is_office_required).to be true
        end
      end

      it '更新されたプロジェクトのJSONを返すこと' do
        patch "/v1/company_projects/#{company_project_id}", params: update_params

        json = response.parsed_body
        expect(json['title']).to eq('更新されたタイトル')
        expect(json['procedureType']).to eq('指名競争入札')
        expect(json['companyProjectId']).to eq(company_project.id)
      end

      context '無効なパラメータの場合' do
        it 'titleを空にした場合、422ステータスとエラーメッセージを返すこと' do
          invalid_params = update_params.merge(title: '')

        patch "/v1/company_projects/#{company_project_id}", params: invalid_params

          assert_response_schema_confirm(422)
        end
      end
    end

    context '他社のプロジェクトを更新しようとした場合' do
      before { login_as(other_user) }

      it '404ステータスとnot_foundエラーを返すこと' do
        patch "/v1/company_projects/#{company_project_id}", params: update_params

        assert_response_schema_confirm(404)
      end
    end

    context '存在しないプロジェクトを更新しようとした場合' do
      before { login_as(user) }

      it '404ステータスとnot_foundエラーを返すこと' do
        patch '/v1/company_projects/999999', params: update_params

        assert_response_schema_confirm(404)
      end
    end

    context 'ユーザーが認証されているが、company_idがない場合' do
      let(:user_without_company) { create(:user, company: nil) }
      
      before { login_as(user_without_company) }

      it '403ステータスとforbiddenエラーを返すこと' do
        patch "/v1/company_projects/#{company_project_id}", params: update_params

        assert_response_schema_confirm(403)
      end
    end
  end

  describe 'DELETE /v1/company_projects/:id' do
    let!(:company_project) { create(:company_project, :with_project, company: company) }
    let(:company_project_id) { company_project.id }

    context 'ユーザーが認証されていて、自社のプロジェクトの場合' do
      before { login_as(user) }

      it 'プロジェクトを削除し、200ステータスを返すこと' do
        expect {
          delete "/v1/company_projects/#{company_project_id}"
        }.to change(CompanyProject, :count).by(-1)

        assert_response_schema_confirm(200)
      end

      it '空のJSONオブジェクトを返すこと' do
        delete "/v1/company_projects/#{company_project_id}"

        json = response.parsed_body
        expect(json).to eq({})
      end
    end

    context '他社のプロジェクトを削除しようとした場合' do
      before { login_as(other_user) }

      it '404ステータスとnot_foundエラーを返すこと' do
        delete "/v1/company_projects/#{company_project_id}"

        assert_response_schema_confirm(404)
      end

      it 'プロジェクトを削除しないこと' do
        expect {
          delete "/v1/company_projects/#{company_project_id}"
        }.not_to change(CompanyProject, :count)
      end
    end

    context '存在しないプロジェクトを削除しようとした場合' do
      before { login_as(user) }

      it '404ステータスとnot_foundエラーを返すこと' do
        delete '/v1/company_projects/999999'

        assert_response_schema_confirm(404)
      end
    end

    context 'ユーザーが認証されているが、company_idがない場合' do
      let(:user_without_company) { create(:user, company: nil) }
      
      before { login_as(user_without_company) }

      it '403ステータスとforbiddenエラーを返すこと' do
        delete "/v1/company_projects/#{company_project_id}"

        assert_response_schema_confirm(403)
      end
    end

    context '削除に失敗した場合' do
      before do
        login_as(user)
        allow_any_instance_of(CompanyProject).to receive(:destroy) do |instance|
          instance.errors.add(:base, '削除に失敗')
          false
        end
      end

      it '422ステータスとエラーメッセージを返すこと' do
        delete "/v1/company_projects/#{company_project_id}"

        assert_response_schema_confirm(422)
      end
    end
  end
end
