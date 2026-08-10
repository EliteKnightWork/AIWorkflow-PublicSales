#
#
#
#
#
#
#
# == Schema Information
#
# Table name: proposal_templates
# Database name: primary
#
#  id                 :bigint           not null, primary key
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  company_id(企業ID) :bigint           not null
#
# Indexes
#
#  index_proposal_templates_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
class ProposalTemplate < ApplicationRecord
  include FileNameValidatable

  belongs_to :company
  has_one_attached :file

  validates :file, presence: true
  validate :acceptable_file_format

  ALLOWED_CONTENT_TYPES = [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', # .pptx
    'application/vnd.ms-powerpoint',            # .ppt
  ].freeze

  ALLOWED_EXTENSIONS = %w[.ppt .pptx].freeze

  private

  def acceptable_file_format
    return unless file.attached?

    extension = File.extname(file.filename.to_s).downcase
    unless ALLOWED_EXTENSIONS.include?(extension)
      errors.add(:file, 'はPowerPointファイル（.ppt, .pptx）のみ許可されています')
      return
    end

    if file.content_type.present? && ALLOWED_CONTENT_TYPES.exclude?(file.content_type)
      errors.add(:file, 'はPowerPointファイル（.ppt, .pptx）のみ許可されています')
    end
  end
end
