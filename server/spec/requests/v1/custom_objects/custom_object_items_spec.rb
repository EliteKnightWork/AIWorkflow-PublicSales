require 'rails_helper'

RSpec.describe 'V1::CustomObjects::CustomObjectItems', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let(:custom_object_template) { create(:custom_object_template, company: company) }
  let(:bid_pipeline) { create(:bid_pipeline, company: company) }
  let(:custom_object) { create(:custom_object, custom_object_template: custom_object_template, bid_pipeline: bid_pipeline) }

  before { login_as(user) }

  describe 'PUT /v1/custom_objects/:custom_object_id/custom_object_items' do
    context 'アイテムが更新できること' do
      context '既存アイテムを更新する場合' do
        let!(:existing_item) do
          create(:custom_object_item,
                 custom_object: custom_object,
                 custom_object_template_item_value: create(:custom_object_template_item_value,
                                                          custom_object_template_item: create(:custom_object_template_item,
                                                                                               custom_object_template: custom_object.custom_object_template)),
                 user_id: user.id,
                 free_text: Faker::Lorem.sentence,
                 calendar: Faker::Date.between(from: 1.year.ago, to: 1.year.from_now),
                 url: Faker::Internet.url)
        end

        let(:other_user) { create(:user, company: company) }

        let(:params) do
          {
            custom_object_items: [
              {
                id: existing_item.id,
                custom_object_template_item_value_id: existing_item.custom_object_template_item_value_id,
                is_checked: Faker::Boolean.boolean,
                user_id: other_user.id,
                free_text: Faker::Lorem.sentence,
                calendar: Faker::Date.between(from: Time.zone.now, to: 1.year.from_now),
                url: Faker::Internet.url,
                number_value: '123456.12345'
              }
            ]
          }
        end

        it 'カスタムオブジェクトアイテムが更新される' do
          put "/v1/custom_objects/#{custom_object.id}/custom_object_items", params: params

          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json.first).to include(
            "id" => existing_item.id,
            "isChecked" => params[:custom_object_items][0][:is_checked],
            "userId" => other_user.id,
            "freeText" => params[:custom_object_items][0][:free_text],
            "url" => params[:custom_object_items][0][:url]
          )
          expect(json.first["calendar"]).to include(params[:custom_object_items][0][:calendar].strftime('%Y-%m-%d'))
          expect(json.first["numberValue"]).to eq(params[:custom_object_items][0][:number_value])
        end
      end
    end

    context '400 Bad Request' do
      context 'number_valueが許可桁数を超える場合' do
        let!(:existing_item) do
          create(
            :custom_object_item,
            custom_object: custom_object,
            custom_object_template_item_value: create(
              :custom_object_template_item_value,
              custom_object_template_item: create(
                :custom_object_template_item,
                custom_object_template: custom_object.custom_object_template
              )
            )
          )
        end

        let(:params) do
          {
            custom_object_items: [
              {
                id: existing_item.id,
                custom_object_template_item_value_id: existing_item.custom_object_template_item_value_id,
                number_value: '1234567890123456.123456'
              }
            ]
          }
        end

        it '400エラーが返される' do
          expect do
            put "/v1/custom_objects/#{custom_object.id}/custom_object_items", params: params
          end.not_to(change { existing_item.reload.number_value })

          assert_response_schema_confirm(400)
          expect(response.parsed_body['errors']).to include('Number valueは整数部15桁以内、小数部5桁以内で入力してください')
        end
      end

      context '別会社のユーザーIDを指定した場合' do
        let!(:existing_item) do
          create(
            :custom_object_item,
            custom_object: custom_object,
            custom_object_template_item_value: create(
              :custom_object_template_item_value,
              custom_object_template_item: create(
                :custom_object_template_item,
                custom_object_template: custom_object.custom_object_template
              )
            ),
            user: user
          )
        end

        let(:other_company_user) { create(:user, company: create(:company)) }

        let(:params) do
          {
            custom_object_items: [
              {
                id: existing_item.id,
                custom_object_template_item_value_id: existing_item.custom_object_template_item_value_id,
                user_id: other_company_user.id
              }
            ]
          }
        end

        it '400エラーが返される' do
          expect do
            put "/v1/custom_objects/#{custom_object.id}/custom_object_items", params: params
          end.not_to(change { existing_item.reload.user_id })

          assert_response_schema_confirm(400)
          expect(response.parsed_body['errors']).to eq(['invalid user'])
        end
      end

      context '別テンプレートの値を指定した場合' do
        let!(:existing_item) { create(:custom_object_item, custom_object: custom_object) }
        let(:foreign_template) { create(:custom_object_template, company: create(:company)) }
        let(:foreign_value) do
          create(:custom_object_template_item_value,
                 custom_object_template_item: create(:custom_object_template_item,
                                                     custom_object_template: foreign_template))
        end

        let(:params) do
          {
            custom_object_items: [
              {
                id: existing_item.id,
                custom_object_template_item_value_id: foreign_value.id
              }
            ]
          }
        end

        it '400エラーが返される' do
          expect do
            put "/v1/custom_objects/#{custom_object.id}/custom_object_items", params: params
          end.not_to(change { existing_item.reload.custom_object_template_item_value_id })

          assert_response_schema_confirm(400)
          expect(response.parsed_body['errors']).to include('Custom object template item valueは不正な値です')
        end
      end

      context 'パラメータが不正な場合' do
        let(:params) { { custom_object_items: [{}] } }

        it '400エラーが返される' do
          put "/v1/custom_objects/#{custom_object.id}/custom_object_items", params: params
          assert_response_schema_confirm(400)
          expect(response.parsed_body['errors']).to all(be_a(String))
        end
      end

      context 'custom_object_itemsが存在しない場合' do
        it '400エラーが返される' do
          put "/v1/custom_objects/#{custom_object.id}/custom_object_items"

          assert_response_schema_confirm(400)
          expect(response.parsed_body['errors']).to eq(['invalid parameters'])
        end
      end

      context 'custom_object_itemsが配列でない場合' do
        let(:params) { { custom_object_items: 'invalid' } }

        it '400エラーが返される' do
          put "/v1/custom_objects/#{custom_object.id}/custom_object_items", params: params

          assert_response_schema_confirm(400)
          expect(response.parsed_body['errors']).to eq(['invalid parameters'])
        end
      end
    end

    context '404 Not Found' do
      context 'カスタムオブジェクトが存在しない場合' do
        let(:params) do
          {
            custom_object_items: [
              {
                is_checked: true,
                user_id: user.id,
                free_text: Faker::Lorem.sentence,
                calendar: Faker::Date.between(from: Time.zone.now, to: 1.year.from_now),
                url: Faker::Internet.url
              }
            ]
          }
        end

        it '404エラーが返される' do
          put "/v1/custom_objects/#{custom_object.id + 1}/custom_object_items", params: params
          assert_response_schema_confirm(404)
          expect(response.parsed_body['errors']).to eq(['not found'])
        end
      end
    end

    context '403 Forbidden' do
      context '別会社のユーザーが更新しようとした場合' do
        let!(:existing_item) do
          create(:custom_object_item,
                 custom_object: custom_object,
                 custom_object_template_item_value: create(:custom_object_template_item_value,
                                                          custom_object_template_item: create(:custom_object_template_item,
                                                                                               custom_object_template: custom_object.custom_object_template)))
        end

        let(:other_company) { create(:company) }
        let(:other_company_user) { create(:user, company: other_company) }

        let(:params) do
          {
            custom_object_items: [
              {
                id: existing_item.id,
                custom_object_template_item_value_id: existing_item.custom_object_template_item_value_id
              }
            ]
          }
        end

        before { login_as(other_company_user) }

        it '403エラーが返されカスタムオブジェクトアイテムは変更されない' do
          expect do
            put "/v1/custom_objects/#{custom_object.id}/custom_object_items", params: params
          end.not_to(change { existing_item.reload.custom_object_template_item_value_id })

          assert_response_schema_confirm(403)
          expect(response.parsed_body['errors']).to eq(['forbidden'])
        end
      end
    end
  end
end
