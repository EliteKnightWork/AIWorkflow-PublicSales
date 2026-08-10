require 'rails_helper'

RSpec.describe User, type: :model do
  describe '.search' do
    context '名前による検索' do
      let!(:user_taro) { create(:user, name: '山田太郎') }
      let!(:user_hanako) { create(:user, name: '山田花子') }
      let!(:user_jiro) { create(:user, name: '佐藤次郎') }

      it '完全一致検索' do
        expect(User.search(name: '山田太郎').map(&:id)).to include(user_taro.id)
        expect(User.search(name: '山田太郎').map(&:id)).not_to include(user_hanako.id, user_jiro.id)
      end

      it '部分一致検索' do
        aggregate_failures do
          expect(User.search(name: '山田').map(&:id)).to include(user_taro.id, user_hanako.id)
          expect(User.search(name: '山田').map(&:id)).not_to include(user_jiro.id)
          expect(User.search(name: '太郎').map(&:id)).to include(user_taro.id)
          expect(User.search(name: '太郎').map(&:id)).not_to include(user_hanako.id, user_jiro.id)
        end
      end
    end

    context 'メールアドレスによる検索' do
      let!(:user_yamada) { create(:user, email: 'yamada@example.com') }
      let!(:user_hanako) { create(:user, email: 'hanako@example.com') }
      let!(:user_sato) { create(:user, email: 'sato@gmail.com') }

      it '完全一致検索' do
        expect(User.search(email: 'yamada@example.com').map(&:id)).to include(user_yamada.id)
        expect(User.search(email: 'yamada@example.com').map(&:id)).not_to include(user_hanako.id, user_sato.id)
      end

      it '部分一致検索' do
        aggregate_failures do
          expect(User.search(email: 'example.com').map(&:id)).to include(user_yamada.id, user_hanako.id)
          expect(User.search(email: 'example.com').map(&:id)).not_to include(user_sato.id)
          expect(User.search(email: 'gmail').map(&:id)).to include(user_sato.id)
          expect(User.search(email: 'gmail').map(&:id)).not_to include(user_yamada.id, user_hanako.id)
          expect(User.search(email: 'yamada').map(&:id)).to include(user_yamada.id)
          expect(User.search(email: 'yamada').map(&:id)).not_to include(user_hanako.id, user_sato.id)
        end
      end
    end

    context '名前とメールアドレスの複合検索' do
      let!(:user_yamada_taro) { create(:user, name: '山田太郎', email: 'yamada@example.com') }
      let!(:user_yamada_hanako) { create(:user, name: '山田花子', email: 'hanako@example.com') }
      let!(:user_sato_jiro) { create(:user, name: '佐藤次郎', email: 'sato@gmail.com') }

      it '名前とメールアドレスの両方で検索' do
        params = { name: '山田', email: 'example.com' }
        results = User.search(params).map(&:id)
        
        expect(results).to include(user_yamada_taro.id, user_yamada_hanako.id)
        expect(results).not_to include(user_sato_jiro.id)
      end

      it '条件に一致するユーザーがいない場合は空の結果を返す' do
        params = { name: '山田', email: 'gmail.com' }
        results = User.search(params).map(&:id)
        
        expect(results).to be_empty
      end
    end

    context 'ページネーション' do
      before do
        # 30人のユーザーを作成
        30.times do |i|
          create(:user, name: "テストユーザー#{i}", email: "user#{i}@example.com")
        end
      end

      it 'デフォルトで25件ずつ表示される' do
        expect(User.search({}).count).to eq(25)
      end

      it 'ページパラメータで2ページ目が取得できる' do
        all_users = User.order(created_at: :desc)
        page2_users = User.search(page: 2)
        
        expect(page2_users.count).to be > 0
        expect(page2_users.count).to be <= 25
        expect(page2_users.map(&:id)).not_to include(all_users.limit(25).map(&:id))
      end

      it 'per_pageパラメータで1ページあたりの表示件数を変更できる' do
        expect(User.search(per_page: 10).count).to eq(10)
      end
    end
  end
end