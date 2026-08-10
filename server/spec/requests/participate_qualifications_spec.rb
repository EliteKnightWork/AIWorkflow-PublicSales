require 'rails_helper'

RSpec.describe 'ParticipateQualifications' do
  describe 'GET /v1/participate_qualifications' do
    let!(:tokyo_kensetsu) do
      create(:participate_qualification,
        name: '東京都建設業',
        participate_qualification_type: '都道府県',
        prefecture: '東京都',
        lg_code: '13'
      )
    end
    let!(:kanagawa_kensetsu) do
      create(:participate_qualification,
        name: '神奈川県建設業',
        participate_qualification_type: '都道府県',
        prefecture: '神奈川県',
        lg_code: '14'
      )
    end
    let!(:kokuyo_kensetsu) do
      create(:participate_qualification,
        name: '国土交通省建設業',
        participate_qualification_type: '官公庁',
        prefecture: nil,
        lg_code: nil
      )
    end

    before do
      ['A', 'B', 'C'].each_with_index do |grade_name, index|
        create(:participate_qualification_grade,
          participate_qualification: tokyo_kensetsu,
          name: grade_name,
          order: index + 1 # 1始まりの順序にするため
        )
      end

      ['特A', 'A', 'B'].each_with_index do |grade_name, index|
        create(:participate_qualification_grade,
          participate_qualification: kanagawa_kensetsu,
          name: grade_name,
          order: index + 1 # 1始まりの順序にするため
        )
      end

      ['S', 'A', 'B', 'C'].each_with_index do |grade_name, index|
        create(:participate_qualification_grade,
          participate_qualification: kokuyo_kensetsu,
          name: grade_name,
          order: index + 1 # 1始まりの順序にするため
        )
      end
    end

    context 'ログインしている場合' do
      before { login_as(create(:user)) }

      context 'パラメータなし' do
        it '全ての参加資格が取得できること' do
          get '/v1/participate_qualifications'

          expect(response).to have_http_status(:success)
          assert_response_schema_confirm(200)

          json = response.parsed_body
          qualifications = json['participateQualifications']

          expect(qualifications.length).to eq(3)
          expect(qualifications.pluck('name')).to contain_exactly('東京都建設業', '神奈川県建設業', '国土交通省建設業')
        end
      end

      context 'prefecturesを指定' do
        it '指定した都道府県の参加資格のみ取得できること' do
          get '/v1/participate_qualifications', params: { prefectures: ['13'] } # 東京都のコード

          expect(response).to have_http_status(:success)
          assert_response_schema_confirm(200)

          json = response.parsed_body
          qualifications = json['participateQualifications']

          expect(qualifications.length).to eq(1)
          expect(qualifications.first['name']).to eq('東京都建設業')
          expect(qualifications.first['grades'].pluck('name')).to eq(['A', 'B', 'C'])
        end

        it '複数の都道府県を指定できること' do
          get '/v1/participate_qualifications', params: { prefectures: ['13', '14'] } # 東京都と神奈川県

          expect(response).to have_http_status(:success)
          assert_response_schema_confirm(200)

          json = response.parsed_body
          qualifications = json['participateQualifications']

          expect(qualifications.length).to eq(2)
          expect(qualifications.pluck('name')).to contain_exactly('東京都建設業', '神奈川県建設業')
        end

        it '無効な都道府県コードは無視されること' do
          get '/v1/participate_qualifications', params: { prefectures: ['99', '13'] }

          expect(response).to have_http_status(:success)
          assert_response_schema_confirm(200)

          json = response.parsed_body
          qualifications = json['participateQualifications']

          expect(qualifications.length).to eq(1)
          expect(qualifications.first['name']).to eq('東京都建設業')
        end
      end

      context 'typesを指定' do
        it '指定したタイプの参加資格のみ取得できること' do
          get '/v1/participate_qualifications', params: { types: ['官公庁'] }

          expect(response).to have_http_status(:success)
          assert_response_schema_confirm(200)

          json = response.parsed_body
          qualifications = json['participateQualifications']

          expect(qualifications.length).to eq(1)
          expect(qualifications.first['name']).to eq('国土交通省建設業')
          expect(qualifications.first['grades'].pluck('name')).to eq(['S', 'A', 'B', 'C'])
        end

        it '複数のタイプを指定できること' do
          get '/v1/participate_qualifications', params: { types: ['都道府県', '官公庁'] }

          expect(response).to have_http_status(:success)
          assert_response_schema_confirm(200)

          json = response.parsed_body
          qualifications = json['participateQualifications']

          expect(qualifications.length).to eq(3)
          expect(qualifications.pluck('name')).to contain_exactly('東京都建設業', '神奈川県建設業', '国土交通省建設業')
        end
      end

      context 'prefecturesとtypesを両方指定' do
        it 'OR条件で絞り込まれること' do
          get '/v1/participate_qualifications', params: {
            prefectures: ['13'],
            types: ['官公庁']
          }

          expect(response).to have_http_status(:success)
          assert_response_schema_confirm(200)

          json = response.parsed_body
          qualifications = json['participateQualifications']

          expect(qualifications.length).to be > 1
          expect(qualifications.pluck('name')).to include('東京都建設業', '国土交通省建設業')
        end

      end

      context 'idsを指定' do
        it '指定したIDの参加資格のみ取得できること' do
          get '/v1/participate_qualifications', params: { ids: [tokyo_kensetsu.id] }

          expect(response).to have_http_status(:success)
          assert_response_schema_confirm(200)

          json = response.parsed_body
          qualifications = json['participateQualifications']

          expect(qualifications.length).to eq(1)
          expect(qualifications.first['name']).to eq('東京都建設業')
        end

        it '複数のIDを指定できること' do
          get '/v1/participate_qualifications', params: { ids: [tokyo_kensetsu.id, kanagawa_kensetsu.id] }

          expect(response).to have_http_status(:success)
          assert_response_schema_confirm(200)

          json = response.parsed_body
          qualifications = json['participateQualifications']

          expect(qualifications.length).to eq(2)
          expect(qualifications.pluck('name')).to contain_exactly('東京都建設業', '神奈川県建設業')
        end
      end

      context 'grade_idsを指定' do
        let!(:tokyo_grade_a) { tokyo_kensetsu.participate_qualification_grades.find_by(name: 'A') }
        let!(:kanagawa_grade_a) { kanagawa_kensetsu.participate_qualification_grades.find_by(name: 'A') }

        it '指定した等級IDを持つ参加資格のみ取得できること' do
          get '/v1/participate_qualifications', params: { grade_ids: [tokyo_grade_a.id] }

          expect(response).to have_http_status(:success)
          assert_response_schema_confirm(200)

          json = response.parsed_body
          qualifications = json['participateQualifications']

          expect(qualifications.length).to eq(1)
          expect(qualifications.first['name']).to eq('東京都建設業')
        end

        it '複数の等級IDを指定できること' do
          get '/v1/participate_qualifications', params: { grade_ids: [tokyo_grade_a.id, kanagawa_grade_a.id] }

          expect(response).to have_http_status(:success)
          assert_response_schema_confirm(200)

          json = response.parsed_body
          qualifications = json['participateQualifications']

          expect(qualifications.length).to eq(2)
          expect(qualifications.pluck('name')).to contain_exactly('東京都建設業', '神奈川県建設業')
        end
      end

      context 'gradesの順序' do
        it 'gradesがorder順にソートされていること' do
          # 順序を逆にしたgradesを追加
          create(:participate_qualification_grade,
            participate_qualification: tokyo_kensetsu,
            name: 'D',
            order: -1
          )

          get '/v1/participate_qualifications', params: { prefectures: ['13'] }

          expect(response).to have_http_status(:success)

          json = response.parsed_body
          qualifications = json['participateQualifications']

          expect(qualifications.first['grades'].pluck('name')).to eq(['D', 'A', 'B', 'C'])
        end
      end
    end

    context 'ログインしていない場合' do
      it '401エラーが返ること' do
        get '/v1/participate_qualifications'

        expect(response).to have_http_status(:unauthorized)
        assert_response_schema_confirm(401)
      end
    end
  end
end
