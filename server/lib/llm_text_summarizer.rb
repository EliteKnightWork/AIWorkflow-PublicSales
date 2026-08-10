require_relative 'llm_common'
require 'langchain'

module LlmTextSummarizer extend LlmCommon
  class SummarizeServiceError < StandardError; end

  PROMPT = <<~EOS.freeze
    You are an excellent text extraction officer. 
    
    This is a document related to municipal project solicitations. Please read through the documents and extract information regarding the project overview, scope of work, application requirements (eligibility criteria) and project budget (estimated price or business budget amount). All of the documents provided are written in Japanese. 
    When reviewing the documents, prioritize files with names containing terms such as "仕様書", "募集要項" and "応募要領". This task is highly critical, so please proceed with extreme caution. 
    
    Provide the information in the following format:
    project_overview: "......" (return as a string)

    scope_of_work: "......" (return as an array)

    application_requirements: "......" (return as an array)

    Conditions for output are as follows:
    - Just return the key value pairs so that it can easily be parsed into JSON.

    - Regarding the project_overview:
      - Summarize the background, objectives and key details of the project

    - Regarding the scope_of_work:
      - Avoid vagueness and list every specific detail (e.g. exact quantities and procurement requirements)
      - If there are any numerical details regarding procurement, quantity to be produced, etc. please mention it without missing anything

    - Regarding the application_requirements (eligibility criteria):
      - Extract all application requirements (eligibility criteria) word for word, completely verbatim from the original text. Do not summarize, but use the exact expressions as they appear in the document.
      - When extracting application requirements, it is most crucial to extract them completely as written in the document without any omissions, paraphrasing, or modifications

    - Provide the information in Japanese language (日本語)
  EOS

  # 応募要件からrefines（絞り込み条件）を抽出するプロンプト
  REFINES_EXTRACTION_PROMPT = <<~EOS.freeze
    # 応募要件から絞り込み条件情報を抽出するルール

    ## 基本ルール

    ### grades: 等級の抽出
    * 等級の記載があれば、A、B、C、Dの形式で正しく抽出
    - 「Sランク」「S等級」「S」「A+」「特A」「A等級」「Aランク」「等級A」などの表記はすべて「A」として統一
    - 複数等級の場合は["A","B"]のようにカンマ区切りの配列で出力
    * 等級の記載がない場合は、空の配列（[]）として出力

    ### is_experience_required: 実績有無の抽出
    * 実績に関する記載があれば、「1」を出力
    - **実績の記載は「過去○年」「受託実績」「同種業務」「類似業務」などの明確な表現がある場合のみ「1」**
    - 具体的な実績件数が指定されている場合、「1」と出力
    * 記載がない場合、「0」を出力
    - **「要件に対応できる者」「業務を遂行する能力がある者」などの曖昧な表現は「0」**
    - 「実務経験」や「〇〇の知識を有する者」は、明確に業務実績を求めていない限り「0」

    ### is_office_required: 事業所の必要有無
    * 事業所の記載があれば「1」
    - 「○○県内に本店/支店/営業所を有すること」
    - 「○○地域内に拠点を置くこと」
    * 記載がない場合「0」を出力
    * 「連絡窓口」程度の表現の場合は「0」

    ### project_security_qualifications: 情報セキュリティ資格の抽出
    * セキュリティ資格に関する記載があれば、必要な資格をカンマ区切りの配列で出力
    - 「ISMS」: JIS Q 27001、ISO/IEC 27001、ISMS認証 等の記載がある場合
    - 「Pマーク」: プライバシーマーク、Pマーク 等の記載がある場合
    - 「ISO」: ISO 9001等の品質マネジメントシステムの記載がある場合（ISMSを除く）
    * 複数の資格がOR条件で記載されている場合（「いずれか」という表現がある場合）
    - カンマ区切りの配列で対象となる資格を全て列挙（例: ["ISMS","Pマーク"]）
    * 不要の場合
    - 明確に不要と記載がある場合、または記載がない場合→空の配列（[]）

    ## 判定フロー

    ### 情報セキュリティ資格の判定フロー:
    1. 「情報セキュリティ」「セキュリティマネジメント」「ISMS」「プライバシーマーク」「Pマーク」「ISO」などのキーワードを検索
    2. 記載が見つかった場合:
    a. OR条件（「いずれか」「または」等）で複数の資格が記載されている場合
      → 対象となる資格をカンマ区切りの配列で全て列挙（例: ["ISMS","Pマーク"]）
    b. 特定の資格のみ必須と記載されている場合
      → 該当する資格名のみを出力（例: ["ISMS"]）
    3. 記載が見つからない場合→空の配列（[]）

    ## 情報セキュリティ資格の記載例と対応する出力:

    例1:「プライバシーマーク付与認定を受けていること」
    出力: ["Pマーク"]

    例2:「JIS Q 27001（ISO/IEC 27001）を基準とした情報セキュリティマネジメントシステム（ISMS）の適合性に関する認証を取得していること」
    出力: ["ISMS"]

    例3:「情報セキュリティに係る以下のいずれかの認定・認証を取得していること。 ア プライバシーマーク付与認定 イ 最新の JIS Q 27001（ISO/IEC 27001）を基準とした情報セキュリティマネジメントシステム（ISMS）の適合性に関する認証」
    出力: ["ISMS","Pマーク"]

    例4:「ISO 9001の認証を取得していること」
    出力: ["ISO"]

    例5:「情報セキュリティに係る以下のいずれかの認定・認証を取得していること。 ア プライバシーマーク付与認定 イ 最新の JIS Q 27001（ISO/IEC 27001）を基準とした情報セキュリティマネジメントシステム（ISMS）の適合性に関する認証 ウ ISO 9001の認証」
    出力: ["ISMS","Pマーク","ISO"]

    例6:（セキュリティ資格に関する記載なし）
    出力: []

    ## 事前・事後チェック項目

    * 抽出前のチェック項目
    - 文書全体に「一般競争入札」「指名競争入札」等の記載があるか確認
    - 「参加資格」「応募資格」「入札要件」等のセクションを特定

    ## 出力形式
    以下の形式のJSON文字列（key-valueペア）で出力してください。

    {
      grades: ["A","B","C","D"]
      is_experience_required: 1/0
      is_office_required: 1/0
      project_security_qualifications: ["ISMS","Pマーク","ISO"]
    }
  EOS

  TEXT_SUMMARIZER_SCHEMA = {
    type: "object",
    properties: {
      project_overview: {
        type: "string"
      },
      scope_of_work: {
        type: "array"
      },
      application_requirements: {
        type: "array"
      }
    }
  }

  REFINES_SCHEMA = {
    type: "object",
    properties: {
      grades: {
        type: "array",
        items: { type: "string" }
      },
      is_experience_required: { type: ["string", "integer"] },
      is_office_required: { type: ["string", "integer"] },
      project_security_qualifications: {
        type: "array",
        items: { type: "string" }
      },
    }
  }

  def self.summarize(text, prompt = "")

    parser = Langchain::OutputParsers::StructuredOutputParser.from_json_schema(TEXT_SUMMARIZER_SCHEMA)
    # テキストを分割
    chunks = LlmCommon.split_text(text)

    summaries = []

    chunks.each do |chunk|
      content = prompt == "" ? chunk.text + PROMPT : chunk.text + prompt
      summary = LlmCommon.execute_with_retry(content)
      next if summary.blank?

      begin
        summaries << parser.parse(summary)
      rescue Langchain::OutputParsers::OutputParserException => e
        Rails.logger.error("パースエラー: #{e.message}, テキスト: #{summary&.truncate(100)}")
        next
      end
    end

    # 全てのチャンクの要約を結合
    combined_summary = summaries.join("\n\n")

    # # 結合した要約を再度要約して最終結果を得る
    final_summary = summarize_final(combined_summary)
    final_summary
  end

  def self.summarize_final(combined_summary)
    final_prompt = <<~EOS.freeze
      Based upon on these summaries presented in JSON format, generate a final summary. Merge the redundant information and please be careful to not miss important information. Please return the result as an JSON string (key-value pairs) in the following format:
        project_overview: "......" (return as a string)

        scope_of_work: "......" (return as an array)

        application_requirements: "......" (return as an array)

        The summary is as follows:
        #{combined_summary}
    EOS

    final_summary = LlmCommon.execute_with_retry(final_prompt)
    parser = Langchain::OutputParsers::StructuredOutputParser.from_json_schema(TEXT_SUMMARIZER_SCHEMA)
    final_summary = parser.parse(final_summary)

    final_summary.keys().each do |key|
      if final_summary[key].is_a?(Array)
        if final_summary[key].empty?
          final_summary[key] << "なし"
        end
      end
    end

    # 応募要件からrefines抽出
    refines = extract_refines_from_requirements(final_summary["application_requirements"])

    Rails.logger.info("refines: #{refines}")

    summary_text = <<~TEXT
    【案件概要】
    #{final_summary["project_overview"]}

    【業務内容】
    #{final_summary["scope_of_work"].map { |scope| "- #{scope}" }.join("\n")}

    【応募要件】
    #{final_summary["application_requirements"].map { |requirement| "- #{requirement}" }.join("\n")}

    TEXT

    { summary: summary_text, refines: refines }
  rescue StandardError => e
    LlmCommon.handle_error(e)
    raise SummarizeServiceError
  end

  def self.extract_refines_from_requirements(requirements)
    parser = Langchain::OutputParsers::StructuredOutputParser.from_json_schema(REFINES_SCHEMA)

    requirements_text = requirements.is_a?(Array) ? requirements.join("\n") : requirements.to_s
    prompt = requirements_text + REFINES_EXTRACTION_PROMPT
    result = LlmCommon.execute_with_retry(prompt)

    begin
      parser.parse(result)
    rescue Langchain::OutputParsers::OutputParserException => e
      Rails.logger.error("パースエラー: #{e.message}, テキスト: #{result&.truncate(100)}")
      Sentry.capture_exception(e)
      {}
    end
  end
end
