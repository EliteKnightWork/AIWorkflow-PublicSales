# == Schema Information
#
# Table name: date_extraction_logs
# Database name: primary
#
#  id                                                   :bigint           not null, primary key
#  application_document_deadline_date(応募書類提出期日) :date
#  bidding_deadline_date(入札日)                        :date
#  briefing_session_date(入札説明会日)                  :date
#  delivery_deadline_date(納入期限日)                   :date
#  description(公告文)                                  :text(4294967295) not null
#  description_digest(公告文のダイジェスト)             :string(255)      not null
#  proposal_document_deadline_date(提案書類提出期日)    :date
#  publication_date(公告日)                             :date
#  tender_opening_date(開札日)                          :date
#  created_at                                           :datetime         not null
#  updated_at                                           :datetime         not null
#  project_id(公告情報ID)                               :bigint           not null
#
# Indexes
#
#  index_date_extraction_logs_on_description_digest  (description_digest)
#  index_date_extraction_logs_on_project_id          (project_id)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#
class DateExtractionLog < ApplicationRecord
  belongs_to :project
end
