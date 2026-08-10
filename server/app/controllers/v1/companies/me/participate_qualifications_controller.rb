module V1
  module Companies
    module Me
      class ParticipateQualificationsController < ApplicationController
        def index
          cpqs = current_user.company.company_participate_qualifications.
            includes(
              :qualification_certificates,
              :participate_qualification,
              company_participate_qualification_grades: :participate_qualification_grade
            )

          render(
            json: cpqs,
            each_serializer: V1::CompanyParticipateQualificationSerializer,
            adapter: :json,
            root: 'participateQualifications',
            status: :ok
          )
        end

        def create
          # 必ず1件以上等級が選択されていること
          if create_company_participate_qualification_params[:participate_qualification_grade_ids].empty?
            render json: { errors: ['参加資格等級を1件以上選択してください'] }, status: :bad_request
            return
          end

          # 参加資格の登録
          cpq = current_user.company.company_participate_qualifications.new(
            create_company_participate_qualification_params.except(
              :participate_qualification_grade_ids,
              :qualification_certificates
            )
          )

          ActiveRecord::Base.transaction do
            cpq.save!

            # 所有している参加資格等級の登録
            if create_company_participate_qualification_params[:participate_qualification_grade_ids].present?
              create_company_participate_qualification_params[:participate_qualification_grade_ids].map do |pqg_id|
                # 実際に存在する等級か確認(nilチェックのためにfind_byを使用)
                pqg = cpq.participate_qualification.participate_qualification_grades.find_by(id: pqg_id)
                raise ActiveRecord::RecordInvalid.new(cpq) if pqg.nil?

                cpq.company_participate_qualification_grades.create!(
                  participate_qualification_grade_id: pqg.id
                )
              end
            end

            # 資格証明書の登録
            if create_company_participate_qualification_params[:qualification_certificates].present?
              create_company_participate_qualification_params[:qualification_certificates].each do |file|
                cpq.qualification_certificates.create!(file: file)
              end
            end
          end

          render(
            json: cpq,
            serializer: V1::CompanyParticipateQualificationSerializer,
            status: :created
          )
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :bad_request
        end

        def update
          cpq = current_user.company.company_participate_qualifications.find(params[:id])

          ActiveRecord::Base.transaction do
            cpq.update!(
              update_company_participate_qualification_params.except(
                :add_participate_qualification_grade_ids,
                :remove_participate_qualification_grade_ids,
                :add_qualification_certificates,
                :remove_qualification_certificate_ids
              )
            )

            # 所有している参加資格等級の追加
            if update_company_participate_qualification_params[:add_participate_qualification_grade_ids].present?
              update_company_participate_qualification_params[:add_participate_qualification_grade_ids].each do |pqg_id|
                # 実際に存在する等級か確認(nilチェックのためにfind_byを使用)
                pqg = cpq.participate_qualification.participate_qualification_grades.find_by(id: pqg_id)
                raise ActiveRecord::RecordInvalid.new(cpq) if pqg.nil?

                cpq.company_participate_qualification_grades.create!(
                  participate_qualification_grade_id: pqg.id
                )
              end
            end

            # 所有している参加資格等級の削除
            if update_company_participate_qualification_params[:remove_participate_qualification_grade_ids].present?
              cpq.company_participate_qualification_grades.where(
                participate_qualification_grade_id: update_company_participate_qualification_params[:remove_participate_qualification_grade_ids]
              ).destroy_all
            end

            # 所有している参加資格等級が0件になる場合は400エラー
            if cpq.company_participate_qualification_grades.empty?
              raise ActiveRecord::RecordInvalid.new(cpq)
            end

            # 資格証明書の追加
            if update_company_participate_qualification_params[:add_qualification_certificates].present?
              update_company_participate_qualification_params[:add_qualification_certificates].each do |file|
                cpq.qualification_certificates.create!(file: file)
              end
            end

            # 資格証明書の削除
            if update_company_participate_qualification_params[:remove_qualification_certificate_ids].present?
              cpq.qualification_certificates.where(
                id: update_company_participate_qualification_params[:remove_qualification_certificate_ids]
              ).destroy_all
            end
          end

          render(
            json: cpq,
            serializer: V1::CompanyParticipateQualificationSerializer,
            status: :ok
          )
        rescue ActiveRecord::RecordNotFound
          render json: { errors: ['参加資格が見つかりません'] }, status: :not_found
        rescue ActiveRecord::RecordInvalid
          render json: { errors: ['参加資格等級は1つ以上必要です'] }, status: :bad_request
        end

        def destroy
          current_user.company.company_participate_qualifications.find(params[:id]).destroy!

          head :no_content
        rescue ActiveRecord::RecordNotFound
          render json: { errors: ['参加資格が見つかりません'] }, status: :not_found
        end

        private

        def create_company_participate_qualification_params
          params.permit(
            :participate_qualification_id,
            :organization_name,
            :qualification_status,
            :qualification_type,
            :remarks,
            :valid_from,
            :valid_until,
            participate_qualification_grade_ids: [],
            qualification_certificates: [],
          ).tap do |p|
            p[:participate_qualification_grade_ids]&.reject!(&:blank?)
            p[:qualification_certificates]&.reject!(&:blank?)
          end
        end

        def update_company_participate_qualification_params
          params.permit(
            :organization_name,
            :qualification_status,
            :qualification_type,
            :remarks,
            :valid_from,
            :valid_until,
            add_participate_qualification_grade_ids: [],
            remove_participate_qualification_grade_ids: [],
            add_qualification_certificates: [],
            remove_qualification_certificate_ids: []
          ).tap do |p|
            p[:add_participate_qualification_grade_ids]&.reject!(&:blank?)
            p[:remove_participate_qualification_grade_ids]&.reject!(&:blank?)
            p[:add_qualification_certificates]&.reject!(&:blank?)
            p[:remove_qualification_certificate_ids]&.reject!(&:blank?)
          end
        end
      end
    end
  end
end
