require 'rails_helper'

RSpec.describe 'Companies::Me::SecurityQualifications' do
  let(:company) { create(:company) }
  let(:user) { create(:user, company:) }

  before { login_as(user) }

  describe 'GET /companies/me/security_qualifications' do
    let(:security_qualification_a) { create(:security_qualification, code: '資格A') }
    let(:security_qualification_b) { create(:security_qualification, code: '資格B') }

    context 'パラメータが有効な場合' do
      it '200が返ること' do
        create(:company_security_qualification, company:, security_qualification: security_qualification_a)
        create(:company_security_qualification, company:, security_qualification: security_qualification_b)

        get '/v1/companies/me/security_qualifications'

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['securityQualifications'].length).to eq(2)
        end
      end

      it 'セキュリティ資格が存在しない場合でも200が返ること' do
        get '/v1/companies/me/security_qualifications'

        assert_response_schema_confirm(200)
      end

      it '他社のセキュリティ資格が返らないこと' do
        other_company = create(:company)
        create(:company_security_qualification, company: other_company, security_qualification: security_qualification_a)

        get '/v1/companies/me/security_qualifications'

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['securityQualifications'].length).to eq(0)
        end
      end
    end
  end

  describe 'PUT /companies/me/security_qualifications' do
    let(:security_qualification_a) { create(:security_qualification, code: '資格A') }
    let(:security_qualification_b) { create(:security_qualification, code: '資格B') }
    let(:valid_params) do
      {
        security_qualifications: [
          {
            code: security_qualification_a.code,
            valid_from: '2023-01-01',
            valid_until: '2024-01-01'
          },
          {
            code: security_qualification_b.code,
            valid_from: '2023-02-01',
            valid_until: '2024-02-01'
          }
        ]
      }
    end

    context 'パラメータが有効な場合' do
      it '200が返ること' do
        put '/v1/companies/me/security_qualifications', params: valid_params

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['securityQualifications'].length).to eq(2)
        end
      end

      it '既存のセキュリティ資格が上書きされること' do
        create(:company_security_qualification, company:, security_qualification: security_qualification_a, valid_from: '2022-01-01', valid_until: '2022-12-31')

        put '/v1/companies/me/security_qualifications', params: valid_params

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['securityQualifications'].length).to eq(2)
          qualification_a = json['securityQualifications'].find { |sq| sq['code'] == security_qualification_a.code }
          expect(qualification_a['validFrom']).to eq('2023-01-01')
          expect(qualification_a['validUntil']).to eq('2024-01-01')
        end
      end

      it '指定されていない既存のセキュリティ資格が削除されること' do
        create(:company_security_qualification, company:, security_qualification: security_qualification_a)

        put '/v1/companies/me/security_qualifications', params: {
          security_qualifications: [
            {
              code: security_qualification_b.code,
              valid_from: '2023-02-01',
              valid_until: '2024-02-01'
            }
          ]
        }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['securityQualifications'].length).to eq(1)
          expect(json['securityQualifications'][0]['code']).to eq(security_qualification_b.code)
        end
      end
    end

    context 'パラメータが無効な場合' do
      it '存在しないセキュリティ資格コードの場合、404が返ること' do
        # 既存のデータを作成
        create(:company_security_qualification, company:, security_qualification: security_qualification_a)
        create(:company_security_qualification, company:, security_qualification: security_qualification_b)

        invalid_params = {
          security_qualifications: [
            {
              code: '不存在資格',
              valid_from: '2023-01-01',
              valid_until: '2024-01-01'
            }
          ]
        }

        put '/v1/companies/me/security_qualifications', params: invalid_params

        aggregate_failures do
          assert_response_schema_confirm(404)

          # 既存のデータを確認して、変更されていないことを確認
          expect(company.company_security_qualifications.count).to eq(2)
        end
      end
    end
  end
end