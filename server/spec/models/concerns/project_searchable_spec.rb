require 'rails_helper'

RSpec.describe Project, :elasticsearch, type: :model do
  describe '.search' do
    context '大阪・関西万博徳島県ブース運営業務' do
      let!(:project) { create(:project, raw_title: '大阪・関西万博徳島県ブース運営業務') }

      before do
        Project.__elasticsearch__.refresh_index!
      end

      context '完全一致検索' do
        it 'returns the project' do
          expect(Project.search(keywords: ['大阪・関西万博徳島県ブース運営業務']).records.ids.map(&:to_i)).to eq([project.id])
        end
      end

      context '部分一致検索' do
        it 'returns the project' do
          aggregate_failures do
            expect(Project.search(keywords: ['大阪']).records.ids.map(&:to_i)).to eq([project.id])
            expect(Project.search(keywords: ['関西']).records.ids.map(&:to_i)).to eq([project.id])
            expect(Project.search(keywords: ['大阪・関西万博']).records.ids.map(&:to_i)).to eq([project.id])
            expect(Project.search(keywords: ['万博']).records.ids.map(&:to_i)).to eq([project.id])
            expect(Project.search(keywords: ['徳島']).records.ids.map(&:to_i)).to eq([project.id])
            expect(Project.search(keywords: ['徳島県']).records.ids.map(&:to_i)).to eq([project.id])
            expect(Project.search(keywords: ['ブース']).records.ids.map(&:to_i)).to eq([project.id])
            expect(Project.search(keywords: ['ブース運営業務']).records.ids.map(&:to_i)).to eq([project.id])
          end
        end
      end
    end

    context '「目黒区バーチャルミュージアム構築及び運用保守業務委託」' do
      let!(:project) { create(:project, raw_title: '「目黒区バーチャルミュージアム構築及び運用保守業務委託」') }

      before do
        Project.__elasticsearch__.refresh_index!
      end

      context '完全一致検索' do
        it 'returns the project' do
          expect(Project.search(keywords: ['「目黒区バーチャルミュージアム構築及び運用保守業務委託」']).records.ids.map(&:to_i)).to eq([project.id])
        end
      end

      context '部分一致検索' do
        it 'returns the project' do
          aggregate_failures do
            expect(Project.search(keywords: ['「目黒区バーチャルミュージアム構築及び運用保守業務委託」']).records.ids.map(&:to_i)).to eq([project.id])
            expect(Project.search(keywords: ['目黒区バーチャルミュージアム構築及び運用保守業務委託']).records.ids.map(&:to_i)).to eq([project.id])
            expect(Project.search(keywords: ['バーチャル']).records.ids.map(&:to_i)).to eq([project.id])
            expect(Project.search(keywords: ['バーチャルミュージアム']).records.ids.map(&:to_i)).to eq([project.id])
          end
        end
      end
    end

    context '名古屋市地域包括ケアシステムガイドブック作成業務委託' do
      let!(:project) { create(:project, raw_title: '名古屋市地域包括ケアシステムガイドブック作成業務委託') }

      before do
        Project.__elasticsearch__.refresh_index!
      end

      context '完全一致検索' do
        it 'returns the project' do
          expect(Project.search(keywords: ['名古屋市地域包括ケアシステムガイドブック作成業務委託']).records.ids.map(&:to_i)).to eq([project.id])
        end
      end

      context '部分一致検索' do
        it 'returns the project' do
          aggregate_failures do
            expect(Project.search(keywords: ['名古屋市']).records.ids.map(&:to_i)).to eq([project.id])
            expect(Project.search(keywords: ['地域包括']).records.ids.map(&:to_i)).to eq([project.id])
            expect(Project.search(keywords: ['ケアシステム']).records.ids.map(&:to_i)).to eq([project.id])
            expect(Project.search(keywords: ['ガイドブック']).records.ids.map(&:to_i)).to eq([project.id])
            expect(Project.search(keywords: ['作成業務']).records.ids.map(&:to_i)).to eq([project.id])
            expect(Project.search(keywords: ['業務委託']).records.ids.map(&:to_i)).to eq([project.id])
          end
        end
      end
    end
  end

  describe '.build_sort_options' do
    context 'only_awardedがfalseまたは未指定の場合' do
      it 'デフォルトでpublication_date_descを返す' do
        result = Project.send(:build_sort_options, nil, false)
        expected = [{ publication_date: { order: 'desc' } }, { _score: { order: 'desc' } }]
        expect(result).to eq(expected)
      end

      it 'sort_byが未指定の場合もpublication_date_descを返す' do
        result = Project.send(:build_sort_options, nil)
        expected = [{ publication_date: { order: 'desc' } }, { _score: { order: 'desc' } }]
        expect(result).to eq(expected)
      end
    end

    context 'only_awardedがtrueの場合' do
      it 'デフォルトでtender_opening_date_descを返す' do
        result = Project.send(:build_sort_options, nil, true)
        expected = [{ tender_opening_date: { order: 'desc' } }, { _score: { order: 'desc' } }]
        expect(result).to eq(expected)
      end
    end

    context 'sort_byが指定されている場合' do
      it 'only_awardedに関係なく指定されたソートオプションを返す' do
        # only_awarded = false の場合
        result = Project.send(:build_sort_options, 'relevance_desc', false)
        expected = [{ _score: { order: 'desc' } }, { publication_date: { order: 'desc' } }]
        expect(result).to eq(expected)

        # only_awarded = true の場合
        result = Project.send(:build_sort_options, 'relevance_desc', true)
        expected = [{ _score: { order: 'desc' } }, { publication_date: { order: 'desc' } }]
        expect(result).to eq(expected)
      end

      it '各種ソートオプションが正しく返される' do
        aggregate_failures do
          # publication_date関連
          result = Project.send(:build_sort_options, 'publication_date_asc', false)
          expected = [{ publication_date: { order: 'asc' } }, { _score: { order: 'desc' } }]
          expect(result).to eq(expected)

          # tender_opening_date関連
          result = Project.send(:build_sort_options, 'tender_opening_date_asc', false)
          expected = [{ tender_opening_date: { order: 'asc' } }, { _score: { order: 'desc' } }]
          expect(result).to eq(expected)

          # application_document_deadline_date関連
          result = Project.send(:build_sort_options, 'application_document_deadline_date_desc', false)
          expected = [{ application_document_deadline_date: { order: 'desc' } }, { _score: { order: 'desc' } }]
          expect(result).to eq(expected)

          # proposal_document_deadline_date関連
          result = Project.send(:build_sort_options, 'proposal_document_deadline_date_asc', false)
          expected = [{ proposal_document_deadline_date: { order: 'asc' } }, { _score: { order: 'desc' } }]
          expect(result).to eq(expected)

          # bidding_deadline_date関連
          result = Project.send(:build_sort_options, 'bidding_deadline_date_desc', false)
          expected = [{ bidding_deadline_date: { order: 'desc' } }, { _score: { order: 'desc' } }]
          expect(result).to eq(expected)
        end
      end
    end
  end

  describe '.build_prefectures_query' do
    context 'prefecture_codesが空の場合' do
      it 'nilを返す' do
        result = Project.send(:build_prefectures_query, nil)
        expect(result).to be_nil

        result = Project.send(:build_prefectures_query, [])
        expect(result).to be_nil
      end
    end

    context 'prefecture_codesが数値ID配列の場合' do
      it 'フォーマットされたコードでtermsクエリを返す' do
        result = Project.send(:build_prefectures_query, [13, 27])
        expected = {
          terms: {
            lg_codes: ['13', '27'],
            boost: 1.0
          }
        }
        expect(result).to eq(expected)
      end
    end

    context 'prefecture_codesが文字列ID配列の場合' do
      it 'フォーマットされたコードでtermsクエリを返す' do
        result = Project.send(:build_prefectures_query, ['13', '27'])
        expected = {
          terms: {
            lg_codes: ['13', '27'],
            boost: 1.0
          }
        }
        expect(result).to eq(expected)
      end
    end

    context 'prefecture_codesが都道府県名配列の場合' do
      it '変換されたコードでtermsクエリを返す' do
        result = Project.send(:build_prefectures_query, ['東京都', '大阪府'])
        expected = {
          terms: {
            lg_codes: ['13', '27'],
            boost: 1.0
          }
        }
        expect(result).to eq(expected)
      end
    end

    context 'prefecture_codesが混在配列（ID、都道府県名）の場合' do
      it '正しく変換・フォーマットされたコードでtermsクエリを返す' do
        result = Project.send(:build_prefectures_query, ['13', '大阪府', 14, '京都府'])
        expected = {
          terms: {
            lg_codes: ['13', '27', '14', '26'],
            boost: 1.0
          }
        }
        expect(result).to eq(expected)
      end
    end

    context 'boostパラメータが指定された場合' do
      it '指定されたboost値を含むtermsクエリを返す' do
        result = Project.send(:build_prefectures_query, ['13'], 2.5)
        expected = {
          terms: {
            lg_codes: ['13'],
            boost: 2.5
          }
        }
        expect(result).to eq(expected)
      end
    end

    context '無効な都道府県名が含まれる場合' do
      it '有効なコードのみでtermsクエリを返す' do
        result = Project.send(:build_prefectures_query, ['東京都', '無効な県', '大阪府'])
        expected = {
          terms: {
            lg_codes: ['13', '27'],
            boost: 1.0
          }
        }
        expect(result).to eq(expected)
      end
    end

    context '全て無効なデータの場合' do
      it 'nilを返す' do
        result = Project.send(:build_prefectures_query, ['無効な県', '不明な都市'])
        expect(result).to be_nil
      end
    end

    context 'nilが含まれる配列の場合' do
      it '有効なコードのみでtermsクエリを返す' do
        result = Project.send(:build_prefectures_query, ['13', nil, '大阪府'])
        expected = {
          terms: {
            lg_codes: ['13', '27'],
            boost: 1.0
          }
        }
        expect(result).to eq(expected)
      end
    end
  end

  describe '.build_and_query' do
    context 'keywordsが空の場合' do
      it '空配列を返す' do
        result = Project.send(:build_and_query, nil)
        expect(result).to eq([])

        result = Project.send(:build_and_query, [])
        expect(result).to eq([])
      end
    end

    context 'keywordsが指定されている場合' do
      context 'use_synonymがtrueまたは未指定の場合' do
        it 'titleとtitle.23gramフィールドに対するmulti_matchクエリを返す' do
          # use_synonym未指定（デフォルトtrue）
          result = Project.send(:build_and_query, ['キーワード1', 'キーワード2'])
          expected = {
            bool: {
              must: [
                {
                  multi_match: {
                    type: 'phrase',
                    query: 'キーワード1',
                    fields: ['title', 'title.23gram']
                  }
                },
                {
                  multi_match: {
                    type: 'phrase',
                    query: 'キーワード2',
                    fields: ['title', 'title.23gram']
                  }
                }
              ]
            }
          }
          expect(result).to eq(expected)

          # use_synonym明示的にtrue
          result = Project.send(:build_and_query, ['キーワード1'], true)
          expected = {
            bool: {
              must: [
                {
                  multi_match: {
                    type: 'phrase',
                    query: 'キーワード1',
                    fields: ['title', 'title.23gram']
                  }
                }
              ]
            }
          }
          expect(result).to eq(expected)
        end
      end

      context 'use_synonymがfalseの場合' do
        it 'title.kuromojiとtitle.23gramフィールドに対するmulti_matchクエリを返す' do
          result = Project.send(:build_and_query, ['キーワード1', 'キーワード2'], false)
          expected = {
            bool: {
              must: [
                {
                  multi_match: {
                    type: 'phrase',
                    query: 'キーワード1',
                    fields: ['title.kuromoji', 'title.23gram']
                  }
                },
                {
                  multi_match: {
                    type: 'phrase',
                    query: 'キーワード2',
                    fields: ['title.kuromoji', 'title.23gram']
                  }
                }
              ]
            }
          }
          expect(result).to eq(expected)
        end
      end
    end
  end

  describe '.build_keywords_query' do
    context 'keywordsが空の場合' do
      it 'nilを返す' do
        result = Project.send(:build_keywords_query, nil)
        expect(result).to be_nil

        result = Project.send(:build_keywords_query, '')
        expect(result).to be_nil
      end
    end

    context 'keywordsが指定されている場合' do
      it 'title、title.23gram、descriptionフィールドに対するmulti_matchクエリを返す' do
        result = Project.send(:build_keywords_query, 'キーワード1 キーワード2', 2.0)
        expected = {
          bool: {
            should: [
              {
                multi_match: {
                  type: 'phrase',
                  query: 'キーワード1',
                  fields: ['title', 'title.23gram', 'description'],
                  boost: 2.0
                }
              },
              {
                multi_match: {
                  type: 'phrase',
                  query: 'キーワード2',
                  fields: ['title', 'title.23gram', 'description'],
                  boost: 2.0
                }
              }
            ]
          }
        }
        expect(result).to eq(expected)
      end

      it 'boostが指定されていない場合はデフォルト値1.0を使用' do
        result = Project.send(:build_keywords_query, 'テスト')
        expect(result[:bool][:should][0][:multi_match][:boost]).to eq(1.0)
      end
    end
  end

  describe '.build_organization_name_query' do
    context 'organization_nameが空の場合' do
      it 'nilを返す' do
        result = Project.send(:build_organization_name_query, nil)
        expect(result).to be_nil

        result = Project.send(:build_organization_name_query, '')
        expect(result).to be_nil
      end
    end

    context 'organization_nameが指定されている場合' do
      it 'organization_nameフィールドに対するtermクエリを返す' do
        result = Project.send(:build_organization_name_query, '東京都')
        expected = {
          term: {
            organization_name: '東京都'
          }
        }
        expect(result).to eq(expected)
      end
    end
  end

  describe '.build_planned_price_query' do
    context '価格範囲が指定されていない場合' do
      it 'nilを返す' do
        result = Project.send(:build_planned_price_query, nil, nil)
        expect(result).to be_nil
      end
    end

    context '価格範囲が指定されている場合' do
      it '範囲クエリを返す' do
        result = Project.send(:build_planned_price_query, 1000000, 5000000, 2.0)
        expected = {
          range: {
            planned_price: {
              gte: 1000000,
              lte: 5000000,
              boost: 2.0
            }
          }
        }
        expect(result).to eq(expected)
      end

      it '下限のみ指定の場合' do
        result = Project.send(:build_planned_price_query, 1000000, nil)
        expected = {
          range: {
            planned_price: {
              gte: 1000000,
              boost: 1.0
            }
          }
        }
        expect(result).to eq(expected)
      end
    end
  end

  describe '.build_is_experience_required_query' do
    context 'is_experience_requiredが空の場合' do
      it 'nilを返す' do
        result = Project.send(:build_is_experience_required_query, nil)
        expect(result).to be_nil

        result = Project.send(:build_is_experience_required_query, '')
        expect(result).to be_nil
      end
    end

    context 'is_experience_requiredが指定されている場合' do
      it 'termクエリを返す' do
        result = Project.send(:build_is_experience_required_query, true, 1.5)
        expected = {
          term: {
            is_experience_required: {
              value: true,
              boost: 1.5
            }
          }
        }
        expect(result).to eq(expected)
      end

      it 'boostが指定されていない場合はデフォルト値1.0を使用' do
        result = Project.send(:build_is_experience_required_query, true)
        expect(result[:term][:is_experience_required][:boost]).to eq(1.0)
      end
    end
  end

  describe '.build_is_hidden_query' do
    it '非表示フィルターのtermクエリを返す' do
      result = Project.send(:build_is_hidden_query)
      expected = {
        term: {
          is_hidden: false
        }
      }
      expect(result).to eq(expected)
    end
  end

  describe '.build_publication_date_range_query' do
    context '日付範囲が指定されていない場合' do
      it 'nilを返す' do
        result = Project.send(:build_publication_date_range_query, nil, nil)
        expect(result).to be_nil
      end
    end

    context '日付範囲が指定されている場合' do
      it '範囲クエリを返す' do
        from_date = Date.new(2023, 1, 1)
        to_date = Date.new(2023, 12, 31)
        result = Project.send(:build_publication_date_range_query, from_date, to_date, 2.0)

        expected = {
          range: {
            publication_date: {
              gte: from_date,
              lte: to_date,
              boost: 2.0
            }
          }
        }
        expect(result).to eq(expected)
      end

      it '開始日のみ指定の場合' do
        from_date = Date.new(2023, 1, 1)
        result = Project.send(:build_publication_date_range_query, from_date, nil)

        expected = {
          range: {
            publication_date: {
              gte: from_date,
              boost: 1.0
            }
          }
        }
        expect(result).to eq(expected)
      end
    end
  end

  describe '.build_security_qualification_query' do
    context 'security_qualificationが空の場合' do
      it 'nilを返す' do
        result = Project.send(:build_security_qualification_query, nil)
        expect(result).to be_nil

        result = Project.send(:build_security_qualification_query, [])
        expect(result).to be_nil
      end
    end

    context 'security_qualificationが指定されている場合' do
      it '通常のsecurity_qualificationに対してtermクエリを返す' do
        result = Project.send(:build_security_qualification_query, ['機密2級'])
        expected = {
          bool: {
            should: [
              {
                term: {
                  security_qualification: '機密2級'
                }
              }
            ]
          }
        }
        expect(result).to eq(expected)
      end

      it '"不要"が含まれる場合は存在しないことを条件に含む' do
        result = Project.send(:build_security_qualification_query, ['不要', '機密2級'])
        expected = {
          bool: {
            should: [
              {
                bool: {
                  must_not: {
                    exists: {
                      field: 'security_qualification'
                    }
                  }
                }
              },
              {
                term: {
                  security_qualification: '機密2級'
                }
              }
            ]
          }
        }
        expect(result).to eq(expected)
      end
    end
  end

  describe 'ステータスフィルター' do
    describe '.open_status_filter' do
      it '受付中案件のフィルタークエリを返す' do
        result = Project.send(:open_status_filter)
        expect(result[:bool][:should]).to be_an(Array)
        expect(result[:bool][:should].length).to eq(3)

        # 申込書類期日があり、今日以降の案件
        expect(result[:bool][:should][0][:bool][:must]).to include(
          { exists: { field: 'application_document_deadline_date' } }
        )
        expect(result[:bool][:should][0][:bool][:must]).to include(
          { range: { application_document_deadline_date: { gte: 'now/d' } } }
        )
      end
    end

    describe '.closed_status_filter' do
      it '受付終了案件のフィルタークエリを返す' do
        result = Project.send(:closed_status_filter)
        expect(result[:bool][:should]).to be_an(Array)
        expect(result[:bool][:should].length).to eq(3)

        # 申込書類期日があり、今日より前の案件
        expect(result[:bool][:should][0][:bool][:must]).to include(
          { exists: { field: 'application_document_deadline_date' } }
        )
        expect(result[:bool][:should][0][:bool][:must]).to include(
          { range: { application_document_deadline_date: { lt: 'now/d' } } }
        )
      end
    end

    describe '.new_status_filter' do
      it '新着案件のフィルタークエリを返す' do
        result = Project.send(:new_status_filter)
        expected = {
          range: {
            publication_date: {
              gte: 'now-1d/d',
              lte: 'now/d'
            }
          }
        }
        expect(result).to eq(expected)
      end
    end

    describe '.all_status_filter' do
      it '全案件のフィルタークエリを返す' do
        result = Project.send(:all_status_filter)
        expected = {
          match_all: {}
        }
        expect(result).to eq(expected)
      end
    end

    describe '.awarded_project_filter' do
      it '落札案件のフィルタークエリを返す' do
        result = Project.send(:awarded_project_filter)
        expected = {
          term: {
            has_awarded_project: true
          }
        }
        expect(result).to eq(expected)
      end
    end
  end

  describe '.build_date_filters' do
    context '日付パラメータが空の場合' do
      it '空配列を返す' do
        result = Project.send(:build_date_filters, {})
        expect(result).to eq([])
      end
    end

    context '日付パラメータが指定されている場合' do
      it '適切な日付フィルターを構築する' do
        args = {
          publication_date_from: '2023-01-01',
          publication_date_to: '2023-12-31',
          application_document_deadline_date_eq: 'null'
        }
        result = Project.send(:build_date_filters, args)

        expect(result).to be_an(Array)
        expect(result.length).to eq(2)

        # 公告日範囲フィルター
        range_filter = result.find { |f| f[:range] }
        expect(range_filter[:range][:publication_date][:gte]).to eq('2023-01-01')
        expect(range_filter[:range][:publication_date][:lte]).to eq('2023-12-31')

        # null値フィルター
        null_filter = result.find { |f| f[:bool]&.dig(:must_not) }
        expect(null_filter[:bool][:must_not][:exists][:field]).to eq(:application_document_deadline_date)
      end
    end
  end

  describe '.build_or_query' do
    context 'or_keywordsが空の場合' do
      it '空配列を返す' do
        result = Project.send(:build_or_query, nil)
        expect(result).to eq([])

        result = Project.send(:build_or_query, [])
        expect(result).to eq([])
      end
    end

    context 'or_keywordsが指定されている場合' do
      context 'use_synonymがtrueまたは未指定の場合' do
        it 'titleとtitle.23gramフィールドでフレーズ検索を使ったorクエリを返す' do
          # use_synonym未指定（デフォルトtrue）
          result = Project.send(:build_or_query, ['キーワード1', 'キーワード2'])
          expected = {
            bool: {
              should: [
                {
                  multi_match: {
                    type: 'phrase',
                    fields: ['title^3', 'title.23gram^2'],
                    query: 'キーワード1',
                    boost: 3.0
                  }
                },
                {
                  multi_match: {
                    type: 'phrase',
                    slop: 2,
                    fields: ['title^2', 'title.23gram'],
                    query: 'キーワード1',
                    boost: 1.0
                  }
                },
                {
                  multi_match: {
                    type: 'phrase',
                    fields: ['title^3', 'title.23gram^2'],
                    query: 'キーワード2',
                    boost: 3.0
                  }
                },
                {
                  multi_match: {
                    type: 'phrase',
                    slop: 2,
                    fields: ['title^2', 'title.23gram'],
                    query: 'キーワード2',
                    boost: 1.0
                  }
                }
              ],
              minimum_should_match: 1
            }
          }
          expect(result).to eq(expected)

          # use_synonym明示的にtrue
          result = Project.send(:build_or_query, ['キーワード1'], true)
          expected = {
            bool: {
              should: [
                {
                  multi_match: {
                    type: 'phrase',
                    fields: ['title^3', 'title.23gram^2'],
                    query: 'キーワード1',
                    boost: 3.0
                  }
                },
                {
                  multi_match: {
                    type: 'phrase',
                    slop: 2,
                    fields: ['title^2', 'title.23gram'],
                    query: 'キーワード1',
                    boost: 1.0
                  }
                }
              ],
              minimum_should_match: 1
            }
          }
          expect(result).to eq(expected)
        end
      end

      context 'use_synonymがfalseの場合' do
        it 'title.kuromojiとtitle.23gramフィールドでフレーズ検索を使ったorクエリを返す' do
          result = Project.send(:build_or_query, ['キーワード1', 'キーワード2'], false)
          expected = {
            bool: {
              should: [
                {
                  multi_match: {
                    type: 'phrase',
                    fields: ['title.kuromoji^3', 'title.23gram^2'],
                    query: 'キーワード1',
                    boost: 3.0
                  }
                },
                {
                  multi_match: {
                    type: 'phrase',
                    slop: 2,
                    fields: ['title.kuromoji^2', 'title.23gram'],
                    query: 'キーワード1',
                    boost: 1.0
                  }
                },
                {
                  multi_match: {
                    type: 'phrase',
                    fields: ['title.kuromoji^3', 'title.23gram^2'],
                    query: 'キーワード2',
                    boost: 3.0
                  }
                },
                {
                  multi_match: {
                    type: 'phrase',
                    slop: 2,
                    fields: ['title.kuromoji^2', 'title.23gram'],
                    query: 'キーワード2',
                    boost: 1.0
                  }
                }
              ],
              minimum_should_match: 1
            }
          }
          expect(result).to eq(expected)
        end
      end
    end
  end

  describe '.build_not_query' do
    context 'not_keywordsが空の場合' do
      it '空配列を返す' do
        result = Project.send(:build_not_query, nil)
        expect(result).to eq([])

        result = Project.send(:build_not_query, [])
        expect(result).to eq([])
      end
    end

    context 'not_keywordsが指定されている場合' do
      context 'use_synonymがtrueまたは未指定の場合' do
        it 'use_synonym未指定時にtitleとtitle.23gramフィールドに対するmulti_matchクエリの配列を返す' do
          result = Project.send(:build_not_query, ['除外キーワード1', '除外キーワード2'])
          expect(result).to be_an(Array)
          expect(result.length).to eq(2)
          expect(result[0][:multi_match][:query]).to eq('除外キーワード1')
          expect(result[0][:multi_match][:fields]).to eq(['title', 'title.23gram'])
          expect(result[1][:multi_match][:query]).to eq('除外キーワード2')
        end

        it 'use_synonym明示的にtrue時にtitleとtitle.23gramフィールドに対するmulti_matchクエリの配列を返す' do
          result = Project.send(:build_not_query, ['除外キーワード1'], true)
          expect(result).to be_an(Array)
          expect(result.length).to eq(1)
          expect(result[0][:multi_match][:query]).to eq('除外キーワード1')
          expect(result[0][:multi_match][:fields]).to eq(['title', 'title.23gram'])
        end
      end

      context 'use_synonymがfalseの場合' do
        it 'title.kuromojiとtitle.23gramフィールドに対するmulti_matchクエリの配列を返す' do
          result = Project.send(:build_not_query, ['除外キーワード1', '除外キーワード2'], false)
          expect(result).to be_an(Array)
          expect(result.length).to eq(2)
          expect(result[0][:multi_match][:query]).to eq('除外キーワード1')
          expect(result[0][:multi_match][:fields]).to eq(['title.kuromoji', 'title.23gram'])
          expect(result[1][:multi_match][:query]).to eq('除外キーワード2')
        end
      end
    end
  end

  describe '.build_search_params_from_search_filter_preset' do
    let(:user) { create(:user) }
    let(:preset) do
      create(:search_filter_preset,
        user: user,
        keywords: ['キーワード1', 'キーワード2'],
        or_keywords: ['ORキーワード1', 'ORキーワード2'],
        not_keywords: ['除外キーワード1', '除外キーワード2'],
        use_synonym_search: true,
        prefectures: [13, 27],
        organizations: ['東京都', '大阪府'],
        procedure_types: ['一般競争入札'],
        procedure_type_groups: ['一般競争入札'],
        period: '1week',
        publication_date_from: Date.new(2023, 1, 1),
        publication_date_to: Date.new(2023, 12, 31),
        planned_price_from: 1000000,
        planned_price_to: 5000000,
        is_experience_required: true,
        is_office_required: false,
        project_security_qualifications: ['ISMS'],
        no_qualification: true,
        deadline_days_remaining: 7,
        tender_opening_date_from: Date.new(2023, 2, 1),
        tender_opening_date_to: Date.new(2023, 11, 30)
      )
    end

    it 'SearchFilterPresetから検索パラメータを正しく構築すること' do
      result = Project.send(:build_search_params_from_search_filter_preset, preset)

      expect(result).to eq({
        keywords: ['キーワード1', 'キーワード2'],
        or_keywords: ['ORキーワード1', 'ORキーワード2'],
        not_keywords: ['除外キーワード1', '除外キーワード2'],
        use_synonym_search: true,
        prefectures: [13, 27],
        organizations: ['東京都', '大阪府'],
        procedure_types: ['一般競争入札'],
        procedure_type_groups: ['一般競争入札'],
        period: '1week',
        publication_date_from: Date.new(2023, 1, 1),
        publication_date_to: Date.new(2023, 12, 31),
        planned_price_from: 1000000,
        planned_price_to: 5000000,
        is_experience_required: true,
        is_office_required: false,
        project_security_qualifications: ['ISMS'],
        no_qualification: true,
        deadline_days_remaining: 7,
        tender_opening_date_from: Date.new(2023, 2, 1),
        tender_opening_date_to: Date.new(2023, 11, 30)
      })
    end

    context 'use_synonym_searchがfalseの場合' do
      let(:preset) { create(:search_filter_preset, user: user, use_synonym_search: false) }

      it 'use_synonym_searchがfalseで設定されること' do
        result = Project.send(:build_search_params_from_search_filter_preset, preset)
        expect(result[:use_synonym_search]).to be(false)
      end
    end

    context 'use_synonym_searchがnilの場合' do
      let(:preset) { create(:search_filter_preset, user: user, use_synonym_search: nil) }

      it 'use_synonym_searchがnilで設定されること' do
        result = Project.send(:build_search_params_from_search_filter_preset, preset)
        expect(result[:use_synonym_search]).to be_nil
      end
    end
  end
end
