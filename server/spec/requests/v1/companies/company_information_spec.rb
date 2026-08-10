require 'rails_helper'

RSpec.describe 'V1::Companies::CompanyInformation', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }

  before { login_as(user) }

  describe 'GET /v1/companies/company_information' do
    subject(:request) { get "/v1/companies/company_information" }

    context '会社情報がある場合' do
      let!(:company_information) { create(:company_information, company: company) }

      it '会社情報を取得できること' do
        request

        assert_response_schema_confirm(200)
        expect(response.parsed_body['companyInformation']).to match(
          {
            'companyName' => company.name,
            'corporateNumber' => company_information.corporate_number,
            'postalCode' => company_information.postal_code,
            'address' => company_information.address,
            'director' => company_information.director,
            'faxNum' => company_information.fax_num,
            'telNum' => company_information.tel_num,
            'capital' => company_information.capital,
            'employeesNum' => company_information.employees_num,
            'industryType' => company_information.industry_type,
            'businessDescription' => company_information.business_description,
            'sales' => company_information.sales,
            'establishedAt' => company_information.established_at&.to_date.to_s
          }
        )
      end
    end

    context '会社情報がない場合' do
      it '空の会社情報レスポンスが返ること' do
        request

        assert_response_schema_confirm(200)
        expect(response.parsed_body['companyInformation']).to match(
          {
            'companyName' => company.name,
            'corporateNumber' => nil,
            'postalCode' => nil,
            'address' => nil,
            'director' => nil,
            'faxNum' => nil,
            'telNum' => nil,
            'capital' => nil,
            'employeesNum' => nil,
            'industryType' => nil,
            'businessDescription' => nil,
            'sales' => nil,
            'establishedAt' => nil
          }
        )
      end
    end

    context '事務所情報がある場合' do
      context '一つの事務所情報がある場合' do
        before { create(:company_information, company: company) }

        let!(:office) { create(:office, company: company) }

        it '事務所情報を含むレスポンスが返ること' do
          request

          assert_response_schema_confirm(200)
          expect(response.parsed_body['offices']).to contain_exactly({
                'id' => office.id,
                'name' => office.name,
                'address' => office.address
              })
        end
      end

      context '複数の事務所情報がある場合' do
        before { create(:company_information, company: company) }

        let!(:first_office) { create(:office, company: company) }
        let!(:second_office) { create(:office, company: company) }

        it '事務所情報を含むレスポンスが返ること' do
          request

          assert_response_schema_confirm(200)
          expect(response.parsed_body['offices']).to contain_exactly({
                'id' => first_office.id,
                'name' => first_office.name,
                'address' => first_office.address
              }, {
                'id' => second_office.id,
                'name' => second_office.name,
                'address' => second_office.address
              })
        end
      end
    end

    context '事務所情報がない場合' do
      before { create(:company_information, company: company) }

      it '事務所情報は空配列となること' do
        request

        assert_response_schema_confirm(200)
        expect(response.parsed_body['offices']).to eq([])
      end
    end

    context '添付資料情報がある場合' do
      context '一つの添付資料情報がある場合' do
        before { create(:company_information, company: company) }

        let!(:attachment) { create(:company_attachment, company: company) }

        it '添付資料情報を含むレスポンスが返ること' do
          request

          assert_response_schema_confirm(200)
          expect(response.parsed_body['attachments']).to contain_exactly({
              'id' => attachment.id,
              'fileType' => attachment.file_type,
              'name' => attachment.file.filename.to_s,
              'url' => attachment.file.attached? ? Rails.application.routes.url_helpers.rails_blob_url(attachment.file) : nil
              })
        end
      end

      context '複数の添付資料情報がある場合' do
        before { create(:company_information, company: company) }

        let!(:first_attachment) { create(:company_attachment, company: company) }
        let!(:second_attachment) { create(:company_attachment, company: company) }

        it '添付資料情報を含むレスポンスが返ること' do
          request

          assert_response_schema_confirm(200)
          expect(response.parsed_body['attachments']).to contain_exactly({
                'id' => first_attachment.id,
                'fileType' => first_attachment.file_type,
                'name' => first_attachment.file.filename.to_s,
                'url' => first_attachment.file.attached? ? Rails.application.routes.url_helpers.rails_blob_url(first_attachment.file) : nil
              }, {
                'id' => second_attachment.id,
                'fileType' => second_attachment.file_type,
                'name' => second_attachment.file.filename.to_s,
                'url' => second_attachment.file.attached? ? Rails.application.routes.url_helpers.rails_blob_url(second_attachment.file) : nil
              })
        end
      end
    end

    context '添付資料情報がない場合' do
      before { create(:company_information, company: company) }

      it '添付資料情報は空配列となること' do
        request

        assert_response_schema_confirm(200)
        expect(response.parsed_body['attachments']).to eq([])
      end
    end
  end


  describe 'PUT /v1/companies/company_information' do
    subject(:request) { put "/v1/companies/company_information", params: params }

    let(:company_information_payload) { { company_information: nil } }
    let(:offices_payload) { { upsert: [], delete_ids: [] } }
    let(:attachments_payload) { { upsert: [], delete_ids: [] } }
    let(:params) do
      {
        company_information: company_information_payload,
        offices: offices_payload,
        attachments: attachments_payload
      }
    end

    context '正常な場合' do
      it 'Transactions::UpdateCompanyInformationに委譲されること' do
        allow(Transactions::UpdateCompanyInformation).to receive(:new).and_return(
          instance_double(Transactions::UpdateCompanyInformation, exec: true, errors: [])
        )
        request
        assert_response_schema_confirm(200)
      end
    end
  end
end
