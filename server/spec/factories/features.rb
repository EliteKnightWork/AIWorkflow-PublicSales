# == Schema Information
#
# Table name: features
# Database name: primary
#
#  id                    :bigint           not null, primary key
#  description(機能説明) :text(4294967295)
#  key(機能識別キー)     :string(255)      not null
#
FactoryBot.define do
  factory :feature do
    key { Feature::KEYS[:ai_chat] }
    description { 'AI chat feature' }

    initialize_with do
      Feature.find_or_create_by!(key:) do |feature|
        feature.description = description
      end
    end
  end
end
