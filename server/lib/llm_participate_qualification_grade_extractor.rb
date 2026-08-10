require_relative 'llm_common'
require 'langchain'

module LlmParticipateQualificationGradeExtractor extend LlmCommon
  class ExtractServiceError < StandardError; end

  PROMPT = <<~EOS.freeze
# 入力から参加資格、等級を抽出するルール

## 基本ルール

### 1. 入札参加資格の抽出
* 以下のキーワードが存在する場合、「登録あり」と判断
- 「入札参加資格名簿に登録されている者」
- 「競争入札参加資格者名簿に登録されている者」
- 「有資格業者名簿に登録されている者」
- 「入札参加資格を有する者」
* 自治体名/機関名が特定できる場合の出力形式
- 「○○県の入札参加資格名簿に登録されている者」→「○○県入札参加資格」
- 「○○市が発注する○○業務の入札参加資格を有する者」→「○○市入札参加資格」
- 「○○県△△市発注する○○業務の入札参加資格を有する者」→「△△市入札参加資格」
* 全省庁統一資格の記述
- 「全省庁統一資格」として出力（省庁名は削除）
- 「○○省競争参加資格」,「○○庁競争参加資格」,「○○省入札参加資格」といった省庁名の記載も「全省庁統一資格」として出力
  - 例:「国土交通省の全省庁統一資格」→「全省庁統一資格」
  - 例:「総務省競争参加資格」→「全省庁統一資格」
  - 例:「財務省東北地区競争参加資格」→「全省庁統一資格」
  - 例:「防衛庁競争参加資格」→「全省庁統一資格」
* 複数の自治体/機関が記載されている場合
- カンマ区切りで全て列挙（「○○県入札参加資格,△△市入札参加資格」）
* 入札参加資格に関する記述がない場合
- 明確な記載がない場合は **必ず「空欄」** を出力
* 他の条件がなく入札参加資格停止に関する記述のみの場合（必ず従うこと）
- 「○年以内に入札参加資格停止措置を受けていない者」のみの記載→「空欄」
- 「○○県から入札参加資格停止の措置を受けていない者」のみの記載→「空欄」
- 一般競争入札に参加できない者でないこと。→「空欄」
- 指名等に関する規程に基づく指名停止の措置を受けている期間がないこと。→「空欄」
- ○○市競争入札参加有資格者指名停止等措置要領の規定に基づく指名停止の措置を受けていない者。→「空欄」
- 入札に参加できない措置を受けていない者であること。→「空欄」
* 例外パターン
- 「入札参加資格は必要としない」と明記されている場合→「空欄」
- 「一般競争入札」とだけ記載され資格について触れられていない場合→「空欄」

### 2. 等級の抽出
* 等級の記載があれば、A、B、C、Dの形式で正しく抽出
- 「A等級」「Aランク」「等級A」などの表記はすべて「A」として統一
- 複数等級の場合は「A,B」のようにカンマ区切りで出力
* 等級の記載がない場合は、「空欄」として出力

## 判定フロー

### 入札参加資格名簿への登録有無の判定フロー:
1. まず「入札参加資格名簿」「競争入札参加資格」「有資格業者名簿」などのキーワードを検索
2. キーワードが見つかった場合、その前後の文脈を確認
  a. 「登録されている者」「有する者」などの表現があれば「有」と判断
  b. 自治体名/機関名が特定できる場合はその名前を付加
3. 全省庁統一資格の記載があれば「全省庁統一資格」として出力
4. キーワードが見つからない場合:
  a. 「入札参加停止措置を受けていないこと」のみの記載→「無」
  b. 「入札参加資格は必要としない」→「無」
  c. それ以外→「空欄」

## 入札参加資格の記載例と対応する出力:

例1:「○○県の入札参加資格名簿（○○業務）に登録されていること」
出力: 「○○県入札参加資格」

例2:
- 「令和○年度における○○市物品購入等競争入札参加資格者名簿に登録されていること」
- 「○○市物品・委託役務関係競争入札参加資格者名簿に登載されていること。」
- 「○○市物品・製造等競争入札参加資格を有する者で、」
- 「○○市の物品等競争入札参加資格を有する事業者であること。」
出力: 「○○市入札参加資格」

例3:「全省庁統一資格（○○省）の「○○」の資格を有すること」
出力: 「全省庁統一資格」

例4:「過去○年以内に入札参加資格停止措置を受けていないこと」（これのみの記載）
出力: 「無」

例5:「○○協会の会員であること」（入札資格への言及なし）
出力: 「空欄」

例6:「○○県および△△市の入札参加資格名簿に登録されている者」
出力: 「○○県入札参加資格,△△市入札参加資格」

## 出力形式
{format_instructions}

# 入力
{query}
  EOS

  OUTPUT_SCHEMA = {
    type: "object",
    properties: {
      participate_qualifications: {
        type: "string",
        description: "入札参加資格の抽出結果. 例: '○○県入札参加資格,△△市入札参加資格'",
      },
      grades: {
        type: "string",
        description: "等級の抽出結果, 例: 'A,B,C,D'",
      }
    }
  }.freeze

  def self.extract(summary)
    parser = Langchain::OutputParsers::StructuredOutputParser.from_json_schema(OUTPUT_SCHEMA)

    prompt = Langchain::Prompt::PromptTemplate.new(
      template: PROMPT,
      input_variables: ["query", "format_instructions"],
    )

    formatted_prompt = prompt.format(
      query: summary,
      format_instructions: parser.get_format_instructions
    )

    output = nil

    begin
      response = LlmCommon.execute_with_retry(formatted_prompt)
      output = parser.parse(response)
    rescue Langchain::OutputParsers::OutputParserException => e
      Rails.logger.error("パースエラー: #{e.message}, テキスト: #{summary&.truncate(100)}")
    end

    participate_qualifications_str = output&.dig("participate_qualifications").to_s
    grades_str = output&.dig("grades").to_s

    return {
      participate_qualifications: participate_qualifications_str == "空欄" ? [] : participate_qualifications_str.split(",").map(&:strip),
      grades: grades_str == "空欄" ? [] : grades_str.split(",").map(&:strip)
    }
  end
end
