# == Schema Information
#
# Table name: search_filter_presets
# Database name: primary
#
#  id                                                     :bigint           not null, primary key
#  business_description(事業情報)                         :text(4294967295)
#  business_description_embedding(事業情報の埋め込み情報) :json
#  json_attributes(検索条件)                              :json             not null
#  notification_required(配信要否)                        :boolean          default(TRUE), not null
#  project_type(プロジェクト種別)                         :string(255)      default("Project"), not null
#  recommended(おすすめ条件フラグ)                        :boolean          default(FALSE), not null
#  title(検索条件名)                                      :string(255)
#  created_at                                             :datetime
#  updated_at                                             :datetime
#  user_id(ユーザーID)                                    :bigint           not null
#
# Indexes
#
#  index_search_filter_presets_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
require 'rails_helper'

RSpec.describe SearchFilterPreset, type: :model do
  describe 'validations' do
    it { is_expected.to validate_inclusion_of(:period).in_array(%w[1week 1month 3months]).allow_nil }

    describe '#any_condition_required' do
      context '検索条件がいずれか指定されている場合' do
        it 'エラーにならない' do
          user = create(:user)
          preset = build(:search_filter_preset, user: user)
          preset.valid?
          expect(preset.errors).to be_empty
        end
      end

      context '検索条件がいずれも指定されていない場合' do
        it 'エラーになる' do
          user = create(:user)
          preset = build(:search_filter_preset, :without_conditions, user: user)
          preset.valid?
          expect(preset.errors).to be_of_kind(:base, :any_condition_required)
        end
      end
    end

    describe '#check_limitation' do
      context '検索条件が登録上限数を超えている場合' do
        it 'おすすめを登録しようとするとエラーになる' do
          user = create(:user)
          create_list(:search_filter_preset, 5, user: user, recommended: true)
          preset = build(:search_filter_preset, user: user, recommended: true)
          preset.valid?
          expect(preset.errors).to be_of_kind(:base, :check_limitation)
        end

        it 'おすすめ以外を登録しようとするとエラーにならない' do
          user = create(:user)
          create_list(:search_filter_preset, 5, user: user, recommended: true)
          preset = build(:search_filter_preset, user: user)
          preset.valid?
          expect(preset.errors).to be_empty
        end
      end

      context '検索条件が登録上限数を超えていない場合' do
        it 'エラーにならない' do
          user = create(:user)
          create_list(:search_filter_preset, 4, user: user, recommended: true)
          preset = build(:search_filter_preset, user: user, recommended: true)
          preset.valid?
          expect(preset.errors).to be_empty
        end
      end
    end
  end

  describe 'callbacks' do
    describe 'before_validation' do
      describe '#title' do
        context 'titleが空の場合' do
          it 'nilになる' do
            preset = build(:search_filter_preset, title: '')
            preset.valid?
            expect(preset.title).to be_nil
          end
        end

        context 'titleが空でない場合' do
          it 'そのまま' do
            preset = build(:search_filter_preset, title: 'title')
            preset.valid?
            expect(preset.title).to eq('title')
          end
        end
      end
    end
  end

  describe '#clear_and_update' do
    it '値がクリアされて更新される' do
      preset = create(:search_filter_preset, title: 'old title')
      preset.clear_and_update(title: 'new title')
      expect(preset.title).to eq('new title')
    end
  end

  describe '#as_text' do
    it 'テキストに変換される' do
      preset = create(:search_filter_preset, title: 'title', keywords: %w[keyword1 keyword2], or_keywords: %w[or_keyword1 or_keyword2], not_keywords: %w[not_keyword1 not_keyword2], prefectures: [13, 14], organizations: %w[organization1 organization2], procedure_type_groups: %w[procedure_type_group1 procedure_type_group2], period: '1week', publication_date_from: '2024-01-01', publication_date_to: '2024-01-31', planned_price_from: 100000, planned_price_to: 2000000, is_experience_required: true, participate_qualification_ids: [1, 2], participate_qualification_grade_ids: [3, 4], participate_qualification_types: %w[都道府県], participate_qualification_prefectures: %w[01 13], tender_opening_date_from: '2024-02-01', tender_opening_date_to: '2024-02-28')
      expect(preset.as_text).to eq(<<~TEXT.strip)
        ★タイトル: title★
        キーワード: keyword1, keyword2
        ORキーワード: or_keyword1, or_keyword2
        除外キーワード: not_keyword1, not_keyword2
        類義語検索: あり
        都道府県: 東京都, 神奈川県
        発注機関: organization1, organization2
        入札方式: procedure_type_group1, procedure_type_group2
        期間: 1week
        公告日: 2024-01-01 〜 2024-01-31
        予定価格: 100000 〜 2000000
        実績有無条件: あり
        参加資格ID: 1, 2
        参加資格等級ID: 3, 4
        参加資格種別: 都道府県
        参加資格なし: なし
        参加資格都道府県: 北海道, 東京都
        落札日: 2024-02-01 〜 2024-02-28
      TEXT
    end

    context '類義語検索が無効の場合' do
      it '類義語検索が「なし」と表示される' do
        preset = create(:search_filter_preset, title: 'title', keywords: %w[keyword1], use_synonym_search: false)
        expect(preset.as_text).to include('類義語検索: なし')
      end
    end

    context '類義語検索が設定されていない場合' do
      it '類義語検索が表示されない' do
        preset = create(:search_filter_preset, title: 'title', keywords: %w[keyword1], use_synonym_search: nil)
        expect(preset.as_text).not_to include('類義語検索')
      end
    end

    context '締切日フィルターが設定されている場合' do
      it 'テキストに締切日が含まれる' do
        preset = create(:search_filter_preset, title: 'title', keywords: %w[keyword1], deadline_days_remaining: 7)
        expect(preset.as_text).to include('締切日: 7日以上先')
      end
    end
  end

  describe '#as_query' do
    context '締切日フィルターが設定されている場合' do
      it 'クエリパラメータに締切日が含まれる' do
        preset = create(:search_filter_preset, keywords: %w[keyword1], deadline_days_remaining: 14)
        expect(preset.as_query).to include('deadlineDaysRemaining=14')
      end
    end

    context '類義語検索が有効な場合' do
      it 'クエリパラメータに類義語検索が含まれる' do
        preset = create(:search_filter_preset, keywords: %w[keyword1], use_synonym_search: true)
        expect(preset.as_query).to include('useSynonymSearch=true')
      end
    end

    context '類義語検索が無効な場合' do
      it 'クエリパラメータに類義語検索が含まれる' do
        preset = create(:search_filter_preset, keywords: %w[keyword1], use_synonym_search: false)
        expect(preset.as_query).to include('useSynonymSearch=false')
      end
    end

    context '類義語検索が設定されていない場合' do
      it 'クエリパラメータに類義語検索が含まれない' do
        preset = create(:search_filter_preset, keywords: %w[keyword1], use_synonym_search: nil)
        expect(preset.as_query).not_to include('useSynonymSearch')
      end
    end
  end
end
