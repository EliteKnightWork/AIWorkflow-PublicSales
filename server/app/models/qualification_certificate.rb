# == Schema Information
#
# Table name: qualification_certificates
# Database name: primary
#
#  id                                :bigint           not null, primary key
#  attachable_type                   :string(255)      not null
#  created_at                        :datetime         not null
#  updated_at                        :datetime         not null
#  attachable_id(資格証明書の添付先) :bigint           not null
#
# Indexes
#
#  idx_on_attachable_type_attachable_id_ece23385b9  (attachable_type,attachable_id)
#
class QualificationCertificate < ApplicationRecord
  include FileNameValidatable

  belongs_to :attachable, polymorphic: true
  has_one_attached :file
end
