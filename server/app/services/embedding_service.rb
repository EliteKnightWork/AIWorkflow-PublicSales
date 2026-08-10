require "langchain"

class EmbeddingService
  def initialize(model_name = "text-embedding-3-small")
    @model_name = model_name
    url = ENV["AZURE_OPENAI_URL"] || "https://labid.openai.azure.com"
    url = url + "/openai/deployments/" + model_name

    @client = Langchain::LLM::OpenAI.new(
      api_key: ENV["AZURE_OPENAI_API_KEY"],
      llm_options: {
        api_type: "azure",
        api_version: ENV["AZURE_OPENAI_API_VERSION"],
        uri_base: url
      },
    )
  end

  def embeddings(text = "", dim = 768)
    return [{ raw_text: text, embedding: Array.new(dim, 0.01) }] if Rails.env.local?

    results = text_split(text).filter_map do |chunk|
      embedding = nil

      begin
        embedding = @client.embed(text: chunk.text, model: @model_name, dimensions: dim).embedding
      rescue => e
        Rails.logger.error(e)
      end

      {
        raw_text: chunk.text,
        embedding: embedding
      } if embedding
    end

    return results
  end

  def text_split(text = "")
    text = text.tr("\n", " ").gsub(/[ 　]+/, " ")

    # tokenサイズではなく文字数なので、max_tocen_sizeを超えないように余裕を持って4000文字に設定
    return Langchain::Chunker::Text.new(text, chunk_size: 4000, chunk_overlap: 100, separator: " ").chunks
  end
end
