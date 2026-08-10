require 'rails_helper'

RSpec.describe 'V1::CustomObjectTemplates', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let(:other_company) { create(:company) }
  let(:other_user) { create(:user, company: other_company) }
  let!(:other_template) { create(:custom_object_template, company: other_company) }
  let!(:custom_object_template) { create(:custom_object_template, company: company) }
  let!(:template_item) { create(:custom_object_template_item, custom_object_template: custom_object_template) }
  let!(:item_value) { create(:custom_object_template_item_value, custom_object_template_item: template_item) }

  describe 'GET /v1/custom_object_templates' do
    context 'ログインユーザーの所属会社の場合' do
      before { login_as(user) }

      it '所属会社に属するテンプレート一覧を取得できる' do
        get "/v1/custom_object_templates"

        assert_response_schema_confirm(200)
        expect(response.parsed_body.size).to eq(1)
        expect(response.parsed_body.first['id']).to eq(custom_object_template.id)
        expect(response.parsed_body.first['title']).to eq(custom_object_template.title)
      end
    end

    context '他のカンパニーのユーザーの場合' do
      before { login_as(other_user) }

      it '自分の所属会社のテンプレートのみ取得できる' do
        get "/v1/custom_object_templates"

        assert_response_schema_confirm(200)
        expect(response.parsed_body.size).to eq(1)
        expect(response.parsed_body.first['id']).to eq(other_template.id)
      end
    end
  end

  describe 'POST /v1/custom_object_templates' do
    let!(:bid_pipeline) { create(:bid_pipeline, company: company) }
    let(:valid_params) do
      {
        title: '新規テンプレート',
        custom_object_template_items: [
          {
            title: 'テキスト項目',
            description: 'テキスト説明',
            input_type: 'free_text',
            custom_object_template_item_values: []
          },
          {
            title: 'チェックボックス項目',
            description: 'チェックボックス説明',
            input_type: 'checkbox',
            custom_object_template_item_values: [
              { choice_content: '選択肢1' },
              { choice_content: '選択肢2' }
            ]
          }
        ]
      }
    end

    context 'パラメータが正しい場合' do
      subject(:perform_request) { post "/v1/custom_object_templates", params: valid_params }

      before { login_as(user) }


      it '所属会社に新規テンプレートを作成できる' do
        expect { perform_request }.to change(CustomObjectTemplate, :count).by(1)
          .and change(CustomObjectTemplateItem, :count).by(2)
          .and change(CustomObjectTemplateItemValue, :count).by(3)
          .and change(CustomObject, :count).by(1)
          .and change(CustomObjectItem, :count).by(3)
      end

      context 'リクエスト後' do
        before { perform_request }

        it 'テンプレートの作成結果を返す' do
          json = response.parsed_body
          assert_response_schema_confirm(201)
          expect(json).to include(
            'id' => a_kind_of(Integer),
            'title' => '新規テンプレート',
            'companyId' => company.id
          )
        end

        it 'テンプレートアイテムとその値を作成する' do
          json = response.parsed_body
          created_template = CustomObjectTemplate.find(json['id'])
          expect(created_template.custom_object_template_items.count).to eq(2)

          text_item = created_template.custom_object_template_items.find_by(input_type: 'free_text')
          expect(text_item).to be_present
          expect(text_item.custom_object_template_item_values.count).to eq(1)

          checkbox_item = created_template.custom_object_template_items.find_by(input_type: 'checkbox')
          expect(checkbox_item).to be_present
          expect(checkbox_item.custom_object_template_item_values.pluck(:choice_content)).to contain_exactly('選択肢1', '選択肢2')
        end

        it '関連するカスタムオブジェクトを初期化する' do
          json = response.parsed_body
          created_template = CustomObjectTemplate.find(json['id'])
          custom_object = bid_pipeline.reload.custom_objects.find_by(custom_object_template_id: created_template.id)
          expect(custom_object).to be_present
          expect(custom_object.custom_object_items.pluck(:custom_object_template_item_value_id)).to match_array(
            created_template.custom_object_template_item_values.pluck(:id)
          )
        end
      end
    end

    context 'タイトルがない場合' do
      before { login_as(user) }

      it 'bad_requestを返す' do
        post "/v1/custom_object_templates", params: { title: '' }

        assert_response_schema_confirm(400)
        expect(response.parsed_body['errors']).to be_present
      end
    end
  end

  describe 'GET /v1/custom_object_templates/:id' do
    context '存在するテンプレートidを指定した場合' do
      before { login_as(user) }

      it 'テンプレート詳細を取得できる' do
        get "/v1/custom_object_templates/#{custom_object_template.id}"
        json = response.parsed_body
        assert_response_schema_confirm(200)
        expect(json).to have_key('id')
        expect(json['id']).to eq(custom_object_template.id)
      end

      it 'テンプレートアイテムの情報を正しく取得できる' do
        get "/v1/custom_object_templates/#{custom_object_template.id}"
        json = response.parsed_body
        expect(json['customObjectTemplateItems'].length).to eq(1)
        expect(json['customObjectTemplateItems'][0]['id']).to eq(template_item.id)
        expect(json['customObjectTemplateItems'][0]['title']).to eq(template_item.title)
        expect(json['customObjectTemplateItems'][0]['description']).to eq(template_item.description)
      end

      it 'テンプレートアイテムの入力タイプと値を正しく取得できる' do
        get "/v1/custom_object_templates/#{custom_object_template.id}"
        json = response.parsed_body
        expect(json['customObjectTemplateItems'][0]['inputType']).to eq(template_item.input_type)
        expect(json['customObjectTemplateItems'][0]['customObjectTemplateItemValues'].length).to eq(1)
        expect(json['customObjectTemplateItems'][0]['customObjectTemplateItemValues'][0]['id']).to eq(item_value.id)
        expect(json['customObjectTemplateItems'][0]['customObjectTemplateItemValues'][0]['choiceContent']).to eq(item_value.choice_content)
      end
    end

    context '存在しないテンプレートIDの場合' do
      before { login_as(user) }

      it '404エラーを返す' do
        get "/v1/custom_object_templates/#{CustomObjectTemplate.last.id + 1}"

        assert_response_schema_confirm(404)
      end
    end

    context '他のカンパニーのテンプレートにアクセスしようとした場合' do
      before { login_as(other_user) }

      it '403エラーを返す' do
        get "/v1/custom_object_templates/#{custom_object_template.id}"

        assert_response_schema_confirm(403)
      end
    end
  end

  describe 'PUT /v1/custom_object_templates/:id' do
    context 'テンプレートと関連アイテムを更新する場合' do
      let(:update_params) do
        {
          title: '更新後のタイトル',
          custom_object_template_items: [
            {
              id: template_item.id,
              title: '更新後のアイテムタイトル',
              description: '更新後の説明',
              input_type: 'checkbox',
              custom_object_template_item_values: [
                {
                  id: item_value.id,
                  choice_content: '更新後の選択肢'
                },
              ]
            },
          {
            title: '新規アイテム',
            description: '新規アイテムの説明',
            input_type: 'free_text',
            custom_object_template_item_values: []
            },
            {
              title: '改行ありテキスト',
              description: '改行に対応したテキスト',
              input_type: 'free_text_multiline',
              custom_object_template_item_values: []
            }
          ]
        }
      end

      before { login_as(user) }

      it 'テンプレートのタイトルを更新できる' do
        put "/v1/custom_object_templates/#{custom_object_template.id}", params: update_params

        Rails.logger.debug response.parsed_body
        json = response.parsed_body
        assert_response_schema_confirm(200)
        expect(json['title']).to eq('更新後のタイトル')
        expect(json['customObjectTemplateItems'].length).to eq(3)
      end

      it '既存のテンプレートアイテムを更新できる' do
        put "/v1/custom_object_templates/#{custom_object_template.id}", params: update_params

        json = response.parsed_body
        updated_item = json['customObjectTemplateItems'].find { |item| item['id'] == template_item.id }
        expect(updated_item['title']).to eq('更新後のアイテムタイトル')
      end

      it '新規のテンプレートアイテムを作成できる' do
        put "/v1/custom_object_templates/#{custom_object_template.id}", params: update_params

        json = response.parsed_body
        new_item = json['customObjectTemplateItems'].find { |item| item['title'] == '新規アイテム' }
        expect(new_item).to be_present
        expect(new_item['inputType']).to eq('free_text')

        multiline_item = json['customObjectTemplateItems'].find { |item| item['title'] == '改行ありテキスト' }
        expect(multiline_item).to be_present
        expect(multiline_item['inputType']).to eq('free_text_multiline')
      end
    end

    context '存在しないテンプレートIDの場合' do
      let(:update_params) do
        {
          title: '更新後のタイトル',
          custom_object_template_items: [
            {
              id: template_item.id,
              title: '更新後のアイテムタイトル',
              description: '更新後の説明',
              input_type: 'checkbox',
              custom_object_template_item_values: [
                {
                  id: item_value.id,
                  choice_content: '更新後の選択肢'
                },
              ]
            },
            {
              title: '新規アイテム',
              description: '新規アイテムの説明',
              input_type: 'free_text',
              custom_object_template_item_values: []
            }
          ]
        }
      end

      before { login_as(user) }

      it '404エラーを返す' do
        put "/v1/custom_object_templates/#{CustomObjectTemplate.last.id + 1}", params: update_params

        assert_response_schema_confirm(404)
      end
    end

    context '無効なパラメータの場合' do
      let(:update_params) do
        {
          title: '更新後のタイトル',
          custom_object_template_items: [
            {
              id: template_item.id,
              title: '更新後のアイテムタイトル',
              description: '更新後の説明',
              input_type: 'checkbox',
              custom_object_template_item_values: [
                {
                  id: item_value.id,
                  choice_content: '更新後の選択肢'
                },
              ]
            },
            {
              title: '新規アイテム',
              description: '新規アイテムの説明',
              input_type: 'free_text',
              custom_object_template_item_values: []
            }
          ]
        }
      end

      before { login_as(user) }

      it '400エラーを返す' do
        put "/v1/custom_object_templates/#{custom_object_template.id}", params: { title: '' }

        assert_response_schema_confirm(400)
      end
    end

    context '他のカンパニーのテンプレートを更新しようとした場合' do
      let(:update_params) do
        {
          title: '更新後のタイトル',
          custom_object_template_items: [
            {
              id: template_item.id,
              title: '更新後のアイテムタイトル',
              description: '更新後の説明',
              input_type: 'checkbox',
              custom_object_template_item_values: [
                {
                  id: item_value.id,
                  choice_content: '更新後の選択肢'
                },
              ]
            },
            {
              title: '新規アイテム',
              description: '新規アイテムの説明',
              input_type: 'free_text',
              custom_object_template_item_values: []
            }
          ]
        }
      end

      before { login_as(other_user) }

      it '403エラーを返す' do
        put "/v1/custom_object_templates/#{custom_object_template.id}", params: update_params

        assert_response_schema_confirm(403)
      end
    end

    context 'テンプレートアイテムを追加した場合' do
      let!(:custom_object) { create(:custom_object, custom_object_template: custom_object_template) }
      let(:add_item_params) do
        {
          title: 'テンプレートタイトル',
          custom_object_template_items: [
            {
              id: template_item.id,
              title: 'existing item',
              description: 'existing description',
              input_type: 'checkbox',
              custom_object_template_item_values: [
                {
                  id: item_value.id,
                  choice_content: 'existing choice'
                }
              ]
            },
            {
              title: '新規追加アイテム',
              description: '新規追加アイテムの説明',
              input_type: 'checkbox',
              custom_object_template_item_values: [
                {
                  choice_content: '新規選択肢1'
                },
                {
                  choice_content: '新規選択肢2'
                }
              ]
            }
          ]
        }
      end

      before { login_as(user) }

      it '既存のカスタムオブジェクトに対して新しいテンプレートアイテムに対応するカスタムオブジェクトアイテムが作成される' do
        create(:custom_object_item, custom_object: custom_object, custom_object_template_item_value: item_value)

        expect {
          put "/v1/custom_object_templates/#{custom_object_template.id}", params: add_item_params
        }.to change(CustomObjectItem, :count).by(2)
      end
    end

    context 'テンプレートアイテムを削除した場合' do
      let(:remove_item_params) do
        {
          title: 'テンプレートタイトル',
          custom_object_template_items: []
        }
      end

      before do
        login_as(user)
        create(:custom_object, custom_object_template: custom_object_template)
      end

      it '削除されたテンプレートアイテムに対応するカスタムオブジェクトアイテムも削除される' do
        expect {
          put "/v1/custom_object_templates/#{custom_object_template.id}", params: remove_item_params
        }.to change(CustomObjectItem, :count).from(1).to(0)
          .and change(CustomObjectTemplateItem, :count).from(1).to(0)
          .and change(CustomObjectTemplateItemValue, :count).from(1).to(0)
      end
    end
  end

  describe 'DELETE /v1/custom_object_templates/:id' do
    context 'テンプレートを削除する場合' do
      before do
        login_as(user)
        create(:custom_object, custom_object_template: custom_object_template)
      end

      it 'テンプレートを削除できる' do
        expect {
          delete "/v1/custom_object_templates/#{custom_object_template.id}"
        }.to change(CustomObjectTemplate, :count).by(-1)

        assert_response_schema_confirm(200)
      end

      it '関連するアイテムも削除される' do
        expect {
          delete "/v1/custom_object_templates/#{custom_object_template.id}"
        }.to change(CustomObjectTemplateItem, :count).from(1).to(0)
          .and change(CustomObjectTemplateItemValue, :count).from(1).to(0)
          .and change(CustomObjectItem, :count).from(1).to(0)
          .and change(CustomObject, :count).from(1).to(0)
      end
    end

    context '存在しないテンプレートIDの場合' do
      before do
        login_as(user)
        create(:custom_object, custom_object_template: custom_object_template)
      end

      it '404エラーを返す' do
        delete "/v1/custom_object_templates/#{CustomObjectTemplate.last.id + 1}"

        assert_response_schema_confirm(404)
      end
    end

    context '他のカンパニーのテンプレートを削除しようとした場合' do
      before do
        login_as(other_user)
        create(:custom_object, custom_object_template: custom_object_template)
      end

      it '403エラーを返す' do
        delete "/v1/custom_object_templates/#{custom_object_template.id}"

        assert_response_schema_confirm(403)
      end
    end
  end
end
