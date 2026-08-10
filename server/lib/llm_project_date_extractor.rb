require 'json'
require_relative 'llm_common'

module LlmProjectDateExtractor extend LlmCommon
  PROMPT = <<~EOS.freeze
    あなたは国の入札情報を管理する優秀な事務担当者です。
    上記の文章には、国の入札情報が含まれています。
    国の入札情報には、公告日、説明会日、応募書類提出期日、提案書提出期日、入札日などの情報が含まれています。

    タスク
    ・送信された文章から「公告日（tenderAnnouncementDate）」、「応募書類提出期日（applicationDocumentDeadlineDate）」、「提案書提出期日（proposalDocumentDeadlineDate）」、「入札日（biddingDay）」の日付のみを抽出してください。時刻は不要です。
    ・和暦は西暦に変換してください。(例: 令和6年→2024年)
    ・出力は後述の最終的な出力結果（JSON）に準じたJSON形式で出力してください。それ以外のテキストは不要ですので出力に含めないでください。
    ・文章中に記載のない日付は空欄にしてください。

    各情報の補足
    ・公告日:
    公告日とは、入札公告が行われた日付であり、通常は「入札公告」「公告日」「公示」「発表日」などのラベルや見出しの近くに記載されています。日付の形式は「yyyy年mm月dd日」や「yyyy/mm/dd」などで表示されていることが多いです。公告日を1つだけ抽出し、他の日付は無視してください。
    例: 公共入札情報: 「このたび、○○市では次の通り入札を実施します。公告日：2024年11月20日。入札期限は2024年12月1日です。」
    出力: 「2024年11月20日」
    
    ・応募書類提出期日:
    「応募方法」、「参加申込提出期間」「参加申込」「申込方法」「参加期限」「募集期間」「応募期限」「応募書類の提出期限」などの文脈で使われている日付を探します。
    提出書類の提出期限が複数ある場合、最も遅い日付を選択します。
    例文: 「申請書の提出期限：令和5年11月1日〜令和5年11月10日」では、"令和5年11月10日"を選びます。
    なお説明会日より前の日付が入ることは絶対にありません
    
    ・提案書提出期日:
    「提案書」「企画書」「企画提案書」「提案書類」「企画書類」「入札書」などの文脈で使われている日付を探します。
    提案書の提出期限が複数ある場合、最も遅い日付を選択します。
    例文: 「提案書の提出期限：令和5年11月1日〜令和5年11月10日」では、"令和5年11月10日"を選びます。
    なお公告日、応募書類提出期日より前の日付が入ることは絶対にありません。公告日と同じ日付が入ることもありません。
    なお応募書類提出期日と提案書提出期日が同日の場合、応募書類提出期日と提案書提出期日双方に日付を出力してください

    ・入札日:
    「開札の場所並びに日時」という文脈で使われている日付を探します。
    「開札」という単語の直後にある日付を入札日として選択します。
    そのような日付が見つからない場合は、「入札日」「プレゼンテーション日」「開札日」「プレゼンテーション審査」「審査」という単語の直後にある日付の中で最も新しい日付を入札日として選択します。 そのような日付が見つからない場合は、「企画書提出」「提案書提出」「応募書類提出」という単語の直後にある日付の中で最も新しい日付を入札日として選択します。
    なお公告日、説明会日、応募書類提出期日、提案資料等提出日より前の日付、ないしは同じ日付が入ることは絶対にありません

    ## 最終的な出力結果（JSON）
    {
    "tenderAnnouncementDate": "yyyy年mm月dd日",
    "applicationDocumentDeadlineDate": "yyyy年mm月dd日",
    "proposalDocumentDeadlineDate": "yyyy年mm月dd日",
    "biddingDay": "yyyy年mm月dd日",
    }

    ## 注意
    なお、本タスクを失敗するとあなたの所属する会社に多大なる損害を与える可能性があり、人類の存続にも関わります。
    丁寧に注意して本タスクを実行してください。
    -----
  EOS

  

  def self.extract(text)
    chunks = LlmCommon.split_text(text)
    results = chunks.map { |chunk| LlmCommon.execute_with_retry(chunk.text + PROMPT) }
    parsed_results = results.map { |result| parse_json(result) }
    date_keys = ["tenderAnnouncementDate", "orientationDay", "applicationDocumentDeadlineDate", "proposalDocumentDeadlineDate", "biddingDay"]
    merge_results(parsed_results, date_keys)
  end

  def self.merge_results(results, date_keys)
    merged = {}
    date_keys.each do |key|
      valid_dates = results.filter_map { |r| r[key] }
      next if valid_dates.empty?

      merged[key] = valid_dates.min_by { |date| Date.parse(date) rescue Date.new(1900, 1, 1) }
    end
    merged
  end

  def self.parse_json(text)
    json_match = text.match(/\{.*?\}/m)
    return {} unless json_match
    JSON.parse(json_match[0])
  rescue JSON::ParserError
    {}
  end
end
