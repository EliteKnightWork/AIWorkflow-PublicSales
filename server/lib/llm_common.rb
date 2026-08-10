require 'langchain'

module LlmCommon
  MAX_RETRY_COUNT = 5
  MODEL = "gpt-4o-mini"
  MAX_TOKENS = 128000

  def self.execute_with_retry(content)

    url = ENV["AZURE_OPENAI_URL"] || "https://labid.openai.azure.com"
    url = url + "/openai/deployments/" + MODEL

    client = Langchain::LLM::OpenAI.new(
      api_key: ENV["AZURE_OPENAI_API_KEY"],
      llm_options: {
        api_type: "azure",
        api_version: ENV["AZURE_OPENAI_API_VERSION"],
        uri_base: url
      },
    )

    retry_count = 0

    begin
      response = client.chat(
        messages: [
          { role: "user", content: content }
        ]
      )
      summary = response.raw_response["choices"][0]["message"]["content"]
      return summary
    rescue Faraday::ClientError => e
      if e.response[:status] == 429
        retry_count += 1
        if retry_count <= MAX_RETRY_COUNT
          wait_seconds = to_seconds(e.response[:headers]['retry-after'])
          Rails.logger.info("OpenAI API rate limit exceeded. Wait for #{wait_seconds} seconds.")
          sleep(wait_seconds)
          retry
        end
      end
      handle_error(e)
    rescue StandardError => e
      handle_error(e)
    end
  end

  def self.split_text(text, chunk_size = MAX_TOKENS)
    Langchain::Chunker::Text.new(text, chunk_size: chunk_size, chunk_overlap: 200, separator: " ").chunks
  end

  def self.to_seconds(time_str)
    time_str.to_i
  end

  def self.handle_error(error)
    Rails.logger.error(error.message)
    Sentry.capture_exception(error)
    raise error
  end
end