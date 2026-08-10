# == Schema Information
#
# Table name: custom_object_templates
# Database name: primary
#
#  id                          :bigint           not null, primary key
#  title(テンプレートタイトル) :string(255)      not null
#  created_at                  :datetime         not null
#  updated_at                  :datetime         not null
#  company_id(カンパニーID)    :bigint           not null
#
# Indexes
#
#  index_custom_object_templates_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
class CustomObjectTemplate < ApplicationRecord
  belongs_to :company
  has_many :custom_objects, dependent: :destroy
  has_many :custom_object_template_items, dependent: :destroy
  has_many :custom_object_template_item_values, through: :custom_object_template_items

  validates :title, presence: true
  validate :must_have_at_least_one_item, on: :update

  after_create :create_custom_objects_for_existing_pipelines

  private

  def create_custom_objects_for_existing_pipelines
    # 既存の案件管理(= BidPipeline)に対して、この新規テンプレートに紐づくカスタムオブジェクトを作成
    company.bid_pipelines.find_each do |pipeline|
      CustomObject.create!(custom_object_template: self, bid_pipeline: pipeline)
    end
  end

  def must_have_at_least_one_item
    return if custom_object_template_items.exists?

    errors.add(:base, 'カスタム項目は1件以上必要です')
  end
end
