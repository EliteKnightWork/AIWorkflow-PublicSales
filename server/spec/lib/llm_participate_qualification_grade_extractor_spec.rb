require 'rails_helper'

RSpec.describe LlmParticipateQualificationGradeExtractor do
  describe '.extract' do
    before do
      allow(LlmCommon).to receive(:execute_with_retry).and_return(llm_response)
    end

    context '参加資格があり、等級が空欄の場合' do
      let(:text) { '東京都の入札参加資格名簿に登録されていること。等級の指定はありません。' }
      let(:organization) { '東京都' }
      let(:llm_response) do
        '{"participate_qualifications": "東京都入札参加資格", "grades": "空欄"}'
      end

      it '参加資格は抽出され、等級は空配列になること' do
        result = described_class.extract(text)
        expect(result[:participate_qualifications]).to eq(['東京都入札参加資格'])
        expect(result[:grades]).to eq([])
      end
    end

    context '参加資格が空欄で、等級も空欄の場合' do
      let(:text) { '入札参加資格停止措置を受けていないこと。' }
      let(:organization) { '東京都' }
      let(:llm_response) do
        '{"participate_qualifications": "空欄", "grades": "空欄"}'
      end

      it '参加資格と等級が空配列になること' do
        result = described_class.extract(text)
        expect(result[:participate_qualifications]).to eq([])
        expect(result[:grades]).to eq([])
      end
    end

    context '参加資格があり、等級が指定されている場合' do
      let(:text) { '大阪府の入札参加資格名簿に登録されており、A又はB等級であること。' }
      let(:organization) { '東京都' }
      let(:llm_response) do
        '{"participate_qualifications": "大阪府入札参加資格", "grades": "A,B"}'
      end

      it '参加資格と等級が正しく抽出されること' do
        result = described_class.extract(text)
        expect(result[:participate_qualifications]).to eq(['大阪府入札参加資格'])
        expect(result[:grades]).to eq(['A', 'B'])
      end
    end

    context '複数の参加資格があり、等級が空欄の場合' do
      let(:text) { '東京都および神奈川県の入札参加資格名簿に登録されていること。' }
      let(:organization) { '東京都' }
      let(:llm_response) do
        '{"participate_qualifications": "東京都入札参加資格,神奈川県入札参加資格", "grades": "空欄"}'
      end

      it '複数の参加資格が抽出され、等級は空配列になること' do
        result = described_class.extract(text)
        expect(result[:participate_qualifications]).to eq(['東京都入札参加資格', '神奈川県入札参加資格'])
        expect(result[:grades]).to eq([])
      end
    end

    context '全省庁統一資格の場合' do
      let(:text) { '令和6年度全省庁統一資格「物品の製造」のA等級に格付けされている者。' }
      let(:organization) { '東京都' }
      let(:llm_response) do
        '{"participate_qualifications": "全省庁統一資格", "grades": "A"}'
      end

      it '全省庁統一資格として統一され、等級が抽出されること' do
        result = described_class.extract(text)
        expect(result[:participate_qualifications]).to eq(['全省庁統一資格'])
        expect(result[:grades]).to eq(['A'])
      end
    end

    context 'LLMのレスポンスがパースできない場合' do
      let(:text) { '何らかのテキスト' }
      let(:organization) { '東京都' }
      let(:llm_response) { 'invalid json' }

      it '空の配列を返すこと' do
        result = described_class.extract(text)
        expect(result[:participate_qualifications]).to eq([])
        expect(result[:grades]).to eq([])
      end
    end
  end
end