module SearchableCommon
  extend ActiveSupport::Concern

  included do
    include Elasticsearch::Model

    index_name elastic_cloud_index

    after_commit on: [:create, :update] do
      begin
        self.reload if persisted?
        __elasticsearch__.index_document
      rescue Elastic::Transport::Transport::Errors::BadRequest => e
        Rails.logger.error e.message
        Sentry.capture_exception(e)
      end
    end

    after_commit on: [:destroy] do
      begin
        __elasticsearch__.delete_document
      rescue Elasticsearch::Transport::Transport::Errors::NotFound
        # 存在しない場合は何もしない
      end
    end
  end

  class_methods do
    def elastic_cloud_index(use_alias: !Rails.env.local?)
      prefix = self::INDEX_PREFIX
      suffix = Rails.env
      suffix += '_alias' if use_alias

      "#{prefix}_index_#{suffix}"
    end

    def switch_alias!(index_name:, alias_name:)
      client = __elasticsearch__.client

      actions = []
      actions << { add: { index: index_name, alias: alias_name } }

      begin
        old_indices = client.indices.get_alias(index: alias_name).keys
        old_indices.each do |old_index|
          actions << { remove: { index: old_index, alias: alias_name } }
        end
      rescue Elastic::Transport::Transport::Errors::NotFound
        Rails.logger.info "Alias not found: #{alias_name}"
      end

      client.indices.update_aliases(body: { actions: actions })
    end

    # 1世代前までを残してそれ以前の古いインデックスを削除
    def cleanup_old_indices!
      client = __elasticsearch__.client
      indices = client.indices.get_alias(index: "#{self.elastic_cloud_index(use_alias: false)}_*").keys
      indices_with_alias = client.indices.get_alias(index: self.elastic_cloud_index(use_alias: true)).keys
      delete_indices = (indices - indices_with_alias).sort[0...-1]

      delete_indices.each do |index|
        client.indices.delete(index: index)
      end
    end

    def separate_text(text)
      body = {
        text: text,
        tokenizer: {
          type: 'kuromoji_tokenizer'
        }
      }

      res = __elasticsearch__.client.indices.analyze(body: body)

      res['tokens'].pluck('token')
    end

    def analyze_text(text)
      body = {
        text: text,
        analyzer: 'kuromoji_analyzer'
      }

      __elasticsearch__.client.indices.analyze(
        index: self.elastic_cloud_index,
        body: body,
      )
    end
  end
end
