# == Schema Information
#
# Table name: companies
# Database name: primary
#
#  id                               :bigint           not null, primary key
#  is_trial(トライアル契約かどうか) :boolean          default(FALSE), not null
#  name(企業名)                     :string(255)      not null
#  plan_name(プラン名)              :string(255)      default("Standard"), not null
#  created_at                       :datetime         not null
#  updated_at                       :datetime         not null
#
class Company < ApplicationRecord
  has_many :users, dependent: :restrict_with_exception
  has_many :favorites, through: :users
  has_many :favorite_projects, through: :favorites, source: :project
  has_many :search_filter_presets, through: :users
  has_many :project_summary_usages, dependent: :destroy
  has_many :subscriptions, dependent: :destroy
  has_many :business_description_formats, dependent: :destroy
  has_many :bid_pipelines, dependent: :destroy
  has_many :bid_pipeline_statuses, dependent: :delete_all
  has_many :bid_pipeline_task_statuses, dependent: :destroy
  has_many :proposal_templates, dependent: :destroy
  has_many :proposal_jobs, dependent: :destroy
  has_many :proposal_documents, dependent: :destroy
  has_many :custom_object_templates, dependent: :destroy
  has_many :offices, dependent: :destroy
  has_many :company_attachments, dependent: :destroy
  has_many :company_features, dependent: :destroy
  has_many :features, through: :company_features
  has_many :company_security_qualifications, dependent: :destroy
  has_many :security_qualifications, through: :company_security_qualifications
  has_many :company_participate_qualifications, dependent: :destroy
  has_many :participate_qualifications, through: :company_participate_qualifications

  has_one :company_information, dependent: :destroy
  has_one :company_functional_limitation, dependent: :destroy

  validates :name, presence: true
  validates :plan_name, presence: true
  validates :is_trial, inclusion: { in: [true, false] }
  after_create :create_limitation
  after_create :initialize_bid_pipeline_statuses
  after_create :initialize_bid_pipeline_task_statuses

  generates_token_for :invitation, expires_in: 1.day

  def subscription_active?
    subscriptions.active.exists?
  end

  def has_feature?(feature_key)
    features.exists?(key: feature_key)
  end


  private

  def create_limitation
    self.create_company_functional_limitation!
  end

  def initialize_bid_pipeline_statuses
    return if Rails.env.test?

    init_statuses = [
      { stage: 'done', name: '不参加' },
      { stage: 'done', name: '失注', is_uneditable: true },
      { stage: 'done', name: '落札', is_uneditable: true },
      { stage: 'doing', name: '入札参加' },
      { stage: 'doing', name: '検討中' },
    ]

    init_statuses.each do |status|
      self.bid_pipeline_statuses.create!(status)
    end
  end

  def initialize_bid_pipeline_task_statuses
    return if Rails.env.test?

    init_statuses = [
      { stage: 'todo', name: '予定', is_default: true },
      { stage: 'doing', name: '対応中' },
      { stage: 'done', name: '完了' }
    ]

    init_statuses.each do |status|
      self.bid_pipeline_task_statuses.create!(status)
    end
  end


  class << self
    def build_from(args)
      company_params = {
        name: args[:name],
      }

      company_params[:plan_name] = args[:plan_name] if args[:plan_name].present?
      company_params[:is_trial] = args[:is_trial] if args[:is_trial].present?

      company = Company.new(company_params)
      company
    end
  end
end
