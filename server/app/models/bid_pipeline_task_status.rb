# == Schema Information
#
# Table name: bid_pipeline_task_statuses
# Database name: primary
#
#  id                                 :bigint           not null, primary key
#  is_default(デフォルトフラグ)       :boolean          default(FALSE), not null
#  name(ステータス名)                 :string(255)      not null
#  order(表示順)                      :integer          default(0), not null
#  stage(ステージ(todo, doing, done)) :string(255)      default("todo"), not null
#  created_at                         :datetime         not null
#  updated_at                         :datetime         not null
#  company_id(企業ID)                 :bigint           not null
#
# Indexes
#
#  index_bid_pipeline_task_statuses_on_company_id            (company_id)
#  index_bid_pipeline_task_statuses_on_company_id_and_name   (company_id,name) UNIQUE
#  index_bid_pipeline_task_statuses_on_company_id_and_order  (company_id,order) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
require 'positioning'

class BidPipelineTaskStatus < ApplicationRecord
  belongs_to :company
  has_many :bid_pipeline_tasks, dependent: :restrict_with_error

  before_validation :set_is_default, on: :create, if: -> { company.present? }
  validates :name, presence: true, uniqueness: { scope: :company_id }
  validates :stage, presence: true

  after_save :disable_other_is_defaults, if: :saved_change_to_is_default?

  enum :stage, { todo: 'todo', doing: 'doing', done: 'done' }

  positioned on: :company, column: :order

  private

  def set_is_default
    if company.bid_pipeline_task_statuses.empty?
      self.is_default = true
    end
  end

  def disable_other_is_defaults
    if is_default
      company.bid_pipeline_task_statuses.where.not(id: id).find_each do |status|
        status.update(is_default: false)
      end
    end
  end
end
