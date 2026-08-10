# == Schema Information
#
# Table name: search_filter_presets
# Database name: primary
#
#  id                                                     :bigint           not null, primary key
#  business_description(事業情報)                         :text(4294967295)
#  business_description_embedding(事業情報の埋め込み情報) :json
#  json_attributes(検索条件)                              :json             not null
#  notification_required(配信要否)                        :boolean          default(TRUE), not null
#  project_type(プロジェクト種別)                         :string(255)      default("Project"), not null
#  recommended(おすすめ条件フラグ)                        :boolean          default(FALSE), not null
#  title(検索条件名)                                      :string(255)
#  created_at                                             :datetime
#  updated_at                                             :datetime
#  user_id(ユーザーID)                                    :bigint           not null
#
# Indexes
#
#  index_search_filter_presets_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
class SearchFilterPreset < ApplicationRecord
  include AttrJson::Record

  attr_accessor :notification_required

  has_many :search_filter_preset_notifications, dependent: :destroy
  has_many :business_description_favorite_projects, dependent: :destroy
  belongs_to :user

  before_validation do
    self.title = nil if self.title.blank?
  end
  before_validation :get_embedding

  validate :any_condition_required
  validate :check_limitation
  validates :period, inclusion: { in: %w[1week 1month 3months] }, allow_nil: true

  attr_json :keywords, :string, array: true
  attr_json :or_keywords, :string, array: true
  attr_json :not_keywords, :string, array: true
  attr_json :prefectures, :integer, array: true
  attr_json :organizations, :string, array: true
  attr_json :procedure_types, :string, array: true
  attr_json :procedure_type_groups, :string, array: true
  attr_json :period, :string
  attr_json :publication_date_from, :date
  attr_json :publication_date_to, :date
  attr_json :planned_price_from, :integer
  attr_json :planned_price_to, :integer
  attr_json :is_experience_required, :boolean
  attr_json :is_office_required, :boolean
  attr_json :project_security_qualifications, :string, array: true
  attr_json :deadline_days_remaining, :integer
  attr_json :participate_qualification_ids, :integer, array: true
  attr_json :participate_qualification_grade_ids, :integer, array: true
  attr_json :participate_qualification_types, :string, array: true
  attr_json :participate_qualification_prefectures, :string, array: true
  attr_json :no_qualification, :boolean
  attr_json :tender_opening_date_from, :date
  attr_json :tender_opening_date_to, :date
  attr_json :use_synonym_search, :boolean

  def clear_and_update(args)
    self.json_attributes = {}
    self.update(args)
  end

  def as_text
    text = []
    text << "★タイトル: #{title}★" if title.present?
    text << "キーワード: #{keywords.join(', ')}" if keywords.present?
    text << "ORキーワード: #{or_keywords.join(', ')}" if or_keywords.present?
    text << "除外キーワード: #{not_keywords.join(', ')}" if not_keywords.present?
    text << "類義語検索: #{use_synonym_search ? 'あり' : 'なし'}" if !use_synonym_search.nil?
    prefectures = self.prefectures&.map { |code| LgCodeConverter.to_name(format("%02d", code)) }
    text << "都道府県: #{prefectures.join(', ')}" if prefectures.present?
    text << "発注機関: #{organizations.join(', ')}" if organizations.present?
    text << "入札方式: #{procedure_type_groups.join(', ')}" if procedure_type_groups.present?
    text << "期間: #{period}" if period.present?
    text << "公告日: #{publication_date_from} 〜 #{publication_date_to}" if [publication_date_from, publication_date_to].any?(&:present?)
    text << "予定価格: #{planned_price_from} 〜 #{planned_price_to}" if [planned_price_from, planned_price_to].any?(&:present?)
    text << "実績有無条件: #{is_experience_required ? 'あり' : 'なし'}" if is_experience_required.present?
    text << "締切日: #{deadline_days_remaining}日以上先" if deadline_days_remaining.present?
    text << "参加資格ID: #{participate_qualification_ids.join(', ')}" if participate_qualification_ids.present?
    text << "参加資格等級ID: #{participate_qualification_grade_ids.join(', ')}" if participate_qualification_grade_ids.present?
    text << "参加資格種別: #{participate_qualification_types.join(', ')}" if participate_qualification_types.present?
    text << "参加資格なし: #{no_qualification ? 'あり' : 'なし'}" if !no_qualification.nil?
    # 参加資格の都道府県を都道府県名に変換して表示
    pq_prefectures = participate_qualification_prefectures&.map { |code| LgCodeConverter.to_name(format("%02d", code.to_i)) }
    text << "参加資格都道府県: #{pq_prefectures.join(', ')}" if pq_prefectures.present?
    text << "落札日: #{tender_opening_date_from} 〜 #{tender_opening_date_to}" if [tender_opening_date_from, tender_opening_date_to].any?(&:present?)
    text.join("\n")
  end

  def as_query
    query_params = {
      keywords: keywords&.join(' '),
      orKeywords: or_keywords&.join(' '),
      notKeywords: not_keywords&.join(' '),
      prefectures: prefectures&.join(' '),
      organizations: organizations&.join(' '),
      procedureTypes: procedure_types&.join(' '),
      procedureTypeGroups: procedure_type_groups&.join(' '),
      period: period,
      publicationDateFrom: publication_date_from,
      publicationDateTo: publication_date_to,
      plannedPriceFrom: planned_price_from,
      plannedPriceTo: planned_price_to,
      isExperienceRequired: is_experience_required,
      deadlineDaysRemaining: deadline_days_remaining,
      participateQualificationIds: participate_qualification_ids&.join(' '),
      participateQualificationGradeIds: participate_qualification_grade_ids&.join(' '),
      participateQualificationTypes: participate_qualification_types&.join(' '),
      participateQualificationPrefectures: participate_qualification_prefectures&.join(' '),
      noQualification: no_qualification,
      tenderOpeningDateFrom: tender_opening_date_from,
      tenderOpeningDateTo: tender_opening_date_to,
    }.compact_blank

    # use_synonym_searchはnilでない場合のみ追加（falseも含む）
    query_params[:useSynonymSearch] = use_synonym_search unless use_synonym_search.nil?

    query_params.to_query
  end

  def link_favorite_projects
    owner = self.user.company || self.user
    favorite_project_ids = owner.favorites.pluck(:project_id)

    results = Project.for_company(self.user.company_id).get_favorite_projects_linked_to_business_description(
      self.business_description,
      favorite_project_ids,
    )

    linked_project_ids = results.records.ids
    exists_linked_project_ids = BusinessDescriptionFavoriteProject.where(search_filter_preset_id: self.id).pluck(:project_id)

    return if linked_project_ids.sort == exists_linked_project_ids.sort

    ActiveRecord::Base.transaction do
      BusinessDescriptionFavoriteProject.where(search_filter_preset_id: self.id).destroy_all

      linked_project_ids.each do |project_id|
        BusinessDescriptionFavoriteProject.create!(
          search_filter_preset_id: self.id,
          project_id: project_id,
        )
      end
    end
  end

  private

  def any_condition_required
    return if self.class.attr_json_registry.attribute_names.any? do |name|
      self.send(name).present?
    end

    errors.add(:base, :any_condition_required)
  end

  def get_embedding
    return if self.business_description.blank?

    res = EmbeddingService.new.embeddings(self.business_description)

    self.business_description_embedding = {
      embedding: res.length == 0 ? nil : res[0][:embedding],
    }
  end

  def check_limitation
    return if !self.recommended

    # TODO: LABID-613が完了したらデフォルト値を削除
    limit = self.user.company&.company_functional_limitation&.max_recommendation_count || CompanyFunctionalLimitation::DEFAULT_MAX_RECOMMENDATION_COUNT

    owner = self.user.company || self.user
    current_count = owner.search_filter_presets.where(recommended: true)
    current_count = current_count.where.not(id: self.id) if self.persisted?

    return if current_count.count < limit

    errors.add(:base, :check_limitation)
  end
end
