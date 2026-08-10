# == Schema Information
#
# Table name: business_description_formats
# Database name: primary
#
#  id                                :bigint           not null, primary key
#  description(事業情報テキスト)     :text(4294967295) not null
#  embedding(事業情報の埋め込み情報) :json
#  created_at                        :datetime         not null
#  updated_at                        :datetime         not null
#  company_id(企業ID)                :bigint           not null
#
# Indexes
#
#  index_business_description_formats_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
class BusinessDescriptionFormat < ApplicationRecord
  belongs_to :company

  validates :description, presence: true
  validate :check_limitation

  after_validation :get_embedding

  private

  def check_limitation
    # TODO: LABID-613が完了したらデフォルト値を削除
    limit = self.company.company_functional_limitation&.max_business_description_format_count || 5
    return if self.company.business_description_formats.count < limit

    errors.add(:base, :check_limitation)
  end

  def get_embedding
    res = EmbeddingService.new.embeddings(self.description)

    self.embedding = {
      embedding: res.length == 0 ? nil : res[0][:embedding],
    }
  end
end
