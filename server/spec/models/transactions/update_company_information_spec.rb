require 'rails_helper'

RSpec.describe Transactions::UpdateCompanyInformation do
  describe '#exec' do
    subject(:exec_transaction) { transaction.exec }

    let(:company) { create(:company) }
    let(:transaction) do
      described_class.new(
        params,
        company
      )
    end
    let(:params) {
      ActionController::Parameters.new(
        {
          company_information: company_params.merge(company_information_params),
          offices: offices_params,
          attachments: attachments_params
        }
      )
    }
    let(:company_params) { { name: Faker::Company.name } }
    let(:company_information_params) do
      {
        corporate_number: Faker::Company.ein,
        postal_code: Faker::Address.postcode,
        address: Faker::Address.street_address,
        director: Faker::Name.name,
        tel_num: Faker::PhoneNumber.phone_number,
        fax_num: Faker::PhoneNumber.phone_number,
        capital: Faker::Number.number(digits: 7),
        employees_num: Faker::Number.number(digits: 2),
        industry_type: Faker::Company.industry,
        business_description: Faker::Company.bs,
        sales: Faker::Number.number(digits: 7),
        established_at: Faker::Date.between(from: 1.year.ago, to: Time.zone.today)
      }
    end
    let(:offices_params) { { upsert: [], delete_ids: [] } }
    let(:attachments_params) { { upsert: [], delete_ids: [] } }

    context '正常な場合' do
      context 'company_information がない場合' do
        it '正常終了し会社情報が作成される' do
          expect(company.company_information).to be_nil

          expect(transaction.exec).to be true
          expect(transaction.errors).to be_empty
        end

        it '作成された会社情報が指定どおりに保存される' do
          expect(transaction.exec).to be true
          expect(transaction.errors).to be_empty

          company_information = company.company_information
          expect(company_information).to have_attributes(
            corporate_number: company_information_params[:corporate_number],
            postal_code: company_information_params[:postal_code],
            address: company_information_params[:address],
            director: company_information_params[:director],
            tel_num: company_information_params[:tel_num],
            fax_num: company_information_params[:fax_num],
            capital: company_information_params[:capital],
            employees_num: company_information_params[:employees_num],
            industry_type: company_information_params[:industry_type],
            business_description: company_information_params[:business_description],
            sales: company_information_params[:sales]
          )
          expect(company.name).to eq(company_params[:name])
          expect(company_information.established_at.to_date).to eq(company_information_params[:established_at].to_date)
        end
      end

      context 'company_information がある場合' do
        let!(:company_information) { create(:company_information, company: company) }
        let(:company_information_params) do
          {
            director: Faker::Name.name,
            tel_num: Faker::PhoneNumber.phone_number.to_s
          }
        end
        let(:company_params) { { name: Faker::Company.name } }

        it '既存の会社情報を更新する' do
          expect(transaction.exec).to be true
          expect(transaction.errors).to be_empty

          expect(company.reload.name).to eq(company_params[:name])
          expect(company_information.reload.director).to eq(company_information_params[:director])
          expect(company_information.reload.tel_num).to eq(company_information_params[:tel_num])
        end
      end

      context 'deleted_ids で指定した 事務所が削除されること' do
        before { create(:company_information, company: company) }

        let!(:office_to_delete) { create(:office, company: company) }
        let!(:office_to_keep) { create(:office, company: company) }
        let(:offices_params) do
          {
            upsert: [],
            delete_ids: [office_to_delete.id]
          }
        end

        it '指定した事務所のみ削除される' do
          expect(transaction.exec).to be true
          expect(transaction.errors).to be_empty

          expect(company.offices.pluck(:id)).to contain_exactly(office_to_keep.id)
        end
      end

      context 'deleted_ids で指定した 添付資料が削除されること' do
        before { create(:company_information, company: company) }

        let!(:attachment_to_delete) { create(:company_attachment, company: company) }
        let!(:attachment_to_keep) { create(:company_attachment, company: company) }
        let(:attachments_params) do
          {
            upsert: [],
            delete_ids: [attachment_to_delete.id]
          }
        end

        it '指定した添付資料のみ削除される' do
          expect(transaction.exec).to be true
          expect(transaction.errors).to be_empty

          expect(company.reload.company_attachments.pluck(:id)).to contain_exactly(attachment_to_keep.id)
        end
      end

      context 'upsert で指定した事務所が作成、更新されること' do
        before { create(:company_information, company: company) }

        let(:offices_params) do
          {
            upsert: [
              updated_office_attributes,
            ],
            delete_ids: []
          }
        end
        
        context '事務所が既存の場合' do
          let!(:existing_office) { create(:office, company: company) }
          let(:updated_office_attributes) do
            {
              id: existing_office.id,
              name: Faker::Company.name,
              address: Faker::Address.full_address
            }
          end

          it '指定どおりに更新される' do
            expect(transaction.exec).to be true
            expect(transaction.errors).to be_empty

            expect(existing_office.reload.name).to eq(updated_office_attributes[:name])
            expect(existing_office.reload.address).to eq(updated_office_attributes[:address])
          end
        end

        context '事務所が新規の場合' do
          let(:updated_office_attributes) do
            {
              name: Faker::Company.name,
              address: Faker::Address.full_address
            }
          end

          it '指定どおりに作成される' do
            expect(transaction.exec).to be true
            expect(transaction.errors).to be_empty

            expect(company.reload.offices.pluck(:name)).to include(updated_office_attributes[:name])
          end
        end
      end

      context 'upsert で指定した添付資料が作成、更新されること' do
        before { create(:company_information, company: company) }

        let(:attachments_params) do
          {
            upsert: [
              updated_attachment_attributes,
            ],
            delete_ids: []
          }
        end
        let(:file) { fixture_file_upload("spec/fixtures/dummy.pdf", 'application/pdf') }
        
        context '添付資料が既存の場合' do
          let!(:existing_attachment) { create(:company_attachment, company: company) }
          let(:updated_attachment_attributes) do
            {
              id: existing_attachment.id,
              file_type: :certificate_of_registered_matters
            }
          end

          it '指定どおりに更新される' do
            expect(transaction.exec).to be true
            expect(transaction.errors).to be_empty

            expect(existing_attachment.reload.file_type.to_s).to eq(updated_attachment_attributes[:file_type].to_s)
          end
        end

        context '添付資料が新規の場合' do
          let(:updated_attachment_attributes) do
            {
              file_type: :certificate_of_registered_matters,
              file: file
            }
          end

          it '指定どおりに作成される' do
            expect(transaction.exec).to be true
            expect(transaction.errors).to be_empty

            expect(company.reload.company_attachments.pluck(:file_type)).to include(updated_attachment_attributes[:file_type].to_s)
            expect(company.reload.company_attachments[0].file.filename.to_s).to eq('dummy.pdf')
          end
        end
      end
    end

    context '異常な場合' do
      before { create(:company_information, company: company) }

      context '会社情報のバリデーションエラーが発生した場合' do
        let!(:existing_office) { create(:office, company: company) }
        let!(:existing_attachment) { create(:company_attachment, company: company) }
        let(:company_params) { { name: Faker::Company.name } }
        let(:company_information_params) do
          {
            corporate_number: Faker::Number.number(digits: 13).to_s,
            postal_code: Faker::Number.number(digits: 3).to_s + '-' + Faker::Number.number(digits: 4).to_s,
            address: Faker::Address.full_address,
            director: Faker::Name.name,
            tel_num: Faker::PhoneNumber.phone_number.to_s,
            fax_num: Faker::PhoneNumber.phone_number.to_s,
            capital: Faker::Number.between(from: 1_000_000, to: 100_000_000),
            employees_num: Faker::Number.between(from: 1, to: 1000),
            industry_type: Faker::Alphanumeric.alpha(number: 10),
            business_description: Faker::Lorem.paragraph,
            sales: Faker::Number.between(from: 1_000_000, to: 100_000_000),
            established_at: 1.day.from_now # 未来の日付でバリデーションエラー
          }
        end
        let(:offices_params) do
          {
            upsert: [
              {
                id: existing_office.id,
                name: Faker::Company.name,
                address: existing_office.address
              }
            ],
            delete_ids: []
          }
        end
        let(:attachments_params) do
          {
            upsert: [
              {
                id: existing_attachment.id,
                file_type: :certificate_of_registered_matters
              }
            ],
            delete_ids: []
          }
        end

        it '会社情報のすべての変更がロールバックされること' do
          original_company_name = company.name

          expect(transaction.exec).to be false
          expect(transaction.errors).to be_present

          expect(company.reload.name).to eq(original_company_name)
          expect(company.company_information.corporate_number).not_to eq(company_information_params[:corporate_number])
          expect(company.company_information.postal_code).not_to eq(company_information_params[:postal_code])
        end

        it '事業所、添付資料が更新されていないことを確認' do
          original_office_name = existing_office.name
          original_attachment_file_type = existing_attachment.file_type

          expect(transaction.exec).to be false
          expect(transaction.errors).to be_present

          expect(existing_office.reload.name).to eq(original_office_name)
          expect(existing_attachment.reload.file_type).to eq(original_attachment_file_type.to_s)
        end
      end

      context '存在しない事業所IDで更新しようとした場合' do
        before { create_list(:office, 5, company: company) }

        let(:company_information_params) do
          {
            director: Faker::Name.name
          }
        end
        let(:offices_params) do
          {
            upsert: [
              {
                id: Office.last.id + 1, # 存在しないID
                name: Faker::Company.name,
                address: Faker::Address.full_address
              }
            ],
            delete_ids: [Office.last.id]
          }
        end

        it 'エラーが発生し、会社情報の変更もロールバックされること' do
          original_director = company.company_information.director
          expect(company.offices.count).to eq(5)

          expect(transaction.exec).to be false
          expect(transaction.errors).to include('not found')

          expect(company.reload.company_information.director).to eq(original_director)
          expect(company.offices.count).to eq(5)
        end
      end

      context '存在しない添付資料IDで更新しようとした場合' do
        before { create_list(:company_attachment, 5, company: company) }

        let(:company_information_params) do
          {
            director: Faker::Name.name
          }
        end
        let(:attachments_params) do
          {
            upsert: [
              {
                id: CompanyAttachment.last.id + 1, # 存在しないID
                file_type: :certificate_of_registered_matters
              }
            ],
            delete_ids: [CompanyAttachment.last.id]
          }
        end

        it 'エラーが発生し、会社情報の変更もロールバックされること' do
          original_director = company.company_information.director
          expect(company.company_attachments.count).to eq(5)
          expect(transaction.exec).to be false
          expect(transaction.errors).to include('not found')

          expect(company.reload.company_information.director).to eq(original_director)
          expect(company.company_attachments.count).to eq(5)
        end
      end
    end
  end
end
