# == Schema Information
#
# Table name: projects
# Database name: primary
#
#  id                                                                                                 :bigint           not null, primary key
#  application_document_deadline_date(応募書類提出期日)                                               :date
#  bidding_deadline_date(入札日)                                                                      :date
#  briefing_session_date(入札説明会日)                                                                :date
#  city_code(市区町村コード)                                                                          :string(255)
#  city_name(市区町村)                                                                                :string(255)
#  delivery_deadline_date(納入期限日)                                                                 :date
#  description(公告文)                                                                                :text(4294967295)
#  external_document_url(公告情報のURL)                                                               :text(65535)
#  hidden_at(非表示日時)                                                                              :datetime
#  is_backfilled(過去分取り込みによるデータかどうか)                                                  :boolean          default(FALSE), not null
#  is_experience_required(実績が必要かどうか)                                                         :boolean          default(FALSE), not null
#  is_office_required(事業所が必要かどうか)                                                           :boolean
#  key(公告情報のキー(取得元で採番されたキー))                                                        :string(255)      not null
#  keywords(キーワード)                                                                               :text(65535)
#  lg_code(都道府県コード)                                                                            :string(255)
#  organization_name(発注機関名)                                                                      :string(255)
#  participation_qualification(参加資格)                                                              :string(255)
#  planned_price(予定価格)                                                                            :bigint
#  prefecture_name(都道府県名)                                                                        :string(255)
#  procedure_type(入札方式)                                                                           :string(255)
#  procedure_type_group(入札方式グループ)                                                             :string(255)
#  processing_status(処理状況 (pending, processing_documents, processing_summary, completed, failed)) :string(255)      default("pending")
#  proposal_document_deadline_date(提案書類提出期日)                                                  :date
#  publication_date(公告日)                                                                           :date
#  raw_title(整形前の件名)                                                                            :string(255)
#  registration_date(登録日)                                                                          :date             not null
#  source(公告情報の取得元)                                                                           :string(255)      not null
#  summary(案件詳細の要約)                                                                            :text(4294967295)
#  tender_opening_date(開札日)                                                                        :date
#  title(件名)                                                                                        :string(255)      not null
#  ulid(ULID(ルーター側で採番したキー))                                                               :string(255)
#  uuid(UUID(Labid側で採番したキー))                                                                  :string(255)      not null
#  created_at                                                                                         :datetime         not null
#  updated_at                                                                                         :datetime         not null
#  company_project_id(企業プロジェクトID)                                                             :bigint
#  organization_id(発注機関ID)                                                                        :bigint
#
# Indexes
#
#  index_projects_on_application_document_deadline_date  (application_document_deadline_date)
#  index_projects_on_bidding_deadline_date               (bidding_deadline_date)
#  index_projects_on_city_code                           (city_code)
#  index_projects_on_company_project_id                  (company_project_id)
#  index_projects_on_hidden_at                           (hidden_at)
#  index_projects_on_key_and_source                      (key,source) UNIQUE
#  index_projects_on_lg_code                             (lg_code)
#  index_projects_on_organization_id                     (organization_id)
#  index_projects_on_organization_name                   (organization_name)
#  index_projects_on_proposal_document_deadline_date     (proposal_document_deadline_date)
#  index_projects_on_raw_title                           (raw_title)
#  index_projects_on_registration_date                   (registration_date)
#  index_projects_on_title                               (title)
#  index_projects_on_updated_at                          (updated_at)
#  index_projects_on_uuid                                (uuid) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (company_project_id => company_projects.id)
#  fk_rails_...  (organization_id => organizations.id)
#
require 'pathname'

class Project < ApplicationRecord
  include ProjectSearchable
  include PhraseRemovable
  include ProjectAndAwardedProjectCommon

  attr_accessor :highlighted_title
  attr_accessor :skip_check_date_callback
  attr_accessor :allow_future_publication_date

  has_many :external_documents, as: :attachable, dependent: :destroy
  has_many :screenshots, as: :attachable, dependent: :destroy
  has_many :source_files, as: :attachable, dependent: :destroy
  has_many :date_extraction_logs, dependent: :destroy
  has_many :project_embeddings, dependent: :destroy
  has_many :lg_codes, class_name: 'ProjectLgCode', dependent: :destroy
  has_many :favorites, dependent: :destroy
  has_many :project_reactions, dependent: :destroy
  has_many :project_summary_usages, dependent: :destroy
  has_many :business_description_favorite_projects, dependent: :destroy
  has_many :browsing_histories, as: :browsable, dependent: :destroy
  has_many :bid_pipelines, dependent: :destroy
  has_many :project_grades, dependent: :destroy
  has_many :project_security_qualifications, dependent: :destroy
  has_many :project_participate_qualification_grades, dependent: :destroy
  has_many :participate_qualification_grades, through: :project_participate_qualification_grades, dependent: :destroy
  has_many :project_chat_histories, dependent: :destroy
  has_many :project_awarded_links, dependent: :destroy
  has_many :awarded_links, class_name: 'ProjectAwardedLink', foreign_key: 'project_awarded_id', inverse_of: :project_awarded, dependent: :destroy
  has_one :summary_embedding, -> {
    merge(ProjectEmbedding.where(embedding_type: 'project_summary_embeddings'))
  }, class_name: 'ProjectEmbedding', dependent: :destroy, inverse_of: :project
  has_one :awarded_project, dependent: :destroy
  belongs_to :organization, optional: true
  belongs_to :company_project, optional: true

  validates :uuid, presence: true, uniqueness: true
  validates :key, presence: true, uniqueness: { scope: :source }
  validates :title, presence: true
  validates :source, presence: true
  validates :registration_date, presence: true
  validates :is_backfilled, inclusion: { in: [true, false] }, allow_nil: true
  validates :is_experience_required, inclusion: { in: [true, false] }, allow_nil: true

  enum :processing_status, {
    pending: 'pending',
    processing_documents: 'processing_documents',
    processing_summary: 'processing_summary',
    completed: 'completed',
    failed: 'failed'
  }

  # awarded_projectにはuuidがないため、uuidを生成する前にrespond_to?(:uuid)をチェック
  before_validation -> { self.uuid = SecureRandom.uuid }, on: :create, if: -> { respond_to?(:uuid) }
  before_validation :nullify_date_if_past
  before_validation :set_title
  after_validation :check_date, on: :create, if: -> { errors.empty? && !skip_check_date_callback }
  after_commit :check_and_build_project_embeddings, on: :create
  # NOTE: とりあえず25件ずつページネーション
  paginates_per 25

  scope :visible, -> { where(hidden_at: nil) }
  scope :hidden, -> { where.not(hidden_at: nil) }
  scope :open, -> {
    today = Time.zone.today

    # application_document_deadline_dateがある場合はそれを使用
    application_deadline_query = where(application_document_deadline_date: today..)

    # application_document_deadline_dateがnilの場合のみproposal_document_deadline_dateで判定
    proposal_deadline_query = where(application_document_deadline_date: nil)
      .where(proposal_document_deadline_date: today..)

    # application_document_deadline_dateがnilかつproposal_document_deadline_dateがnilの場合のみbidding_deadline_dateで判定
    bidding_deadline_query = where(application_document_deadline_date: nil)
      .where(proposal_document_deadline_date: nil)
      .where(bidding_deadline_date: today..)

    application_deadline_query
      .or(proposal_deadline_query)
      .or(bidding_deadline_query)
  }
  scope :for_company, ->(company_id) {
    return where(company_project_id: nil) if company_id.blank?

    base = left_outer_joins(:company_project)
    base.where(company_project_id: nil)
      .or(base.where(company_projects: { company_id: company_id }))
  }

  class << self
    # NOTE: 落札案件登録時に使用するkeyを生成
    # スクレイピング側でサイトごとにkeyを採番するようになったら削除する
    def build_key(title:, procedure_type:, city:, url:, lg_codes: [])
      codes = lg_codes.compact.sort
      values = [title, procedure_type, city, url, codes]
      Digest::SHA256.hexdigest(values.to_json)
    end

    def fetch_new_projects(search_filter_preset_notifications:, last_notified_at:)
      search_filter_preset_notifications.includes(:search_filter_preset).map do |notification|
        preset = notification.search_filter_preset
        projects = search_with_search_filter_preset(preset, last_notified_at).records
        [preset, projects]
      end.to_h
    end

    def fetch_new_recommendations(search_filter_preset_notifications:)
      search_filter_preset_notifications.includes(:search_filter_preset).filter_map do |notification|
        preset = notification.search_filter_preset
        next unless preset.recommended

        recommendations = recommendation_search(
          [ preset[:business_description_embedding]['embedding'] ],
          preset,
          [],
          size: 10,
          status: 'new',
        ).records

        [preset, recommendations]
      end.to_h
    end
  end

  def update_with(args)
    ActiveRecord::Base.transaction do
      project_params = {}

      project_params[:title] = args[:title] if args.key?(:title)
      project_params[:raw_title] = nil if args.key?(:title) # titleが更新された場合はraw_titleを削除
      project_params[:procedure_type] = args[:procedure_type] if args.key?(:procedure_type)
      project_params[:procedure_type_group] = self.class.determine_procedure_type_group(args[:procedure_type]) if args.key?(:procedure_type)
      project_params[:source] = args[:source] if args.key?(:source)
      project_params[:organization_name] = args[:organization_name] if args.key?(:organization_name)
      project_params[:publication_date] = args[:publication_date] if args.key?(:publication_date)
      project_params[:briefing_session_date] = args[:briefing_session_date] if args.key?(:briefing_session_date)
      project_params[:application_document_deadline_date] = args[:application_document_deadline_date] if args.key?(:application_document_deadline_date)
      project_params[:proposal_document_deadline_date] = args[:proposal_document_deadline_date] if args.key?(:proposal_document_deadline_date)
      project_params[:bidding_deadline_date] = args[:bidding_deadline_date] if args.key?(:bidding_deadline_date)
      project_params[:external_document_url] = args[:external_document_url] if args.key?(:external_document_url)
      project_params[:participation_qualification] = args[:participation_qualification] if args.key?(:participation_qualification)
      project_params[:planned_price] = args[:planned_price] if args.key?(:planned_price)
      project_params[:is_experience_required] = args[:is_experience_required] if args.key?(:is_experience_required)
      project_params[:is_office_required] = args[:is_office_required] if args.key?(:is_office_required)
      project_params[:summary] = args[:summary] if args.key?(:summary)
      self.update!(project_params)

      if args.key?(:prefectures)
        self.lg_codes.reload.destroy_all
        args[:prefectures].presence&.each do |prefecture|
          lg_code = LgCodeConverter.to_code(prefecture)
          self.lg_codes.create!(code: lg_code)
        end
      end

      if args.key?(:grades)
        self.project_grades.reload.destroy_all
        args[:grades].presence&.each do |grade|
          self.project_grades.create!(grade: grade)
        end
      end

      if args.key?(:project_security_qualifications)
        self.project_security_qualifications.reload.destroy_all
        args[:project_security_qualifications].presence&.each do |security_qualification|
          self.project_security_qualifications.create!(security_qualification: security_qualification)
        end
      end

      if args.key?(:participate_qualification_grade_ids)
        self.project_participate_qualification_grades.reload.destroy_all
        args[:participate_qualification_grade_ids].presence&.each do |grade_id|
          self.project_participate_qualification_grades.create!(participate_qualification_grade_id: grade_id)
        end
      end
    end

    true
  rescue => e
    Rails.logger.error(e.message)
    Sentry.capture_exception(e)
    false
  end

  def extract_and_attach_documents(project_doc_path)
    # 添付ファイルのattach
    project_doc_path.each_entry do |item|
      next if item.extname != '.zip'

      puts '### Start attach item' # rubocop:disable Rails/Output
      puts "#{item}" # rubocop:disable Rails/Output

      # zipの解凍
      unzip_path = project_doc_path.join('unzip')
      fpath = project_doc_path.join(item)
      exec_command = "/usr/bin/unar -o #{unzip_path} #{fpath}"
      `#{exec_command}`

      unzip_path.each_entry do |unzipItem|
        next if unzipItem.to_s == '.' || unzipItem.to_s == '..'

        unzip_item_path = unzip_path.join(unzipItem)
        if unzip_item_path.directory?
          # ディレクトリのときの処理
          unzip_item_path.each_entry do |unzipDirItem|
            unzip_dir_item_path = unzip_path.join(unzipItem).join(unzipDirItem)
            if unzip_dir_item_path.file?
              # ファイルのときの処理
              external_document = self.external_documents.build
              external_document.file.attach(io: File.open(unzip_dir_item_path.to_s), filename: unzipDirItem)
              external_document.save!
            end
          end
        elsif unzip_item_path.file?
          # ファイルのときの処理
          external_document = self.external_documents.build
          external_document.file.attach(io: File.open(unzip_item_path.to_s), filename: unzipItem)
          external_document.save!
        end
      end
    end

    FileUtils.rm_r(project_doc_path.to_s)
  end

  def download_and_attach_document(url = nil, filename = nil)
    return if url.blank?

    begin
      file = URI.parse(url).open
    rescue => e
      Rails.logger.error("Error: #{e.message}")
      Sentry.capture_exception(e)
      return
    end

    filename = filename || File.basename(url)
    external_document = self.external_documents.build
    external_document.file.attach(io: file, filename: filename)
    external_document.save!
  end

  def aggregate_external_document_texts
    self.external_documents.pluck(:text).join("\n")
  end

  def summarize_and_save_summary
    return if Rails.env.local?

    texts = self.aggregate_external_document_texts
    if texts.blank?
      return
    end

    begin
      result = LlmTextSummarizer.summarize(texts)
      summary_text = result[:summary]
      refines = result[:refines] || {}

      params = {
        summary: summary_text,
        grades: refines["grades"] || [],
        is_experience_required: %w[1 0].include?(refines["is_experience_required"].to_s) ? refines["is_experience_required"].to_i : nil,
        is_office_required: %w[1 0].include?(refines["is_office_required"].to_s) ? refines["is_office_required"].to_i : nil,
        project_security_qualifications: refines["project_security_qualifications"] || [],
      }

      if self.update_with(params)
        return summary_text
      else
        return :update_failed
      end
    rescue => e
      Rails.logger.error(e.message)
      Sentry.capture_exception(e)
      raise e
    end
  end

  def extract_participation_qualification_and_save
    return if Rails.env.local?

    # サマリが存在しない場合は抽出しない
    return if self.summary.blank?

    begin
      result = LlmParticipateQualificationGradeExtractor.extract(
        self.summary
      )

      if result[:participate_qualifications].empty?
        # 参加資格が抽出できなかった場合は何もしない
        return
      end

      # 参加資格、等級の組み合わせ生成
      raw_participate_qualification_grades = self.build_participation_qualification_grades_combinations(result)

      # 存在チェック & モデルを取得
      participate_qualification_grades = self.fetch_existing_participation_qualification_grades(raw_participate_qualification_grades)

      if participate_qualification_grades.empty?
        # チェックの結果、参加資格等級の組み合わせが0件なら何もしない
        return
      end

      params = {
        participate_qualification_grade_ids: participate_qualification_grades.map(&:id)
      }

      if self.update_with(params)
        return participate_qualification_grades
      else
        return :update_failed
      end
    rescue => e
      Rails.logger.error(e.message)
      Sentry.capture_exception(e)
      raise e
    end
  end

  def extract_keywords_and_save
    return if Rails.env.local?

    begin
      if self.summary.present?
        keywords = OpenaiChatService.new.extract_keywords(self.title, self.summary)
      else
        keywords = OpenaiChatService.new.extract_keywords(self.title, self.description)
      end

      if self.update(keywords: keywords)
        return keywords
      else
        return :update_failed
      end
    rescue => e
      Rails.logger.error(e.message)
      Sentry.capture_exception(e)
      raise e
    end
  end

  def all_documents_processed?
    self.external_documents.where(is_processed: false).none?
  end

  def check_and_build_project_embeddings
    return if self.external_documents.empty?

    self.build_project_embeddings if self.all_documents_processed?
  end

  def build_project_summary_embedding(text)
    return if text.nil?

    res = EmbeddingService.new.embeddings(text)
    if res.length != 0
      project_embedding = self.project_embeddings.build(embedding_type: 'project_summary_embeddings', raw_text: res[0][:raw_text], embedding: {embedding: res[0][:embedding]})
      project_embedding.save!
    end
  end

  def bid_pipeline_for_company(company)
    bid_pipelines.find_by(company_id: company.id)
  end

  private

  # NOTE: publication_dateより過去日だったらnilにする
  def nullify_date_if_past
    return if self.publication_date.blank?

    [
      :briefing_session_date,
      :application_document_deadline_date,
      :proposal_document_deadline_date,
      :bidding_deadline_date,
      :tender_opening_date,
      :delivery_deadline_date,
    ].each do |attribute_name|
      self[attribute_name] = nil if self[attribute_name].present? && self[attribute_name] < publication_date
    end
  end

  def set_title
    return if self.raw_title.blank?

    tmp_title = self.raw_title

    # 除去対象のフレーズを削除
    tmp_title = remove_phrase(tmp_title)

    # 先頭の【】で囲まれた文字列を削除
    # ただし、年度の後に文字列が続く場合は削除しない
    # 例: 【東京都】東京都港区の公告 → 東京都港区の公告
    # 例: 【】東京都港区の公告【2021年】 → 東京都港区の公告【2021年】
    # 例: 【令和3年度東京都】東京都港区の公告 → 【令和3年度東京都】東京都港区の公告
    without_brackets = tmp_title.gsub(/\A(?:【[^】]*年度】|【(?![^】]*年度)[^】]+】)\s*/, '')
    # 置換の結果が空文字の場合はスキップ
    tmp_title = without_brackets.presence || tmp_title

    self.title = tmp_title
  end

  def check_date
    all_dates_empty_flag = false
    publication_date_empty_flag = false
    only_publication_date_flag = false
    three_months_apart_flag = false

    # 公告日の値チェック
    if self.publication_date.nil?
      publication_date_empty_flag = true
    elsif self.publication_date.present?
      # 企業プロジェクト等で明示的に許可された場合は、未来日のチェックをスキップ
      unless allow_future_publication_date
        # 今日よりも未来日付が入らない
        today = Time.zone.today
        if self.publication_date > today
          publication_date_empty_flag = true
          self.publication_date = nil
        end
      end
    end

    # 参加期日の値チェック
    # 公告日より過去の日付が入らない
    if self.application_document_deadline_date.present? && self.publication_date.present? && self.application_document_deadline_date < self.publication_date
      self.application_document_deadline_date = nil
    end

    # 提案期日の値チェック
    # 参加期日より過去の日付が入らない
    if self.proposal_document_deadline_date.present? && self.application_document_deadline_date.present? && self.proposal_document_deadline_date < self.application_document_deadline_date
      self.proposal_document_deadline_date = nil
    end

    # 入札日の値チェック
    if self.bidding_deadline_date.present?
      if (
        (self.publication_date.present? && self.bidding_deadline_date < self.publication_date) ||
        (self.application_document_deadline_date.present? && self.bidding_deadline_date < self.application_document_deadline_date) ||
        (self.proposal_document_deadline_date.present? && self.bidding_deadline_date < self.proposal_document_deadline_date)
      )
        self.bidding_deadline_date = nil
      end
    end

    # slack に通知する
    all_dates_empty_notify_service = NotifySlackService.new(ENV["SLACK_WEBHOOK_URL_FOR_ALL_DATES_EMPTY"])
    publication_date_empty_notify_service = NotifySlackService.new(ENV["SLACK_WEBHOOK_URL_FOR_PUBLICATION_DATE_EMPTY"])
    only_publication_date_notify_service = NotifySlackService.new(ENV["SLACK_WEBHOOK_URL_FOR_ONLY_PUBLICATION_DATE"])
    three_months_apart_notify_service = NotifySlackService.new(ENV["SLACK_WEBHOOK_URL_FOR_THREE_MONTHS_APART"])

    # 日付にひとつも値がない場合
    if self.publication_date.nil? && self.application_document_deadline_date.nil? && self.proposal_document_deadline_date.nil? && self.bidding_deadline_date.nil?
      all_dates_empty_flag = true
    # 公告日しか登録がない場合
    elsif self.publication_date.present? && self.application_document_deadline_date.nil? && self.proposal_document_deadline_date.nil? && self.bidding_deadline_date.nil?
      only_publication_date_flag = true
    # いづれかの日付を起点に3ヵ月以上、未来or過去日付での登録がずれている期日がある場合
    elsif(
      (self.publication_date.present? && self.application_document_deadline_date.present? && (self.publication_date - self.application_document_deadline_date).abs > 90) ||
      (self.publication_date.present? && self.proposal_document_deadline_date.present? && (self.publication_date - self.proposal_document_deadline_date).abs > 90) ||
      (self.publication_date.present? && self.bidding_deadline_date.present? && (self.publication_date - self.bidding_deadline_date).abs > 90) ||
      (self.application_document_deadline_date.present? && self.proposal_document_deadline_date.present? && (self.application_document_deadline_date - self.proposal_document_deadline_date).abs > 90) ||
      (self.application_document_deadline_date.present? && self.bidding_deadline_date.present? && (self.application_document_deadline_date - self.bidding_deadline_date).abs > 90) ||
      (self.proposal_document_deadline_date.present? && self.bidding_deadline_date.present? && (self.proposal_document_deadline_date - self.bidding_deadline_date).abs > 90)
    )
      three_months_apart_flag = true
    end

    if all_dates_empty_flag
      message = "
タイトル: #{self.title}\n
自治体名: #{self.organization_name}\n
公告日: #{self.publication_date}\n
参加期日: #{self.application_document_deadline_date}\n
提案期日: #{self.proposal_document_deadline_date}\n
入札日: #{self.bidding_deadline_date}\n
通知内容:\n  - 日付にひとつも値がありません\n
管理画面URL: https://admin.labid.jp/project/edit/#{self.uuid}\n
案件URL: #{self.external_document_url}
"
      all_dates_empty_notify_service.send_message(message)
    elsif publication_date_empty_flag
      message = "
タイトル: #{self.title}\n
自治体名: #{self.organization_name}\n
公告日: #{self.publication_date}\n
参加期日: #{self.application_document_deadline_date}\n
提案期日: #{self.proposal_document_deadline_date}\n
入札日: #{self.bidding_deadline_date}\n
通知内容:\n  - 公告日が空です\n
管理画面URL: https://admin.labid.jp/project/edit/#{self.uuid}\n
案件URL: #{self.external_document_url}
"
      publication_date_empty_notify_service.send_message(message)
    elsif only_publication_date_flag
      message = "
タイトル: #{self.title}\n
自治体名: #{self.organization_name}\n
公告日: #{self.publication_date}\n
参加期日: #{self.application_document_deadline_date}\n
提案期日: #{self.proposal_document_deadline_date}\n
入札日: #{self.bidding_deadline_date}\n
通知内容:\n  - 公告日しか登録されていません\n
管理画面URL: https://admin.labid.jp/project/edit/#{self.uuid}\n
案件URL: #{self.external_document_url}
"
      only_publication_date_notify_service.send_message(message)
    elsif three_months_apart_flag
      message = "
タイトル: #{self.title}\n
自治体名: #{self.organization_name}\n
公告日: #{self.publication_date}\n
参加期日: #{self.application_document_deadline_date}\n
提案期日: #{self.proposal_document_deadline_date}\n
入札日: #{self.bidding_deadline_date}\n
通知内容:\n  - いづれかの日付を起点に3ヵ月以上ずれている期日があります\n
管理画面URL: https://admin.labid.jp/project/edit/#{self.uuid}\n
案件URL: #{self.external_document_url}
"
      three_months_apart_notify_service.send_message(message)
    end
  end

  def build_project_embeddings
    return if Rails.env.test?

    texts = self.aggregate_external_document_texts
    if texts.blank?
      texts = "title: #{self.title} description: #{self.description}"
    end

    results = EmbeddingService.new.embeddings(texts)
    results.presence&.each do |r|
      project_embedding = self.project_embeddings.build(raw_text: r[:raw_text], embedding: {embedding: r[:embedding]})
      project_embedding.save!
    end
  end

  def build_participation_qualification_grades_combinations(llm_output)
    res = []

    llm_output[:participate_qualifications].each do |qualification|
      if llm_output[:grades].empty?
        # 等級が抽出できなかった場合は、等級が'等級指定なし'の参加資格を保存
        # 例: { participate_qualification: "○○県入札参加資格", grade: "等級指定なし" }
        res << {
          participate_qualification: qualification,
          grade: "等級指定なし"
        }

        next
      end

      llm_output[:grades].each do |grade|
        res << {
          participate_qualification: qualification,
          grade: grade
        }
      end
    end

    return res
  end

  def fetch_existing_participation_qualification_grades(combinations)
    participate_qualification_grades = []
    notify_combinations = []

    combinations.each do |c|
      participate_qualification = nil

      participate_qualifications = ParticipateQualification.where(name: c[:participate_qualification])
      if participate_qualifications.empty?
        notify_combinations << c
        next
      end

      if participate_qualifications.length > 1
        # 同じ名前の参加資格が複数存在する場合は、都道府県名で絞り込む
        participate_qualifications.each do |pq|
          self.lg_codes.each do |lg_code|
            if pq.lg_code == lg_code.code
              participate_qualification = pq
              break
            end
          end
        end
      elsif participate_qualifications.length == 1
        participate_qualification = participate_qualifications.first
      end

      participate_qualification_grade = ParticipateQualificationGrade.find_by(
        participate_qualification: participate_qualification,
        name: c[:grade]
      )
      if participate_qualification_grade.nil?
        notify_combinations << c
        next
      end

      participate_qualification_grades << participate_qualification_grade
    end

    if notify_combinations.length > 0
      notify_not_exist_participation_qualifications(notify_combinations)
    end

    participate_qualification_grades
  end

  def notify_not_exist_participation_qualifications(combinations)
    notify_qualification_str = combinations.map { |c| "  参加資格: #{c[:participate_qualification]} 等級: #{c[:grade]}" }.join("\n")

    # 参加資格が存在しない場合は、Slack/Discordに通知する
    message = "
タイトル: #{self.title}\n
自治体名: #{self.organization_name}\n
参加資格等級:\n
#{notify_qualification_str}\n
案件URL: #{ENV['FRONTEND_BASE_URL']}/projects/#{self.uuid}\n
管理画面URL: https://admin.labid.jp/project/edit/#{self.uuid}\n
案件URL: #{self.external_document_url}
"

    # Slackに通知
    NotifySlackService.new(ENV["SLACK_WEBHOOK_URL_FOR_NOT_EXIST_PARTICIPATION_QUALIFICATION"]).send_message(message)
  end
end
