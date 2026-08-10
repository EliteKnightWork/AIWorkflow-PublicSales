require "langchain"

class OpenaiChatService
  def initialize(model_name = "gpt-4o-mini")
    @model_name = model_name
    url = ENV["AZURE_OPENAI_URL"] || "https://labid.openai.azure.com"
    url = url + "/openai/deployments/" + model_name

    @client = Langchain::LLM::OpenAI.new(
      api_key: ENV["AZURE_OPENAI_API_KEY"],
      llm_options: {
        api_type: "azure",
        api_version: ENV["AZURE_OPENAI_CHAT_API_VERSION"],
        uri_base: url
      },
    )
  end

  def extract_keywords(title, description, max_keywords = 10)
    text = "タイトル: #{title}\n説明: #{description}"
    prompt = <<~PROMPT
    以下は案件のタイトルと説明です。
    それぞれの案件についてその案件を具体的にあらわすキーワードを抽出してください。
    ただし以下の条件を満たすようにしてください
  
    ### 抽出条件:
    1. 以下のような一般的な語句は除外してください：
      - 「入札年度」「公告」「電子入札」「一般競争入札」「調達案件番号」「参加資格申請」「開札予定日」など、広く適用される語句
      - 数字や単なる日付（例：令和6年度、2024年）
    2. 固有名詞（施設名、組織名、地名など）や物品・サービスの名称を優先して抽出してください。
    3. 最大#{max_keywords}個まで、カンマ区切りで出力してください。
    4. 各キーワードはユニークである必要があります（重複不可）。
  
    ### 案件内容:
    #{text}

    ### 例1:
    #### input
      タイトル: 令和６年度金融庁及び内閣法制局ＧＳＳ移行に係る複合機の賃貸借及び保守等業務
      説明: 意見招請に関する公示 次のとおり調達物品の仕様書案の作成が完了したので、仕様書案に対する意見を招請します。 デジタル庁会計担当参事官 杉本 敬次 調達内容 複合機の賃貸借及び保守等業務 1式 意見提出期限 令和６年６月６日12時00分 提出先 東京都千代田区紀尾井町1番3号 東京ガーデンテラス紀尾井町19階 デジタル庁
    #### output
      金融庁,内閣法制局,複合機,賃貸借,保守,GSS移行,デジタル庁,調達,意見招請

    ### 例2:
    #### input
      タイトル: 令和７年度県立学校教職員成人病等健康診断及び予防接種業務委託【胃内視鏡検査】
      説明: １．\t電子入札区分\t電子入札\n２．\t年度\t令和７年度\n３．\t入札執行部局名／入札執行所属名\t教育委員会教育局　行政部財務課\n４．\t調達案件番号\t0001450060020240082\n５．\t入札方式\t一般競争入札（標準型）\n６．\t営業種目\t検査業 務委託\n７．\t積算金額（税込み）\t\n８．\t予定価格（税抜き）\t\n９．\t開札予定日\t令和７年２月７日\n１０．\t参加資格申請等期限\t令和７年１月２７日まで\n１１．\t業務名\t令和７年度県立学校教職員成人病等健康診断及び予防接種業務委託【胃内視鏡検査】\n１２．\t履行場所\t－\n１３．\t履行期限\t－\n１４．\t業務概要\t－
    #### output
      県立学校,教職員,成人病,健康診断,予防接種,胃内視鏡検査,検査業務
    PROMPT

    begin
      response = @client.chat(
        messages: [
          { role: "system", content: "あなたはキーワード抽出を行う優れたAIです。" },
          { role: "user", content: prompt }
        ]
      )
      keywords = response.raw_response["choices"][0]["message"]["content"]
      return keywords.tr(" ", "").tr(",", " ")
    rescue => e
      Rails.logger.error(e)
      return nil
    end
  end
end
