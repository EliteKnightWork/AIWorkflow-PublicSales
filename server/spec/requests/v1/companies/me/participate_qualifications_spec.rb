require 'rails_helper'

RSpec.describe 'Companies::Me::ParticipateQualifications' do
  let(:company) { create(:company) }
  let(:user) { create(:user, company:) }

  before { login_as(user) }

  describe 'GET /companies/me/participate_qualifications' do
    let(:participate_qualification_a) { create(:participate_qualification, name: '参加資格A') }
    let(:participate_qualification_b) { create(:participate_qualification, name: '参加資格B') }

    context 'パラメータが有効な場合' do
      # rubocop:disable RSpec/ExampleLength
      it '200が返ること' do
        participate_qualification_grade_a1 = create(:participate_qualification_grade, participate_qualification: participate_qualification_a, name: 'GradeA1')
        participate_qualification_grade_a2 = create(:participate_qualification_grade, participate_qualification: participate_qualification_a, name: 'GradeA2')
        participate_qualification_grade_b1 = create(:participate_qualification_grade, participate_qualification: participate_qualification_b, name: 'GradeB1')
        create(:participate_qualification_grade, participate_qualification: participate_qualification_b, name: 'GradeB2')

        cpa_a = create(
          :company_participate_qualification,
          company:,
          participate_qualification: participate_qualification_a,
          qualification_status: 'active',
          organization_name: 'Org A',
          qualification_type: 'services',
          remarks: 'Remarks1',
          valid_from: '2024-01-01',
          valid_until: '2024-12-31'
        )
        create(:company_participate_qualification_grade, company_participate_qualification: cpa_a, participate_qualification_grade: participate_qualification_grade_a1)
        create(:company_participate_qualification_grade, company_participate_qualification: cpa_a, participate_qualification_grade: participate_qualification_grade_a2)
        cpa_b = create(
          :company_participate_qualification,
          company:,
          participate_qualification: participate_qualification_b,
          qualification_status: 'inactive',
          organization_name: 'Org B',
          qualification_type: 'goods',
          remarks: 'Remarks2',
          valid_from: '2023-01-01',
          valid_until: '2023-12-31'
        )
        create(:company_participate_qualification_grade, company_participate_qualification: cpa_b, participate_qualification_grade: participate_qualification_grade_b1)

        get '/v1/companies/me/participate_qualifications'

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['participateQualifications'].length).to eq(2)
          expect(json['participateQualifications'][0]['participateQualificationId']).to eq(participate_qualification_a.id)
          expect(json['participateQualifications'][0]['ownedGrades'].length).to eq(2)
          expect(json['participateQualifications'][0]['ownedGrades'][0]['participateQualificationGradeId']).to eq(participate_qualification_grade_a1.id)
          expect(json['participateQualifications'][0]['ownedGrades'][1]['participateQualificationGradeId']).to eq(participate_qualification_grade_a2.id)
          expect(json['participateQualifications'][1]['participateQualificationId']).to eq(participate_qualification_b.id)
          expect(json['participateQualifications'][1]['ownedGrades'].length).to eq(1)
          expect(json['participateQualifications'][1]['ownedGrades'][0]['participateQualificationGradeId']).to eq(participate_qualification_grade_b1.id)
        end
      end
      # rubocop:enable RSpec/ExampleLength

      it '参加資格等級が存在しない場合でも200が返ること' do
        get '/v1/companies/me/participate_qualifications'

        assert_response_schema_confirm(200)
      end

      it '他社の参加資格等級が返らないこと' do
        other_company = create(:company)
        create(
          :company_participate_qualification,
          company: other_company,
          participate_qualification: participate_qualification_a
        )

        get '/v1/companies/me/participate_qualifications'

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['participateQualifications'].length).to eq(0)
        end
      end
    end
  end

  describe 'POST /companies/me/participate_qualifications' do
    let(:participate_qualification) { create(:participate_qualification, name: '参加資格A') }
    let(:participate_qualification_grade_a) { create(:participate_qualification_grade, participate_qualification:, name: 'GradeA') }
    let(:participate_qualification_grade_b) { create(:participate_qualification_grade, participate_qualification:, name: 'GradeB') }

    context 'パラメータが有効な場合' do
      it '参加資格等級が作成され、201が返ること' do
        participate_qualification_grade_a = create(:participate_qualification_grade, participate_qualification:, name: 'GradeA')
        participate_qualification_grade_b = create(:participate_qualification_grade, participate_qualification:, name: 'GradeB')

        valid_params = {
          participate_qualification_id: participate_qualification.id,
          participate_qualification_grade_ids: [participate_qualification_grade_a.id, participate_qualification_grade_b.id],
          organization_name: 'Org Test',
          qualification_status: 'active',
          qualification_type: 'services',
          remarks: 'Test remarks',
          valid_from: '2024-01-01',
          valid_until: '2024-12-31'
        }

        post '/v1/companies/me/participate_qualifications', params: valid_params

        aggregate_failures do
          assert_response_schema_confirm(201)
          json = response.parsed_body

          expect(json['companyParticipateQualificationStatus']).to eq('active')
          expect(json['organizationName']).to eq('Org Test')
          expect(json['companyParticipateQualificationType']).to eq('services')
          expect(json['remarks']).to eq('Test remarks')
          expect(json['validFrom']).to eq('2024-01-01')
          expect(json['validUntil']).to eq('2024-12-31')
          expect(json['participateQualificationId']).to eq(participate_qualification.id)
          expect(json['ownedGrades'].length).to eq(2)
          expect(json['ownedGrades'][0]['participateQualificationGradeId']).to eq(participate_qualification_grade_a.id)
          expect(json['ownedGrades'][1]['participateQualificationGradeId']).to eq(participate_qualification_grade_b.id)
        end
      end

      it '作成された参加資格等級情報のみが返ること' do
        participate_qualification_grade_a = create(:participate_qualification_grade, participate_qualification:, name: 'GradeA')
        create(:participate_qualification_grade, participate_qualification:, name: 'GradeB')

        valid_params = {
          participate_qualification_id: participate_qualification.id,
          participate_qualification_grade_ids: [participate_qualification_grade_a.id],
          organization_name: 'Org Test',
          qualification_status: 'active',
          qualification_type: 'services',
          remarks: 'Test remarks',
          valid_from: '2024-01-01',
          valid_until: '2024-12-31'
        }

        post '/v1/companies/me/participate_qualifications', params: valid_params

        aggregate_failures do
          assert_response_schema_confirm(201)
          json = response.parsed_body

          expect(json['companyParticipateQualificationStatus']).to eq('active')
          expect(json['companyParticipateQualificationType']).to eq('services')
          expect(json['remarks']).to eq('Test remarks')
          expect(json['validFrom']).to eq('2024-01-01')
          expect(json['validUntil']).to eq('2024-12-31')
          expect(json['participateQualificationId']).to eq(participate_qualification.id)
          expect(json['ownedGrades'].length).to eq(1)
          expect(json['ownedGrades'][0]['participateQualificationGradeId']).to eq(participate_qualification_grade_a.id)
        end
      end

      it '資格証明書が添付されている場合、正常に保存されること' do
        participate_qualification_grade_a = create(:participate_qualification_grade, participate_qualification:, name: 'GradeA')
        participate_qualification_grade_b = create(:participate_qualification_grade, participate_qualification:, name: 'GradeB')
        file1 = fixture_file_upload(Rails.root.join("spec/fixtures/files/test.pdf"), 'application/pdf')
        file2 = fixture_file_upload(Rails.root.join("spec/fixtures/dummy.pdf"), 'application/pdf')

        valid_params = {
          participate_qualification_id: participate_qualification.id,
          participate_qualification_grade_ids: [participate_qualification_grade_a.id, participate_qualification_grade_b.id],
          organization_name: 'Org Test',
          qualification_status: 'active',
          qualification_type: 'services',
          remarks: 'Test remarks',
          valid_from: '2024-01-01',
          valid_until: '2024-12-31',
          qualification_certificates: [file1, file2]
        }

        post '/v1/companies/me/participate_qualifications', params: valid_params

        aggregate_failures do
          assert_response_schema_confirm(201)
          json = response.parsed_body
          expect(json['qualificationCertificates'].length).to eq(2)
          expect(json['qualificationCertificates'][0]['name']).to eq('test.pdf')
          expect(json['qualificationCertificates'][1]['name']).to eq('dummy.pdf')
        end
      end

      it '参加資格等級IDが空配列の場合400が返ること' do
        invalid_params = {
          participate_qualification_id: participate_qualification.id,
          participate_qualification_grade_ids: [],
          organization_name: 'Org Test',
          qualification_status: 'active',
          qualification_type: 'services',
          remarks: 'Test remarks',
          valid_from: '2024-01-01',
          valid_until: '2024-12-31'
      }

        post '/v1/companies/me/participate_qualifications', params: invalid_params

        aggregate_failures do
          assert_response_schema_confirm(400)
        end
      end

      it '参加資格IDが不正な場合、400が返ること' do
        invalid_params = {
          participate_qualification_id: 0,
          participate_qualification_grade_ids: [participate_qualification_grade_a.id],
          organization_name: 'Org Test',
          qualification_status: 'active',
          qualification_type: 'services',
          remarks: 'Test remarks',
          valid_from: '2024-01-01',
          valid_until: '2024-12-31'
        }

        post '/v1/companies/me/participate_qualifications', params: invalid_params

        aggregate_failures do
          assert_response_schema_confirm(400)
        end
      end

      it '存在しない参加資格等級IDの場合、400が返ること' do
        invalid_params = {
          participate_qualification_id: participate_qualification.id,
          participate_qualification_grade_ids: [0],
          organization_name: 'Org Test',
          qualification_status: 'active',
          qualification_type: 'services',
          remarks: 'Test remarks',
          valid_from: '2024-01-01',
          valid_until: '2024-12-31'
        }

        post '/v1/companies/me/participate_qualifications', params: invalid_params

        aggregate_failures do
          assert_response_schema_confirm(400)
        end
      end
    end
  end

  describe 'PATCH /companies/me/participate_qualifications' do
    # rubocop:disable RSpec/ExampleLength
    it '参加資格等級が更新され、200が返ること' do
      participate_qualification = create(:participate_qualification, name: '参加資格A')
      participate_qualification_grade_a = create(:participate_qualification_grade, participate_qualification:, name: 'GradeA')
      participate_qualification_grade_b = create(:participate_qualification_grade, participate_qualification:, name: 'GradeB')

      file1 = fixture_file_upload(Rails.root.join("spec/fixtures/files/test.pdf"), 'application/pdf')
      file2 = fixture_file_upload(Rails.root.join("spec/fixtures/dummy.pdf"), 'application/pdf')

      cpq = create(:company_participate_qualification, company:, participate_qualification:, qualification_status: 'active', qualification_type: 'services', remarks: 'Initial remarks', valid_from: '2024-01-01', valid_until: '2024-12-31')
      create(:company_participate_qualification_grade, company_participate_qualification: cpq, participate_qualification_grade: participate_qualification_grade_a)
      cpq.qualification_certificates.create!(file: file1)

      patch "/v1/companies/me/participate_qualifications/#{cpq.id}", params: {
        organization_name: 'Org Updated',
        qualification_status: 'inactive',
        qualification_type: 'goods',
        remarks: 'Updated remarks',
        valid_from: '2024-02-01',
        valid_until: '2024-11-30',
        add_participate_qualification_grade_ids: [participate_qualification_grade_b.id],
        remove_participate_qualification_grade_ids: [participate_qualification_grade_a.id],
        add_qualification_certificates: [file2],
        remove_qualification_certificate_ids: cpq.qualification_certificates.pluck(:id)
      }

      aggregate_failures do
        assert_response_schema_confirm(200)
        json = response.parsed_body

        expect(json['id']).to eq(cpq.id)
        expect(json['companyParticipateQualificationStatus']).to eq('inactive')
        expect(json['organizationName']).to eq('Org Updated')
        expect(json['companyParticipateQualificationType']).to eq('goods')
        expect(json['remarks']).to eq('Updated remarks')
        expect(json['validFrom']).to eq('2024-02-01')
        expect(json['validUntil']).to eq('2024-11-30')
        expect(json['qualificationCertificates'].length).to eq(1)
        expect(json['qualificationCertificates'][0]['name']).to eq('dummy.pdf')
        expect(json['participateQualificationId']).to eq(participate_qualification.id)
        expect(json['ownedGrades'].length).to eq(1)
        expect(json['ownedGrades'][0]['participateQualificationGradeId']).to eq(participate_qualification_grade_b.id)
      end
    end
    # rubocop:enable RSpec/ExampleLength

    it '存在しない参加資格等級IDの場合、404が返ること' do
      invalid_params = {
        id: 0,
        organization_name: 'Org Updated',
        qualification_status: 'inactive',
        qualification_type: 'goods',
        remarks: 'Updated remarks',
        valid_from: '2024-02-01',
        valid_until: '2024-11-30'
      }

      patch "/v1/companies/me/participate_qualifications/#{invalid_params[:id]}", params: invalid_params

      aggregate_failures do
        assert_response_schema_confirm(404)
      end
    end

    it '参加資格等級を全て削除しようとした場合、400が返ること' do
      participate_qualification = create(:participate_qualification, name: '参加資格A')
      participate_qualification_grade_a = create(:participate_qualification_grade, participate_qualification:, name: 'GradeA')

      cpq = create(:company_participate_qualification, company:, participate_qualification:)
      create(:company_participate_qualification_grade, company_participate_qualification: cpq, participate_qualification_grade: participate_qualification_grade_a)

      patch "/v1/companies/me/participate_qualifications/#{cpq.id}", params: {
        remove_participate_qualification_grade_ids: [participate_qualification_grade_a.id]
      }

      aggregate_failures do
        assert_response_schema_confirm(400)
      end
    end
  end

  describe 'DELETE /companies/me/participate_qualifications' do
    it '参加資格等級が削除され、204が返ること' do
      participate_qualification = create(:participate_qualification, name: '参加資格A')
      participate_qualification_grade = create(:participate_qualification_grade, participate_qualification:, name: 'GradeA')
      cpq = create(:company_participate_qualification, company:, participate_qualification:)
      create(:company_participate_qualification_grade, company_participate_qualification: cpq, participate_qualification_grade: participate_qualification_grade)

      delete "/v1/companies/me/participate_qualifications/#{cpq.id}"

      aggregate_failures do
        assert_response_schema_confirm(204)

        expect(CompanyParticipateQualification.find_by(id: cpq.id)).to be_nil
        expect(CompanyParticipateQualificationGrade.where(id: cpq.participate_qualification.participate_qualification_grades.pluck(:id))).to be_empty
      end
    end

    it '存在しない参加資格IDの場合、404が返ること' do
      delete "/v1/companies/me/participate_qualifications/0"

      aggregate_failures do
        assert_response_schema_confirm(404)
      end
    end
  end
end
