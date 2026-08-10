require 'rails_helper'

RSpec.describe 'Projects' do
  describe 'GET /v1/projects/search' do
    context 'ログインしている場合' do
      before { login_as(create(:user)) }

      it '都道府県を2つ以上指定して検索できること' do
        get "/v1/projects/search?#{{ prefectures: [10, 11] }.to_query}"
        assert_response_schema_confirm(200)
      end

      it '2ページ目以降を指定して検索できること' do
        get "/v1/projects/search?#{{ page: 2 }.to_query}"
        assert_response_schema_confirm(200)
      end

      it '許可リスト外の発注機関名を指定しても検索できること' do
        get "/v1/projects/search?#{{ keywords: ['hoge'] }.to_query}"
        assert_response_schema_confirm(200)
      end

      

    context 'ログインしていない場合' do
      it '都道府県を1つ指定すると検索できること' do
        get "/v1/projects/search?#{{ prefectures: [10] }.to_query}"
        assert_response_schema_confirm(200)
      end

      it '都道府県を2つ以上指定すると検索できること（利用回数制限内の場合）' do
        get "/v1/projects/search?#{{ prefectures: [10, 11] }.to_query}"
        assert_response_schema_confirm(200)
      end

      it '2ページ目以降を指定して検索できること（利用回数制限内の場合）' do
        get "/v1/projects/search?#{{ page: 2 }.to_query}"
        assert_response_schema_confirm(200)
      end

      it 'キーワードが1つの場合は検索できること' do
        get "/v1/projects/search?#{{ orKeywords: ['hoge'] }.to_query}"
        assert_response_schema_confirm(200)
      end

      it 'キーワードが2つの場合は検索できること（利用回数制限内の場合）' do
        get "/v1/projects/search?#{{ orKeywords: ['hoge', 'aaa'] }.to_query}"
        assert_response_schema_confirm(200)
      end
    end
  end

  describe 'GET /v1/projects/:id' do
    it '正常に取得できること' do
      project = create(:project)
      get "/v1/projects/#{project.uuid}"
      assert_response_schema_confirm(200)
    end
  end

  describe 'GET /v1/projects/:id/similar_projects' do
    let(:company) { create(:company) }
    let(:user) { create(:user, company: company) }
    let(:project) { create(:project) }
    let(:similar_project) { create(:project) }
    let(:relation) { Project.where(id: similar_project.id) }

    before do
      # Projectの作成時のコールバック（埋め込み生成）を無効化
      allow_any_instance_of(Project).to receive(:check_and_build_project_embeddings)
    end

    context 'ログインしている場合' do
      before { login_as(user) }

      context 'sizeパラメータが指定されていない場合' do
        let(:service_double) { instance_double(ProjectSimilarProjectsFetcher, call: relation) }

        before do
          allow(ProjectSimilarProjectsFetcher).to receive(:new).and_return(service_double)
        end

        it 'デフォルトで10件の似ている案件を取得できること' do
          get "/v1/projects/#{project.uuid}/similar_projects"

          expect(response).to have_http_status(:ok)
          assert_response_schema_confirm(200)
          expect(ProjectSimilarProjectsFetcher).to have_received(:new).with(
            project: kind_of(Project),
            company_id: user.company_id,
            size: 10
          )
        end
      end

      context 'sizeパラメータが5の場合' do
        let(:service_double) { instance_double(ProjectSimilarProjectsFetcher, call: relation) }

        before do
          allow(ProjectSimilarProjectsFetcher).to receive(:new).and_return(service_double)
        end

        it '上位5件の似ている案件を取得できること' do
          get "/v1/projects/#{project.uuid}/similar_projects", params: { size: 5 }

          expect(response).to have_http_status(:ok)
          assert_response_schema_confirm(200)
          expect(ProjectSimilarProjectsFetcher).to have_received(:new).with(
            project: kind_of(Project),
            company_id: user.company_id,
            size: 5
          )
        end
      end

      context 'sizeパラメータが100を超える場合' do
        let(:service_double) { instance_double(ProjectSimilarProjectsFetcher, call: relation) }

        before do
          allow(ProjectSimilarProjectsFetcher).to receive(:new).and_return(service_double)
        end

        it '最大100件に制限されること' do
          get "/v1/projects/#{project.uuid}/similar_projects", params: { size: 200 }

          expect(response).to have_http_status(:ok)
          expect(ProjectSimilarProjectsFetcher).to have_received(:new).with(
            project: kind_of(Project),
            company_id: user.company_id,
            size: 100
          )
        end
      end

      context 'sizeパラメータが0以下の場合' do
        let(:service_double) { instance_double(ProjectSimilarProjectsFetcher, call: relation) }

        before do
          allow(ProjectSimilarProjectsFetcher).to receive(:new).and_return(service_double)
        end

        it '最小1件に制限されること' do
          get "/v1/projects/#{project.uuid}/similar_projects", params: { size: 0 }

          expect(response).to have_http_status(:ok)
          expect(ProjectSimilarProjectsFetcher).to have_received(:new).with(
            project: kind_of(Project),
            company_id: user.company_id,
            size: 1
          )
        end

        it '負の値の場合も最小1件に制限されること' do
          get "/v1/projects/#{project.uuid}/similar_projects", params: { size: -10 }

          expect(response).to have_http_status(:ok)
          expect(ProjectSimilarProjectsFetcher).to have_received(:new).with(
            project: kind_of(Project),
            company_id: user.company_id,
            size: 1
          )
        end
      end

      context 'プロジェクトが存在しない場合' do
        it '404が返ること' do
          get "/v1/projects/non-existent-uuid/similar_projects"

          expect(response).to have_http_status(:not_found)
        end
      end

    end

    context 'ログインしていない場合' do
      it '401が返ること' do
        get "/v1/projects/#{project.uuid}/similar_projects"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'GET /v1/projects/business_description_search' do
    context 'ログインしている場合' do
      let(:company) { create(:company) }
      let(:user) { create(:user, company: company) }

      before { login_as(user) }

      it '正常に取得できること' do
        business_description_format = create(:business_description_format, company: user.company)

        get "/v1/projects/business_description_search?#{{ business_description_format_id: business_description_format.id }.to_query}"
        assert_response_schema_confirm(200)
      end

      it '絞り込み条件を指定して検索できること' do
        business_description_format = create(:business_description_format, company: user.company)

        get "/v1/projects/business_description_search?#{{
          business_description_format_id: business_description_format.id,
          keywords: ['keyword1', 'keyword2'],
          or_keywords: ['or_keyword1', 'or_keyword2'],
          not_keywords: ['not_keyword1', 'not_keyword2'],
          prefectures: [10, 11],
          publication_date_from: '2021-01-01',
          publication_date_to: '2021-12-31',
          planned_price_from: 1000000,
          planned_price_to: 2000000,
          is_experience_required: true,
          tender_opening_date_from: '2021-02-01',
          tender_opening_date_to: '2021-11-30',
        }.to_query}"
        assert_response_schema_confirm(200)
      end

      it '存在しない事業情報フォーマットIDを指定したら404エラーになること' do
        get "/v1/projects/business_description_search?#{{ business_description_format_id: 0 }.to_query}"
        assert_response_schema_confirm(404)
      end
    end

    context 'ログインしていない場合' do
      it '認証エラー' do
        get "/v1/projects/business_description_search?#{{ business_description_format_id: 0 }.to_query}"
        assert_response_schema_confirm(401)
      end
    end
  end

  describe '利用回数制限機能' do
    let(:ip_address) { '192.168.1.100' }

    before do
      allow_any_instance_of(ActionDispatch::Request).to receive(:remote_ip).and_return(ip_address)
    end

    context 'ログインしていない場合' do
      describe 'GET /v1/projects/search' do
        it '初回利用時に利用回数が記録されること' do
          expect {
            get "/v1/projects/search?#{{ prefectures: [10] }.to_query}"
          }.to change(GuestFeatureUsage, :count).by(1)

          usage = GuestFeatureUsage.find_by(identifier: ip_address)
          expect(usage).to have_attributes(
            identifier: ip_address,
            count: 1,
            period_started_at: be_within(1.second).of(Time.current)
          )
        end

        it '利用回数制限内で検索できること' do
          create(:guest_feature_usage, identifier: ip_address, count: 4)

          get "/v1/projects/search?#{{ prefectures: [10] }.to_query}"
          assert_response_schema_confirm(200)

          usage = GuestFeatureUsage.find_by(identifier: ip_address)
          expect(usage.count).to eq(5)
        end

        it '利用回数制限に達すると303が返されること' do
          # 上限に達した状態
          create(:guest_feature_usage, identifier: ip_address, count: 5)

          get "/v1/projects/search?#{{ prefectures: [10] }.to_query}"
          assert_response_schema_confirm(303)
        end

        it '期間が満了すると利用回数がリセットされること' do
          # 期間満了のレコード
          create(:guest_feature_usage, identifier: ip_address, count: 5, period_started_at: 2.months.ago)

          get "/v1/projects/search?#{{ prefectures: [10] }.to_query}"
          assert_response_schema_confirm(200)

          usage = GuestFeatureUsage.find_by(identifier: ip_address)
          expect(usage.count).to eq(1)
          expect(usage.period_started_at).to be_within(1.second).of(Time.current)
        end
      end
    end

    context 'ログインしている場合' do
      let(:user) { create(:user) }

      before { login_as(user) }

      it '利用回数制限が適用されないこと' do
        get "/v1/projects/search?#{{ prefectures: [10, 11] }.to_query}"
        assert_response_schema_confirm(200)
        expect(GuestFeatureUsage.where(identifier: ip_address)).to be_empty
      end
    end
  end
end
end