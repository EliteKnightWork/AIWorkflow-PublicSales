require 'rails_helper'

RSpec.describe ProjectAndAwardedProjectCommon, type: :concern do
  let(:test_class) do
    Class.new do
      extend ProjectAndAwardedProjectCommon::ClassMethods
    end
  end

  describe '.determine_procedure_type_group' do
    subject { test_class.determine_procedure_type_group(procedure_type) }

    context 'nilの場合' do
      let(:procedure_type) { nil }

      it { is_expected.to eq 'その他' }
    end

    context '指名競争入札系' do
      context '指名競争を含む場合' do
        let(:procedure_type) { '指名競争入札' }

        it { is_expected.to eq '指名競争入札' }
      end

      context '工事希望型指名競争入札を含む場合' do
        let(:procedure_type) { '工事希望型指名競争入札方式' }

        it { is_expected.to eq '指名競争入札' }
      end

      context '公募指名を含む場合' do
        let(:procedure_type) { '公募指名競争入札' }

        it { is_expected.to eq '指名競争入札' }
      end

      context '希望指名を含む場合' do
        let(:procedure_type) { '希望指名型入札' }

        it { is_expected.to eq '指名競争入札' }
      end
    end

    context '企画競争入札系' do
      context '公募プロポーザルを含む場合' do
        let(:procedure_type) { '公募プロポーザル方式' }

        it { is_expected.to eq '企画競争入札' }
      end

      context '企画競争を含む場合' do
        let(:procedure_type) { '企画競争入札' }

        it { is_expected.to eq '企画競争入札' }
      end

      context 'プロポーザルを含む場合' do
        let(:procedure_type) { 'プロポーザル方式' }

        it { is_expected.to eq '企画競争入札' }
      end

      context 'コンペを含む場合' do
        let(:procedure_type) { '設計コンペ方式' }

        it { is_expected.to eq '企画競争入札' }
      end

      context '技術提案を含む場合' do
        let(:procedure_type) { '技術提案型総合評価方式' }

        it { is_expected.to eq '企画競争入札' }
      end
    end

    context '随意契約系' do
      context '随意契約を含む場合' do
        let(:procedure_type) { '随意契約' }

        it { is_expected.to eq '随意契約' }
      end

      context '特命契約を含む場合' do
        let(:procedure_type) { '特命契約方式' }

        it { is_expected.to eq '随意契約' }
      end

      context '少額契約を含む場合' do
        let(:procedure_type) { '少額契約' }

        it { is_expected.to eq '随意契約' }
      end

      context '不落契約を含む場合' do
        let(:procedure_type) { '不落契約' }

        it { is_expected.to eq '随意契約' }
      end
    end

    context '見積もり合わせ系' do
      context '見積合わせを含む場合' do
        let(:procedure_type) { '見積合わせ' }

        it { is_expected.to eq '見積もり合わせ' }
      end

      context '見積もり合わせを含む場合' do
        let(:procedure_type) { '見積もり合わせ方式' }

        it { is_expected.to eq '見積もり合わせ' }
      end

      context 'オープンカウンタを含む場合' do
        let(:procedure_type) { 'オープンカウンタ方式' }

        it { is_expected.to eq '見積もり合わせ' }
      end

      context 'オープンカウンターを含む場合' do
        let(:procedure_type) { 'オープンカウンター' }

        it { is_expected.to eq '見積もり合わせ' }
      end
    end

    context '資料招請系' do
      context '資料提供招請を含む場合' do
        let(:procedure_type) { '資料提供招請' }

        it { is_expected.to eq '資料招請' }
      end

      context '情報提供招請を含む場合' do
        let(:procedure_type) { '情報提供招請' }

        it { is_expected.to eq '資料招請' }
      end

      context 'RFIを含む場合' do
        let(:procedure_type) { 'RFI（情報提供依頼）' }

        it { is_expected.to eq '資料招請' }
      end
    end

    context '意見招請系' do
      context 'RFCを含む場合' do
        let(:procedure_type) { 'RFC' }

        it { is_expected.to eq '意見招請' }
      end

      context '意見招請を含む場合' do
        let(:procedure_type) { '意見招請' }

        it { is_expected.to eq '意見招請' }
      end
    end

    context '一般競争入札系' do
      context '一般競争を含む場合' do
        let(:procedure_type) { '一般競争入札' }

        it { is_expected.to eq '一般競争入札' }
      end

      context '一般競争を含むが他のキーワードが優先される場合' do
        let(:procedure_type) { '一般競争入札（プロポーザル）' }

        it { is_expected.to eq '企画競争入札' }
      end
    end

    context 'その他' do
      context 'どのキーワードにも該当しない場合' do
        let(:procedure_type) { '特殊な入札方式' }

        it { is_expected.to eq 'その他' }
      end

      context '空文字の場合' do
        let(:procedure_type) { '' }

        it { is_expected.to eq 'その他' }
      end
    end

    context '複合的なケース' do
      context '複数のキーワードを含む場合（最初にマッチしたものが優先）' do
        let(:procedure_type) { '指名競争入札（プロポーザル方式）' }

        it { is_expected.to eq '指名競争入札' }
      end

      context '部分一致での判定' do
        let(:procedure_type) { '公募型指名競争入札' }

        it { is_expected.to eq '指名競争入札' }
      end
    end
  end
end