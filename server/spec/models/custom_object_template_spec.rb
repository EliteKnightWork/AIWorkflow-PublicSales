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
require 'rails_helper'

RSpec.describe CustomObjectTemplate, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:company) }
    it { is_expected.to have_many(:custom_objects).dependent(:destroy) }
    it { is_expected.to have_many(:custom_object_template_items).dependent(:destroy) }
    it { is_expected.to have_many(:custom_object_template_item_values).through(:custom_object_template_items) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:title) }

    context 'when removing all associated items' do
      let!(:template) { create(:custom_object_template) }

      before do
        create(:custom_object_template_item, custom_object_template: template)
        template.custom_object_template_items.destroy_all
        template.reload
      end

      it 'is not valid on update' do
        expect(template).not_to be_valid
        expect(template.errors.full_messages).to include('カスタム項目は1件以上必要です')
      end
    end
  end
end
