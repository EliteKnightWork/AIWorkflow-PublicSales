# == Schema Information
#
# Table name: bid_pipeline_statuses
# Database name: primary
#
#  id                            :bigint           not null, primary key
#  is_uneditable(編集不可フラグ) :boolean          default(FALSE), not null
#  name(ステータス名)            :string(255)      not null
#  order(表示順)                 :integer          default(0), not null
#  stage(ステージ(doing, done))  :string(255)      default("doing"), not null
#  created_at                    :datetime         not null
#  updated_at                    :datetime         not null
#  company_id(企業ID)            :bigint           not null
#
# Indexes
#
#  index_bid_pipeline_statuses_on_company_id                      (company_id)
#  index_bid_pipeline_statuses_on_company_id_and_name             (company_id,name) UNIQUE
#  index_bid_pipeline_statuses_on_company_id_and_stage_and_order  (company_id,stage,order) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
require 'positioning'

class BidPipelineStatus < ApplicationRecord
  belongs_to :company
  has_many :bid_pipelines, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: { scope: :company_id }
  validates :stage, presence: true
  validate :check_editable, on: :update
  validate :check_stage_not_changed, on: :update

  before_destroy :check_destroyable

  enum :stage, {
    doing: 'doing',
    done: 'done',
  }

  positioned on: [:company, :stage], column: :order

  private

  def check_editable
    if !is_uneditable
      return
    end

    # 編集不可フラグが立っている場合、name, stageの変更は許可しない
    if will_save_change_to_name? || will_save_change_to_stage?
      errors.add(:is_uneditable, '編集不可のステータスは編集できません')
    end
  end

  def check_stage_not_changed
    if will_save_change_to_stage?
      errors.add(:stage, 'ステージは変更できません')
    end
  end

  def check_destroyable
    if is_uneditable
      errors.add(:is_uneditable, '編集不可のステータスは削除できません')
      throw(:abort)
    end
  end
end
