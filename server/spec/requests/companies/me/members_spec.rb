require 'rails_helper'

RSpec.describe 'Companies::Me::Members', type: :request do
  let(:company) { create(:company) }

  before { login_as(user) }

  describe 'GET /companies/me/members' do
    context '組織に属している場合' do
      let(:user) { create(:user, company: company) }

      it '自身の組織のメンバーが返ること' do
        create_list(:user, 3, company: company)
        get '/v1/companies/me/members'

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['members'].length).to eq(4)
        end
      end
    end

    context '組織に属していない場合' do
      let(:user) { create(:user) }

      it '自身の情報のみが返ること' do
        create_list(:user, 3, company: company)
        get '/v1/companies/me/members'

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['members'].length).to eq(1)
        end
      end
    end
  end
end
