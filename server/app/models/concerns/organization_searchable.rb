module OrganizationSearchable
  extend ActiveSupport::Concern

  INDEX_PREFIX = 'organization'.freeze
  MAX_RESULT_SIZE = 10_000_000.freeze

  included do
    include SearchableCommon

    scope :includes_for_search, -> { includes(:projects, :awarded_projects) }

    settings index: {
      max_result_window: MAX_RESULT_SIZE,
      analysis: {
        char_filter: {
          remove_blank: {
            type: 'pattern_replace',
            pattern: '[ 　]',
            replacement: ''
          }
        },
        tokenizer: {
          '23gram': {
            type: 'ngram',
            min_gram: 2,
            max_gram: 3,
            token_chars: ['letter', 'digit']
          }
        },
        analyzer: {
          kuromoji_analyzer: {
            type: 'custom',
            char_filter: [
              'remove_blank',
              "html_strip",
              'icu_normalizer'
            ],
            tokenizer: 'kuromoji_tokenizer',
            filter: [
              'kuromoji_baseform',
              'kuromoji_part_of_speech',
              'ja_stop',
              'kuromoji_number',
              'kuromoji_stemmer'
            ]
          },
          '23gram_analyzer': {
            type: 'custom',
            tokenizer: '23gram',
            filter: ['ja_stop']
          }
        }
      }
    } do
      mappings dynamic: 'false' do
        indexes :id, type: 'integer'
        indexes :name, type: 'text', analyzer: 'kuromoji_analyzer', fields: {
          keyword: { type: 'keyword' },
          ngram: { type: 'text', analyzer: '23gram_analyzer' }
        }
        indexes :bidded_projects_count, type: 'integer'
        indexes :open_projects_count, type: 'integer'
        indexes :total_projects_count, type: 'integer'
        indexes :prefecture_codes, type: 'integer'
      end
    end

    # インデックス更新時のコールバック
    after_save :update_elasticsearch_index
    after_destroy :delete_elasticsearch_index

    def update_elasticsearch_index
      __elasticsearch__.index_document
    rescue => e
      Rails.logger.error "Failed to index organization #{id}: #{e.message}"
    end

    def delete_elasticsearch_index
      __elasticsearch__.delete_document
    rescue => e
      Rails.logger.error "Failed to delete organization index #{id}: #{e.message}"
    end

    # インデックス用のJSONを生成
    def as_indexed_json(*)
      today = Time.zone.today

      # プロジェクト数のカウント
      open_projects = projects.select do |p|
        (p.application_document_deadline_date.present? && p.application_document_deadline_date >= today) ||
        (p.application_document_deadline_date.nil? && p.proposal_document_deadline_date.present? && p.proposal_document_deadline_date >= today) ||
        (p.application_document_deadline_date.nil? && p.proposal_document_deadline_date.nil? && p.bidding_deadline_date.present? && p.bidding_deadline_date >= today)
      end

      # 都道府県コードの収集
      prefecture_codes = Set.new
      projects.each do |project|
        project.lg_codes.each do |lg_code|
          prefecture_codes.add(lg_code.code)
        end
      end

      awarded_projects.each do |awarded_project|
        next if awarded_project.project.nil?

        awarded_project.project.lg_codes.each do |lg_code|
          prefecture_codes.add(lg_code.code)
        end
      end

      bidded_count = awarded_projects.size
      open_count = open_projects.size
      total_count = bidded_count + open_count

      {
        id: id,
        name: name,
        bidded_projects_count: bidded_count,
        open_projects_count: open_count,
        total_projects_count: total_count,
        prefecture_codes: prefecture_codes.to_a
      }
    end
  end

  class_methods do
    def search(args = {})
      self.name_search(args)
    end

    def name_search(args)
      # Elasticsearchクエリの構築
      __elasticsearch__.search({
        query: build_combined_query(args),
        sort: { total_projects_count: { order: 'desc' } }
      })
    end

    def build_combined_query(args)
      query = { bool: {} }

      # キーワード検索
      must_queries = []
      if args[:keywords].present?
        must_queries.concat(build_and_query(args[:keywords]))
      end

      # 都道府県検索
      if args[:prefectures].present?
        must_queries << build_prefectures_query(args[:prefectures])
      end

      query[:bool][:must] = must_queries if must_queries.present?

      query
    end

    def build_and_query(keywords)
      return [] if keywords.blank?

      keywords.map { |keyword| build_name_query(keyword) }
    end

    def build_name_query(keyword)
      {
        multi_match: {
          query: keyword,
          fields: ['name^3', 'name.ngram'],
          type: 'best_fields',
          operator: 'and',
          fuzziness: 'AUTO'
        }
      }
    end

    def build_prefectures_query(prefecture_codes)
      return if prefecture_codes.blank?

      {
        terms: {
          prefecture_codes: prefecture_codes
        }
      }
    end

  end
end
