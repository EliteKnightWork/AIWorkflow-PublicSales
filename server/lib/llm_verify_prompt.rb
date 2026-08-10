require 'json'
require_relative 'llm_common'

module LlmVerifyPrompt extend LlmCommon
  PROMPT = <<~EOS.freeze
  ここに検証したいプロンプトを入れる
    -----
  EOS

  def self.verify(text)
    result = LlmCommon.execute_with_retry(text + PROMPT)
    # json形式ならパース
    parsed_results = parse_json(result)
    parsed_results
  end

  def self.parse_json(text)
    json_match = text.match(/\{.*?\}/m)
    return text unless json_match
    JSON.parse(json_match[0])
  rescue JSON::ParserError
    {}
  end
end
