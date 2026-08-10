module ProjectSearchable
  extend ActiveSupport::Concern

  INDEX_PREFIX = 'project'.freeze
  MAX_RESULT_SIZE = 10_000_000.freeze

  # v2 おすすめAPI機能パラメータ
  KEYWORDS_MATCH_BOOST = 0.1.freeze
  KEYWORDS_SIMILAR_MATCH_BOOST = 0.25.freeze
  PREFECTURES_MATCH_BOOST = 1.0.freeze
  PUBLICATION_DATE_MATCH_BOOST = 0.1.freeze
  PLANNED_PRICE_MATCH_BOOST = 0.25.freeze
  IS_EXPERIENCE_REQUIRED_MATCH_BOOST = 0.25.freeze
  FAVORITE_TITLE_MORE_LIKE_THIS_MIN_TERM_FREQ = 1.freeze
  FAVORITE_TITLE_MORE_LIKE_THIS_BOOST = 0.1.freeze
  BUSINESS_DESC_KNN_K = 50.freeze
  BUSINESS_DESC_KNN_NUM_CANDIDATES = 500.freeze
  BUSINESS_DESC_KNN_MATCH_BOOST = 10.0.freeze
  PROJECT_SUMMARY_KNN_K = 30.freeze
  PROJECT_SUMMARY_KNN_NUM_CANDIDATES = 300.freeze
  PROJECT_SUMMARY_KNN_MATCH_BOOST = 3.0.freeze

  # 重複落札案件検出APIパラメータ
  KEYWORD_MINIMUM_SHOULD_MATCH = 8.freeze

  included do
    include SearchableCommon

    scope :includes_for_search, -> { includes(:project_embeddings, :lg_codes, :organization, :project_security_qualifications, :summary_embedding, awarded_project: { bidders: :bid_company }) }

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
        filter: {
          synonym: {
            type: 'synonym_graph',
            synonyms_path: 'synonyms.txt',
            updateable: true
          },
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
          synonym_analyzer: {
            type: 'custom',
            char_filter: [
              'remove_blank',
              "html_strip",
              'icu_normalizer'
            ],
            tokenizer: 'kuromoji_tokenizer',
            filter: [
              'kuromoji_baseform',
              'kuromoji_number',
              'lowercase',
              'synonym',
              'ja_stop',
              'kuromoji_part_of_speech',
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
        indexes :title, analyzer: 'kuromoji_analyzer', search_analyzer: 'synonym_analyzer', fields: {
          '23gram': { type: 'text', analyzer: '23gram_analyzer' },
          kuromoji: { type: 'text', analyzer: 'kuromoji_analyzer', search_analyzer: 'kuromoji_analyzer' }
        }
        indexes :description, analyzer: 'kuromoji_analyzer', search_analyzer: 'synonym_analyzer', fields: {
          kuromoji: { type: 'text', analyzer: 'kuromoji_analyzer', search_analyzer: 'kuromoji_analyzer' }
        }
        indexes :lg_codes, type: 'keyword'
        indexes :publication_date, type: 'date'
        indexes :application_document_deadline_date, type: 'date'
        indexes :proposal_document_deadline_date, type: 'date'
        indexes :bidding_deadline_date, type: 'date'
        indexes :tender_opening_date, type: 'date'
        indexes :procedure_type, type: 'keyword'
        indexes :procedure_type_group, type: 'keyword'
        indexes :source, type: 'keyword'
        indexes :created_at, type: 'date'
        indexes :registration_date, type: 'date'
        indexes :project_embeddings, type: 'nested' do
          indexes :embedding, type: 'dense_vector', dims: 768
        end
        indexes :organization_name, type: 'keyword'
        indexes :is_hidden, type: 'boolean'
        indexes :planned_price, type: 'long'
        indexes :is_experience_required, type: 'boolean'
        indexes :is_office_required, type: 'boolean'
        indexes :participation_qualification, type: 'keyword'
        indexes :grade, type: 'keyword'
        indexes :security_qualification, type: 'keyword'
        indexes :summary_embedding, type: 'dense_vector', dims: 768
        indexes :participate_qualification_ids, type: 'keyword'
        indexes :participate_qualification_grade_ids, type: 'keyword'
        indexes :participate_qualification_types, type: 'keyword'
        indexes :participate_qualification_prefectures, type: 'keyword'
        indexes :has_awarded_project, type: 'boolean'
        indexes :bidders, type: 'nested' do
          indexes :bid_company_id, type: 'long'
          indexes :bid_company_name, type: 'keyword'
          indexes :is_successful, type: 'boolean'
        end
      end
    end

    def as_indexed_json(*)
      index = {
        title: self.title,
        description: self.description,
        lg_codes: self.lg_codes.map(&:code),
        publication_date: self.publication_date,
        application_document_deadline_date: self.application_document_deadline_date,
        proposal_document_deadline_date: self.proposal_document_deadline_date,
        bidding_deadline_date: self.bidding_deadline_date,
        tender_opening_date: self.tender_opening_date,
        procedure_type: self.procedure_type,
        procedure_type_group: self.procedure_type_group,
        source: self.source,
        created_at: self.created_at,
        registration_date: self.registration_date,
        organization_name: self.organization&.name,
        is_hidden: self.hidden_at.present?,
        planned_price: self.planned_price,
        is_experience_required: self.is_experience_required,
        is_office_required: self.is_office_required,
        participation_qualification: self.participation_qualification,
        security_qualification: self.project_security_qualifications&.map(&:security_qualification) || [],
        has_awarded_project: self.awarded_project.present?,
      }

      index[:project_embeddings] = self.project_embeddings.map do |project_embedding|
        {
          embedding: project_embedding.embedding['embedding']
        }
      end if project_embeddings.present?
      index[:summary_embedding] = self.summary_embedding.embedding['embedding'] if summary_embedding.present?

      self.participate_qualification_grades.each do |pg|
        index[:participate_qualification_ids] ||= []
        index[:participate_qualification_ids] << pg.participate_qualification.id.to_s

        index[:participate_qualification_grade_ids] ||= []
        index[:participate_qualification_grade_ids] << pg.id.to_s

        index[:participate_qualification_types] ||= []
        index[:participate_qualification_types] << pg.participate_qualification.participate_qualification_type

        index[:participate_qualification_prefectures] ||= []
        index[:participate_qualification_prefectures] << pg.participate_qualification.lg_code
      end

      index[:bidders] = self.awarded_project.bidders.map do |bidder|
        {
          bid_company_id: bidder.bid_company_id,
          bid_company_name: bidder.bid_company.name,
          is_successful: bidder.is_successful
        }
      end if self.awarded_project&.bidders.present?

      index.as_json
    end
  end

  class_methods do
    def search(args = {})
      self.title_search(args)
    end

    def search_with_search_filter_preset(search_filter_preset, last_notified_at)
      params = build_search_params_from_search_filter_preset(search_filter_preset)
      params[:created_at_from] = last_notified_at || 1.day.ago
      params[:created_at_to] = Time.current
      params[:publication_date_from] = BusinessDateCalculator.business_days_ago(Date.current, 5)
      params[:publication_date_to] = Date.current
      params[:without_aggregations] = true

      self.search(params)
    end

    def business_days_ago(n)
      date = Time.current.to_time # ← TimeWithZone → Time に変換
      n.times { date = date.previous_business_day }
      date
    end

    # NOTE: おすすめ検索API
    # knn_vecs: 添付資料のembeddingsと類似度を計測するベクトルリスト
    # args: 検索条件
    #  keywords: キーワード
    #  prefectures: 都道府県
    #  planned_price_from: 予算下
    #  publication_date_from: 公告日下限
    #  publication_date_to: 公告日上限
    #  is_experience_required: 経験必須
    #  status: 案件ステータス(all/open), default: open
    #  size: 検索結果の最大数, default: 10
    def recommendation_search(knn_vecs, preset, fav_titles, args = {})
      preset_args = build_search_params_from_search_filter_preset(preset)
      args = preset_args.merge(args)

      keywords =  args[:keywords] + args[:or_keywords]
      use_synonym = args[:use_synonym_search] == true # デフォルトはfalse

      keyword_minimum_should_match = 1
      status_filter = open_status_filter
      if args[:status] == 'all'
        keyword_minimum_should_match = keywords.size > 1 ? 2 : 1
        status_filter = all_status_filter
      end

      filters = [
        build_is_hidden_query,
        status_filter,
        {
          bool: {
            must_not: build_not_query(args[:not_keywords], use_synonym)
          }
        },
        build_prefectures_query(args[:prefectures]),
      ].compact

      shoulds = [
        {
          bool: {
            should: keywords.map do |keyword|
              {
                multi_match: {
                  type: 'phrase',
                  fields: use_synonym ? ['title', 'title.23gram'] : ['title.kuromoji', 'title.23gram'],
                  query: keyword,
                  boost: KEYWORDS_MATCH_BOOST
                }
              }
            end,
            minimum_should_match: keyword_minimum_should_match
          }
        },
        build_planned_price_query(args[:planned_price_from], args[:planned_price_to], PLANNED_PRICE_MATCH_BOOST),
        build_is_experience_required_query(args[:is_experience_required], IS_EXPERIENCE_REQUIRED_MATCH_BOOST),
      ].compact

      if fav_titles.length > 0
        shoulds = shoulds + build_more_like_this_queries(['title'], fav_titles, FAVORITE_TITLE_MORE_LIKE_THIS_MIN_TERM_FREQ, FAVORITE_TITLE_MORE_LIKE_THIS_BOOST)
      end

      opts = {
        _source: false,
        query: {
          bool: {
            filter: filters,
            should: shoulds,
            minimum_should_match: 1
          }
        },
        # TODO: 事業情報以外のベクトルが来た際にk, num_candidates, boostを変更する
        knn: knn_vecs.map do |vec|
          {
            query_vector: vec,
            field: 'project_embeddings.embedding',
            k: BUSINESS_DESC_KNN_K,
            num_candidates: BUSINESS_DESC_KNN_NUM_CANDIDATES,
            boost: BUSINESS_DESC_KNN_MATCH_BOOST,
            filter: filters
          }
        end,
        size: args[:size] || 10
      }

      if args[:status] == 'new'
        # newを利用するのは新着イチオシ案件メールのみ
        # 受付中の案件からイチオシ案件を取得し、その中に新着があれば取得するようにpost_filterを設定
        opts[:post_filter] = new_status_filter
      elsif args[:publication_date_from].present? || args[:publication_date_to].present?
        opts[:post_filter] = build_publication_date_range_query(args[:publication_date_from], args[:publication_date_to])
      end

      __elasticsearch__.search(opts)
    end

    def similar_projects_search(knn_vec, args)
      filters = [
        build_is_hidden_query,
        open_status_filter
      ]

      opts = {
        _source: false,
        query: {
          bool: {
            filter: filters,
            should: [
              build_keywords_query(args[:keywords], KEYWORDS_SIMILAR_MATCH_BOOST),
              build_publication_date_range_query(args[:publication_date_from], args[:publication_date_to], PUBLICATION_DATE_MATCH_BOOST),
            ].compact,
            minimum_should_match: 1
          }
        },
        knn: {
          query_vector: knn_vec,
          field: 'project_embeddings.embedding',
          k: PROJECT_SUMMARY_KNN_K,
          num_candidates: PROJECT_SUMMARY_KNN_NUM_CANDIDATES,
          boost: PROJECT_SUMMARY_KNN_MATCH_BOOST,
          filter: filters
        },
        size: args[:size] || 10
      }

      __elasticsearch__.search(opts)
    end

    # お気に入り案件と事業情報を紐付ける
    # 事業情報と類似度の高い案件を取得し、その中にお気に入り案件が含まれている場合は最大5件返却する
    def get_favorite_projects_linked_to_business_description(query_text, favorite_project_ids)
      opts = {
        _source: false,
        query: {
          more_like_this: {
            fields: ['title'],
            like: query_text,
            min_term_freq: 1
          }
        },
        post_filter: {
          terms: {
            _id: favorite_project_ids
          }
        },
        size: 5
      }

      __elasticsearch__.search(opts)
    end

    def similar_awarded_projects_search(like, lg_codes, size: 20)
      opts = {
        _source: false,
        query: {
          bool: {
            filter: [
              build_prefectures_query(lg_codes)
            ].compact,
            must: [
              {
                term: {
                  has_awarded_project: true
                }
              },
              {
                more_like_this: {
                  fields: ['title'],
                  like: like,
                  min_term_freq: 1
                }
              }
            ]
          }
        },
        size: size
      }

      __elasticsearch__.search(opts)
    end

    def similar_projects_by_awarded_project_search(like, lg_codes, size: 5)
      filters = [
        build_is_hidden_query,
        build_prefectures_query(lg_codes),
        {
          term: { has_awarded_project: false }
        }
      ].compact

      opts = {
        _source: false,
        query: {
          bool: {
            filter: filters,
            must: [
              {
                more_like_this: {
                  fields: ['title'],
                  like: like,
                  min_term_freq: 1
                }
              }
            ]
          }
        },
        size: size
      }

      __elasticsearch__.search(opts)
    end

    def get_duplicated_awarded_projects(args, size=5)
      tender_opening_date_from = args[:tender_opening_date] - 3.days
      tender_opening_date_to = args[:tender_opening_date] + 3.days

      opts = {
        _source: false,
        size: size,
        query: {
          bool: {
            must: [
              {
                term: {
                  has_awarded_project: {
                    value: true
                  }
                }
              },
              {
                terms: {
                  lg_codes: args[:lg_codes]
                }
              },
              {
                bool: {
                  should: args[:keywords].map do |keyword|
                    {
                      multi_match: {
                        type: 'phrase',
                        fields: ['title', 'title.23gram'],
                        query: keyword
                      }
                    }
                  end,
                  minimum_should_match: [KEYWORD_MINIMUM_SHOULD_MATCH, args[:keywords].size].min,
                }
              },
              {
                range: {
                  tender_opening_date: {
                    gte: tender_opening_date_from,
                    lte: tender_opening_date_to,
                  }
                }
              }
            ],
            must_not: [
              {
                term: {
                  _id: {
                    value: args[:id],
                  }
                }
              }
            ],
            should: [
              {
                more_like_this: {
                  fields: ['title'],
                  like: args[:title],
                  min_term_freq: 1,
                  max_query_terms: 12,
                  boost: 0.1
                }
              },
              {
                term: {
                  organization_name: {
                    value: args[:organization_name]
                  }
                }
              }
            ]
          }
        }
      }

      __elasticsearch__.search(opts)
    end

    def get_same_project_by_awarded_project(args, min_should_match=8)
      opts = {
        _source: false,
        size: 1,
        query: {
          bool: {
            must: [
              # 入札案件のみ
              {
                term: {
                  has_awarded_project: {
                    value: false
                  }
                }
              },
              # 同一自治体コード
              args[:lg_codes].present? ? {
                terms: {
                  lg_codes: args[:lg_codes]
                }
              } : nil,
              # 同一発注機関名
              args[:organization_name].present? ? {
                term: {
                  organization_name: {
                    value: args[:organization_name]
                  }
                }
              } : nil,
              # 同一ソース
              {
                term: {
                  source: {
                    value: args[:source]
                  }
                }
              },
              # キーワードのうち一定数以上を含むもの
              {
                bool: {
                  minimum_should_match: [min_should_match, args[:keywords].size].min,
                  should: args[:keywords].map do |keyword|
                    {
                      multi_match: {
                        type: 'phrase',
                        fields: ['title', 'title.23gram'],
                        query: keyword
                      }
                    }
                  end
                }
              }
            ].compact,
            should: [
              # 入札日が落札日の前後3日間
              args[:tender_opening_date].present? ? {
                range: {
                  bidding_deadline_date: {
                    gte: args[:tender_opening_date] - 3.days,
                    lte: args[:tender_opening_date] + 3.days
                  }
                }
              } : nil,
              # タイトルの類似度
              {
                more_like_this: {
                  fields: ['title'],
                  like: args[:title],
                  min_term_freq: 1,
                  max_query_terms: 12,
                  boost: 0.1
                }
              }
            ].compact,
          }
        }
      }

      __elasticsearch__.search(opts)
    end

    private

    # keywords: これらのいずれかのキーワードを含むものを検索する
    # not_keywords: これらすべてののキーワードを含まないものを検索する
    # 例: keywords = 'キーワード1 キーワード2'
    #     not_keywords = 'キーワード3 キーワード4'
    #     この場合、キーワード1またはキーワード2を含み、かつキーワード3またはキーワード4を含まないものを検索する
    #     つまり、(キーワード1 OR キーワード2) AND (NOT キーワード3 OR NOT キーワード4) となる
    # NOTE: titleのみが検索対象
    def title_search(args)
      opts = {
        _source: false,
        track_total_hits: true,
        size: MAX_RESULT_SIZE,
        query: {
          bool: build_combined_query(args)
        },
        sort: build_sort_options(args[:sort_by], args[:only_awarded]),
        aggs: args[:without_aggregations] ? {} : build_aggregations
      }

      date_filters = build_date_filters(args)
      opts[:query][:bool][:filter] ||= []
      opts[:query][:bool][:filter].concat(date_filters) if date_filters.present?

      opts[:post_filter] = build_post_filter(args[:tab]) if args[:tab].present?
      __elasticsearch__.search(opts)
    end

    def build_combined_query(args)
      query = { bool: {} }
      use_synonym = args[:use_synonym_search] == true # デフォルトはfalse

      and_query = build_and_query(args[:keywords], use_synonym)
      or_query = build_or_query(args[:or_keywords], use_synonym)

      if and_query.present? && or_query.present?
        # NOTE: AND条件を全て含む、かつOR条件を必ず1つ以上含むものを検索するためmustを使用
        query[:bool][:must] = [and_query, or_query]
      elsif and_query.present?
        query[:bool][:must] = and_query
      elsif or_query.present?
        query[:bool][:should] = or_query
        query[:bool][:minimum_should_match] = 1
      end

      query[:bool][:must_not] = build_not_query(args[:not_keywords], use_synonym)
      query[:bool][:filter] = build_filter(args)
      query[:bool]
    end

    def build_date_filters(args)
      date_queries = []

      date_fields = {
        application_document_deadline_date: [:application_document_deadline_date_eq, :application_document_deadline_date_from, :application_document_deadline_date_to],
        publication_date: [:publication_date_eq, :publication_date_from, :publication_date_to],
        proposal_document_deadline_date: [:proposal_document_deadline_date_eq, :proposal_document_deadline_date_from, :proposal_document_deadline_date_to],
        bidding_deadline_date: [:bidding_deadline_date_eq, :bidding_deadline_date_from, :bidding_deadline_date_to],
        tender_opening_date: [:tender_opening_date_eq, :tender_opening_date_from, :tender_opening_date_to]
      }

      date_fields.each do |field, params|
        eq_param = args[params[0]]
        from_param = args[params[1]]
        to_param = args[params[2]]

        if eq_param == "null"
          date_queries << {
            bool: {
              must_not: {
                exists: { field: field }
              }
            }
          }
        elsif from_param.present? || to_param.present?
          range = { range: { field => {} } }
          range[:range][field][:gte] = from_param if from_param.present?
          range[:range][field][:lte] = to_param if to_param.present?
          date_queries << range
        end
      end

      date_queries
    end

    def build_and_query(keywords, use_synonym = true)
      return [] if keywords.blank?

      {
        bool: {
          must: keywords.map do |keyword|
            {
              multi_match: {
                type: 'phrase',
                query: keyword,
                fields: use_synonym ? [
                  'title',
                  'title.23gram'
                ] : [
                  'title.kuromoji',
                  'title.23gram'
                ]
              }
            }
          end
        }
      }
    end

    def build_or_query(or_keywords, use_synonym = true)
      return [] if or_keywords.blank?

      queries = or_keywords.flat_map do |keyword|
        [
          {
            multi_match: {
              type: 'phrase',
              fields: use_synonym ? ['title^3', 'title.23gram^2'] : ['title.kuromoji^3', 'title.23gram^2'],
              query: keyword,
              boost: 3.0
            }
          },
          {
            multi_match: {
              type: 'phrase',
              slop: 2,
              fields: use_synonym ? ['title^2', 'title.23gram'] : ['title.kuromoji^2', 'title.23gram'],
              query: keyword,
              boost: 1.0
            }
          }
        ]
      end

      {
        bool: {
          should: queries,
          minimum_should_match: 1
        }
      }
    end

    def build_not_query(not_keywords, use_synonym = true)
      return [] if not_keywords.blank?

      fields = use_synonym ? ['title', 'title.23gram'] : ['title.kuromoji', 'title.23gram']
      not_keywords.map do |keyword|
        {
          multi_match: {
            type: 'phrase',
            fields: fields,
            query: keyword
          }
        }
      end
    end

    def build_filter(args)
      [
        build_only_awarded_query(args[:only_awarded]),
        build_prefectures_query(args[:prefectures]),
        build_procedure_types_query(args[:procedure_types]),
        build_procedure_type_groups_query(args[:procedure_type_groups]),
        build_bidder_query(args[:bid_company_name], args[:only_successful_bidders]),
        build_source_query(args[:source]),
        build_period_query(args[:period]),
        build_created_at_range_query(args[:created_at_from], args[:created_at_to]),
        build_registration_date_range_query(args[:registration_date_from], args[:registration_date_to]),
        build_application_document_deadline_date_range_query(args[:application_document_deadline_date_from], args[:application_document_deadline_date_to]),
        build_proposal_document_deadline_date_range_query(args[:proposal_document_deadline_date_from], args[:proposal_document_deadline_date_to]),
        build_bidding_deadline_date_range_query(args[:bidding_deadline_date_from], args[:bidding_deadline_date_to]),
        build_tender_opening_date_range_query(args[:tender_opening_date_from], args[:tender_opening_date_to]),
        (build_organization_name_query(args[:organization_name]) if args[:organization_name_array].blank?),
        (build_organization_name_array_query(args[:organization_name_array]) if args[:organization_name_array].present?),
        build_is_hidden_query,
        build_planned_price_query(args[:planned_price_from], args[:planned_price_to]),
        build_is_experience_required_query(args[:is_experience_required]),
        build_is_office_required_query(args[:is_office_required]),
        build_security_qualification_query(args[:project_security_qualifications]),
        build_participation_qualification_query(args[:participation_qualification]),
        build_participate_qualification_ids_query(args[:participate_qualification_ids]),
        build_participate_qualification_grade_ids_query(args[:participate_qualification_grade_ids]),
        build_participate_qualification_types_query(args[:participate_qualification_types]),
        build_participate_qualification_prefectures_query(args[:participate_qualification_prefectures]),
        build_no_qualification_query(args[:no_qualification]),
        build_deadline_days_remaining_query(args[:deadline_days_remaining]),
        *args[:additional_filters]
      ].compact
    end

    def build_only_awarded_query(only_awarded)
      return if only_awarded.blank?

      {
        term: { has_awarded_project: true }
      }
    end

    def build_prefectures_query(prefecture_codes, boost = 1.0)
      return if prefecture_codes.blank?
      return if prefecture_codes.is_a?(String)

      formatted_codes = prefecture_codes.filter_map do |code|
        # IDが送られてきた場合はフォーマットして使用
        # 都道府県名が送られてきた場合は変換
        if code.to_s.match?(/^\d+$/)
          LgCodeConverter.to_formatted_code(code)
        else
          LgCodeConverter.to_code(code)
        end
      end

      return if formatted_codes.empty?

      {
        terms: {
          lg_codes: formatted_codes,
          boost: boost
        }
      }
    end

    def build_keywords_query(keywords, boost = 1.0)
      return if keywords.blank?

      {
        bool: {
          should: [
            *keywords.split(' ').map do |keyword|
              {
                multi_match: {
                  type: 'phrase',
                  query: keyword,
                  fields: [
                    'title',
                    'title.23gram',
                    'description'
                  ],
                  boost: boost
                }
              }
            end
          ]
        }
      }
    end

    def build_price_range_query(from_price, to_price, boost = 1.0)
      return if from_price.blank? && to_price.blank?

      {
        range: {
          planned_price: {
            gte: from_price,
            lte: to_price,
            boost: boost
          }
        }
      }
    end

    def build_procedure_types_query(procedure_types)
      return if procedure_types.blank?

      {
        terms: {
          procedure_type: procedure_types
        }
      }
    end

    def build_procedure_type_groups_query(procedure_type_groups)
      return if procedure_type_groups.blank?

      {
        terms: {
          procedure_type_group: procedure_type_groups
        }
      }
    end

    def build_source_query(source)
      return if source.blank?

      {
        term: {
          source: source
        }
      }
    end

    def build_period_query(period)
      return if period.blank?

      gte = case period
      when '1week'
        1.week.ago
      when '1month'
        1.month.ago
      when '3months'
        3.months.ago
      else
        nil
      end

      return if gte.nil?

      {
        range: {
          publication_date: {
            gte: gte.to_date
          }
        }
      }
    end

    def build_publication_date_range_query(from_date, to_date, boost = 1.0)
      return if from_date.blank? && to_date.blank?

      range = {}
      range[:gte] = from_date.to_date if from_date.present?
      range[:lte] = to_date.to_date if to_date.present?
      range[:boost] = boost

      {
        range: {
          publication_date: range
        }
      }
    end

    def build_created_at_range_query(from_date, to_date)
      return if from_date.blank? && to_date.blank?

      range = {}
      range[:gte] = from_date if from_date.present?
      range[:lte] = to_date if to_date.present?

      {
        range: {
          created_at: range
        }
      }
    end

    def build_registration_date_range_query(from_date, to_date)
      return if from_date.blank? && to_date.blank?

      range = {}
      range[:gte] = from_date.to_date if from_date.present?
      range[:lte] = to_date.to_date if to_date.present?

      {
        range: {
          registration_date: range
        }
      }
    end

    def build_application_document_deadline_date_range_query(from_date, to_date)
      return if from_date.blank? && to_date.blank?

      range = {}
      range[:gte] = from_date.to_date if from_date.present?
      range[:lte] = to_date.to_date if to_date.present?

      {
        range: {
          application_document_deadline_date: range
        }
      }
    end

    def build_proposal_document_deadline_date_range_query(from_date, to_date)
      return if from_date.blank? && to_date.blank?

      range = {}
      range[:gte] = from_date.to_date if from_date.present?
      range[:lte] = to_date.to_date if to_date.present?

      {
        range: {
          proposal_document_deadline_date: range
        }
      }
    end

    def build_bidding_deadline_date_range_query(from_date, to_date)
      return if from_date.blank? && to_date.blank?

      range = {}
      range[:gte] = from_date.to_date if from_date.present?
      range[:lte] = to_date.to_date if to_date.present?

      {
        range: {
          bidding_deadline_date: range
        }
      }
    end

    def build_tender_opening_date_range_query(from_date, to_date)
      return if from_date.blank? && to_date.blank?

      range = {}
      range[:gte] = from_date.to_date if from_date.present?
      range[:lte] = to_date.to_date if to_date.present?

      {
        bool: {
          must: [
            {
              range: {
                tender_opening_date: range
              }
            },
            {
              term: { has_awarded_project: true }
            }
          ]
        }
      }
    end

    def build_organization_name_array_query(organization_name_array)
      return if organization_name_array.blank?

      {
        bool: {
          should: organization_name_array.filter_map do |organization_name|
            build_organization_name_query(organization_name)
          end
        }
      }
    end

    def build_organization_name_query(organization_name)
      return if organization_name.blank?

      {
        term: {
          organization_name: organization_name
        }
      }
    end

    def build_is_hidden_query
      {
        term: {
          is_hidden: false
        }
      }
    end

    def build_planned_price_query(planned_price_from, planned_price_to, boost = 1.0)
      return if planned_price_from.blank? && planned_price_to.blank?

      range = {}
      range[:gte] = planned_price_from if planned_price_from.present?
      range[:lte] = planned_price_to if planned_price_to.present?
      range[:boost] = boost

      {
        range: {
          planned_price: range
        }
      }
    end

    def build_participation_qualification_query(participation_qualification)
      return if participation_qualification.blank?

      {
        term: {
          participation_qualification: participation_qualification
        }
      }
    end

    def build_grade_query(grade)
      return if grade.blank?

      {
        bool: {
          should: grade.map do |g|
            {
              term: {
                grade: g
              }
            }
          end
        }
      }
    end

    def build_security_qualification_query(security_qualification)
      return if security_qualification.blank?

      {
        bool: {
          should: security_qualification.map do |sq|
            if sq == '不要'
              {
                bool: {
                  must_not: {
                    exists: {
                      field: 'security_qualification'
                    }
                  }
                }
              }
            else
              {
                term: {
                  security_qualification: sq
                }
              }
            end
          end
        }
      }
    end

    def build_is_experience_required_query(is_experience_required, boost = 1.0)
      return if is_experience_required.blank?

      {
        term: {
          is_experience_required: {
            value: is_experience_required,
            boost: boost
          }
        }
      }
    end

    def build_is_office_required_query(is_office_required)
      return if is_office_required.blank?

      {
        term: {
          is_office_required: is_office_required
        }
      }
    end

    def build_participate_qualification_ids_query(participate_qualification_ids)
      return if participate_qualification_ids.blank?

      {
        terms: {
          participate_qualification_ids: participate_qualification_ids
        }
      }
    end

    def build_no_qualification_query(no_qualification)
      return if no_qualification.blank? || !ActiveRecord::Type::Boolean.new.cast(no_qualification)

      {
        bool: {
          must_not: {
            exists: {
              field: 'participate_qualification_ids'
            }
          }
        }
      }
    end

    def build_bidder_query(bid_company_name, only_successful_bidders)
      return if bid_company_name.blank? && only_successful_bidders.blank?

      queries = []
      queries << { term: { 'bidders.bid_company_name': bid_company_name } } if bid_company_name.present?
      queries << { term: { 'bidders.is_successful': true } } if only_successful_bidders == "true"

      {
        nested: {
          path: 'bidders',
          query: {
            bool: {
              must: queries
            }
          }
        }
      }
    end

    def build_participate_qualification_grade_ids_query(participate_qualification_grade_ids)
      return if participate_qualification_grade_ids.blank?

      {
        terms: {
          participate_qualification_grade_ids: participate_qualification_grade_ids
        }
      }
    end

    def build_participate_qualification_types_query(participate_qualification_types)
      return if participate_qualification_types.blank?

      {
        terms: {
          participate_qualification_types: participate_qualification_types
        }
      }
    end

    def build_participate_qualification_prefectures_query(participate_qualification_prefectures)
      return if participate_qualification_prefectures.blank?

      formatted_codes = participate_qualification_prefectures.filter_map do |code|
        LgCodeConverter.to_formatted_code(code)
      end

      return if formatted_codes.empty?

      {
        terms: {
          participate_qualification_prefectures: formatted_codes
        }
      }
    end

    def build_deadline_days_remaining_query(days_remaining)
      return if days_remaining.blank? || days_remaining.to_i <= 0

      # 締切日が指定した日数以上あるものをフィルタリング
      target_date = Date.current + days_remaining.to_i.days
      {
        bool: {
          should: [
            # 参加申込期日がある場合
            {
              bool: {
                must: [
                  {
                    exists: {
                      field: 'application_document_deadline_date'
                    }
                  },
                  {
                    range: {
                      application_document_deadline_date: {
                        gte: target_date.to_s
                      }
                    }
                  }
                ]
              }
            },
            # 参加申込期日がなく、提案書期日がある場合
            {
              bool: {
                must_not: [
                  {
                    exists: {
                      field: 'application_document_deadline_date'
                    }
                  }
                ],
                must: [
                  {
                    exists: {
                      field: 'proposal_document_deadline_date'
                    }
                  },
                  {
                    range: {
                      proposal_document_deadline_date: {
                        gte: target_date.to_s
                      }
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    end

    def build_search_params_from_search_filter_preset(search_filter_preset)
      {
        keywords:  search_filter_preset.keywords,
        or_keywords: search_filter_preset.or_keywords,
        not_keywords:  search_filter_preset.not_keywords,
        use_synonym_search: search_filter_preset.use_synonym_search,
        prefectures: search_filter_preset.prefectures,
        organizations: search_filter_preset.organizations,
        procedure_types: search_filter_preset.procedure_types,
        procedure_type_groups: search_filter_preset.procedure_type_groups,
        period: search_filter_preset.period,
        publication_date_from: search_filter_preset.publication_date_from,
        publication_date_to: search_filter_preset.publication_date_to,
        planned_price_from: search_filter_preset.planned_price_from,
        planned_price_to: search_filter_preset.planned_price_to,
        is_experience_required: search_filter_preset.is_experience_required,
        is_office_required: search_filter_preset.is_office_required,
        project_security_qualifications: search_filter_preset.project_security_qualifications,
        no_qualification: search_filter_preset.no_qualification,
        deadline_days_remaining: search_filter_preset.deadline_days_remaining,
        tender_opening_date_from: search_filter_preset.tender_opening_date_from,
        tender_opening_date_to: search_filter_preset.tender_opening_date_to
      }
    end

    def build_sort_options(sort_by, only_awarded = false)
      sort_options = {
        'relevance_desc' => [{ _score: { order: 'desc' } }, { publication_date: { order: 'desc' } }],
        'relevance_asc' => [{ _score: { order: 'asc' } }, { publication_date: { order: 'desc' } }],
        'publication_date_desc' => [{ publication_date: { order: 'desc' } }, { _score: { order: 'desc' } }],
        'publication_date_asc' => [{ publication_date: { order: 'asc' } }, { _score: { order: 'desc' } }],
        'application_document_deadline_date_desc' => [{ application_document_deadline_date: { order: 'desc' } }, { _score: { order: 'desc' } }],
        'application_document_deadline_date_asc' => [{ application_document_deadline_date: { order: 'asc' } }, { _score: { order: 'desc' } }],
        'proposal_document_deadline_date_desc' => [{ proposal_document_deadline_date: { order: 'desc' } }, { _score: { order: 'desc' } }],
        'proposal_document_deadline_date_asc' => [{ proposal_document_deadline_date: { order: 'asc' } }, { _score: { order: 'desc' } }],
        'bidding_deadline_date_desc' => [{ bidding_deadline_date: { order: 'desc' } }, { _score: { order: 'desc' } }],
        'bidding_deadline_date_asc' => [{ bidding_deadline_date: { order: 'asc' } }, { _score: { order: 'desc' } }],
        'tender_opening_date_desc' => [{ tender_opening_date: { order: 'desc' } }, { _score: { order: 'desc' } }],
        'tender_opening_date_asc' => [{ tender_opening_date: { order: 'asc' } }, { _score: { order: 'desc' } }]
      }

      default_sort = only_awarded ? 'tender_opening_date_desc' : 'publication_date_desc'
      sort_options[sort_by || default_sort]
    end

    # NOTE: ステータスごとの件数を取得するためのaggregations
    # new: 新着、open: 受付中、closed: 受付終了
    def build_aggregations
      {
        tabs: {
          filters: {
            filters: {
              all: all_status_filter,
              new: new_status_filter,
              open: open_status_filter,
              closed: closed_status_filter,
              awarded: awarded_project_filter
            }
          }
        }
      }
    end

    def all_status_filter
      {
        match_all: {}
      }
    end

    def new_status_filter
      {
        range: {
          publication_date: {
            gte: 'now-1d/d',
            lte: 'now/d'
          }
        }
      }
    end

    def open_status_filter
      {
        bool: {
          should: [
            {
              bool: {
                must: [
                  {
                    exists: {
                      field: 'application_document_deadline_date'
                    }
                  },
                  {
                    range: {
                      application_document_deadline_date: {
                        gte: 'now/d'
                      }
                    }
                  }
                ]
              }
            },
            {
              bool: {
                must_not: [
                  {
                    exists: {
                      field: 'application_document_deadline_date'
                    }
                  }
                ],
                must: [
                  {
                    exists: {
                      field: 'proposal_document_deadline_date'
                    }
                  },
                  {
                    range: {
                      proposal_document_deadline_date: {
                        gte: 'now/d'
                      }
                    }
                  }
                ]
              }
            },
            {
              bool: {
                must_not: [
                  {
                    exists: {
                      field: 'application_document_deadline_date'
                    }
                  },
                  {
                    exists: {
                      field: 'proposal_document_deadline_date'
                    }
                  }
                ],
                must: [
                  {
                    exists: {
                      field: 'bidding_deadline_date'
                    }
                  },
                  {
                    range: {
                      bidding_deadline_date: {
                        gte: 'now/d'
                      }
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    end

    # 申し込み期限日が過去の案件、または申し込み期限日が設定されていない場合は申請書類提出期限日が過去の案件を取得する
    def closed_status_filter
      {
        bool: {
          should: [
            {
              bool: {
                must: [
                  {
                    exists: {
                      field: 'application_document_deadline_date'
                    }
                  },
                  {
                    range: {
                      application_document_deadline_date: {
                        lt: 'now/d'
                      }
                    }
                  }
                ]
              }
            },
            {
              bool: {
                must_not: [
                  {
                    exists: {
                      field: 'application_document_deadline_date'
                    }
                  }
                ],
                must: [
                  {
                    exists: {
                      field: 'proposal_document_deadline_date'
                    }
                  },
                  {
                    range: {
                      proposal_document_deadline_date: {
                        lt: 'now/d'
                      }
                    }
                  }
                ]
              }
            },
            {
              bool: {
                must_not: [
                  {
                    exists: {
                      field: 'application_document_deadline_date'
                    }
                  },
                  {
                    exists: {
                      field: 'proposal_document_deadline_date'
                    }
                  }
                ],
                must: [
                  {
                    exists: {
                      field: 'bidding_deadline_date'
                    }
                  },
                  {
                    range: {
                      bidding_deadline_date: {
                        lt: 'now/d'
                      }
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    end

    def awarded_project_filter
      {
        term: {
          has_awarded_project: true
        }
      }
    end

    def build_post_filter(tab)
      return if tab.blank?

      case tab
      when 'all'
        all_status_filter
      when 'new'
        new_status_filter
      when 'open'
        open_status_filter
      when 'closed'
        closed_status_filter
      when 'awarded'
        awarded_project_filter
      end
    end

    def build_more_like_this_queries(fields, likes, min_term_freq = 1, boost = 1.0)
      return if likes.empty?

      likes.map do |like|
        build_more_like_this_query(fields, like, min_term_freq, boost)
      end
    end

    def build_more_like_this_query(fields, like, min_term_freq = 1, boost = 1.0)
      {
        more_like_this: {
          fields: fields,
          like: like,
          min_term_freq: min_term_freq,
          boost: boost
        }
      }
    end
  end
end
