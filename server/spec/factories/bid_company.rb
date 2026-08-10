# == Schema Information
#
# Table name: bid_companies
#
#  id           :bigint           not null, primary key
#  name(企業名) :string(255)      not null
#
FactoryBot.define do
  factory :bid_company do
    name { Faker::Company.unique.name }
  end
end
