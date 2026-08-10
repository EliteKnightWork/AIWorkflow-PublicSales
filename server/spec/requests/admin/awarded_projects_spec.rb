require 'rails_helper'

RSpec.describe 'Admin::AwardedProjects' do
  describe 'POST /v1/admin/awarded_projects' do
    context 'パラメーターが正常な場合' do
      it 'success' do
        params = attributes_for(:project, :with_awarded_project)
        params[:prefectures] = ['東京都', '神奈川県']
        params[:bidders] = [{ company_name: 'company_1', is_successful_bidder: true }]
        params[:attachments] = [fixture_file_upload(Rails.root.join("spec/fixtures/dummy.pdf"), 'application/pdf')]
        params[:source_files] = [fixture_file_upload(Rails.root.join("spec/fixtures/dummy.pdf"), 'application/pdf')]
        params[:screenshots] = [{ source_url: 'https://example.com', file: fixture_file_upload(Rails.root.join("spec/fixtures/dummy.png"), 'image/png') }]
        aggregate_failures do
          expect {
            post '/v1/admin/awarded_projects', params: params
          }.to change(Project, :count).by(1).
            and change(AwardedProject, :count).by(1).
            and change(ProjectLgCode, :count).by(2).
            and change(Organization, :count).by(1).
            and change(BidCompany, :count).by(1).
            and change(ExternalDocument, :count).by(1).
            and change(SourceFile, :count).by(1).
            and change(Screenshot, :count).by(1)
          assert_response_schema_confirm(201)
        end
      end
    end

    context 'prefectureがあり、prefecturesが空の場合' do
      it 'prefectureの値を使ってProjectLgCodeのレコードを作成すること' do
        params = attributes_for(:project, :with_awarded_project)
        params[:prefecture] = '東京都'
        aggregate_failures do
          expect {
            post '/v1/admin/awarded_projects', params: params
          }.to change(Project, :count).by(1).
            and change(AwardedProject, :count).by(1).
            and change(ProjectLgCode, :count).by(1).
            and change(Organization, :count).by(1)

          assert_response_schema_confirm(201)
        end
      end
    end

    context 'prefectures, city_name, procedure_type, url, titleが重複している場合' do
      it '該当レコードが更新されること' do
        existing_params = attributes_for(:project, :with_awarded_project)
        existing_params.merge!(city_name: 'city_1', procedure_type: 'procedure_type_1', url: 'url_1', title: 'title_1', organization_name: 'test_organization')
        existing_params[:city] = 'city_1'
        existing_params[:prefectures] = ['東京都', '神奈川県']
        Transactions::UpsertAwardedProject.new(existing_params).exec

        params = attributes_for(:project, :with_awarded_project)
        params.merge!(key: nil, procedure_type: 'procedure_type_1', url: 'url_1', title: 'title_1', organization_name: 'test_organization')
        params[:city] = 'city_1'
        params[:prefectures] = ['東京都', '神奈川県']
        params[:attachments] = [fixture_file_upload(Rails.root.join("spec/fixtures/dummy.pdf"), 'application/pdf')]
        aggregate_failures do
          expect {
            post '/v1/admin/awarded_projects', params: params
          }.to not_change(Project, :count).
            and not_change(AwardedProject, :count).
            and not_change(ProjectLgCode, :count).
            and not_change(Organization, :count).
            and change(ExternalDocument, :count).by(1)
          assert_response_schema_confirm(201)
        end
      end
    end

    context 'keyが重複している場合' do
      it '該当レコードが更新されること' do
        existing_params = attributes_for(:project, :with_awarded_project)
        existing_params[:key] = 'key_1'
        existing_params[:source] = 'source_1'
        existing_params[:prefectures] = ['東京都', '神奈川県']
        Transactions::UpsertAwardedProject.new(existing_params).exec

        params = attributes_for(:project, :with_awarded_project)
        params[:key] = 'key_1'
        params[:source] = 'source_1'
        params[:prefectures] = ['東京都', '神奈川県']
        params[:attachments] = [fixture_file_upload(Rails.root.join("spec/fixtures/dummy.pdf"), 'application/pdf')]
        aggregate_failures do
          expect {
            post '/v1/admin/awarded_projects', params: params
          }.to not_change(Project, :count).
            and not_change(AwardedProject, :count).
            and not_change(ProjectLgCode, :count).
            and change(ExternalDocument, :count).by(1)
          assert_response_schema_confirm(201)
        end
      end
    end

    context 'city_name, procedure_type, url, titleが重複しているが、prefecturesが一部異なる場合' do
      it '新規レコードとして作成されること' do
        existing_params = attributes_for(:project, :with_awarded_project)
        existing_params.merge!(city_name: 'city_1', procedure_type: 'procedure_type_1', url: 'url_1', title: 'title_1')
        existing_params[:city] = 'city_1'
        existing_params[:prefectures] = ['東京都', '神奈川県']
        Transactions::UpsertAwardedProject.new(existing_params).exec

        params = attributes_for(:project, :with_awarded_project)
        params.merge!(procedure_type: 'procedure_type_1', url: 'url_1', title: 'title_1')
        params[:city] = 'city_1'
        params[:prefectures] = ['東京都', '神奈川県', '埼玉県']
        params[:attachments] = [fixture_file_upload(Rails.root.join("spec/fixtures/dummy.pdf"), 'application/pdf')]
        aggregate_failures do
          expect {
            post '/v1/admin/awarded_projects', params: params
          }.to change(Project, :count).by(1).
            and change(AwardedProject, :count).by(1).
            and change(ProjectLgCode, :count).by(3).
            and change(ExternalDocument, :count).by(1)
          assert_response_schema_confirm(201)
        end
      end
    end

    context 'keyパラメータが指定されている場合' do
      it '指定されたkeyがprojectに設定されること' do
        params = attributes_for(:project, :with_awarded_project)
        params[:prefectures] = ['東京都']
        params[:key] = 'custom-key-12345'
        
        aggregate_failures do
          expect {
            post '/v1/admin/awarded_projects', params: params
          }.to change(Project, :count).by(1).
            and change(AwardedProject, :count).by(1)
          
          project = Project.last
          expect(project.key).to eq('custom-key-12345')
          assert_response_schema_confirm(201)
        end
      end
    end

    context 'keyパラメータが指定されていない場合' do
      it '自動生成されたkeyがprojectに設定されること' do
        params = attributes_for(:project, :with_awarded_project)
        params[:prefectures] = ['東京都']
        
        aggregate_failures do
          expect {
            post '/v1/admin/awarded_projects', params: params
          }.to change(Project, :count).by(1).
            and change(AwardedProject, :count).by(1)
          
          project = Project.last
          expect(project.key).to be_present
          expect(project.key).not_to eq('custom-key-12345')
          assert_response_schema_confirm(201)
        end
      end
    end
  end
end
