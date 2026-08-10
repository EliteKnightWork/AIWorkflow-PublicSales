# == Schema Information
#
# Table name: features
# Database name: primary
#
#  id                    :bigint           not null, primary key
#  description(機能説明) :text(4294967295)
#  key(機能識別キー)     :string(255)      not null
#
class Feature < ApplicationRecord
  KEYS = {
    ai_chat: 'ai_chat',
    proposal_document_create: 'proposal_document_create',
  }.freeze
  
  enum :key, KEYS
end
