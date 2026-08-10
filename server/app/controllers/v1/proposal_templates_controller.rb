module V1
  class ProposalTemplatesController < ApplicationController
    def index

      # 現在のユーザーが会社に所属していない場合はエラーを返す
      if current_user.company.blank?
        return render json: { errors: ['会社に所属していないため、提案書テンプレートにアクセスできません'] }, status: :forbidden
      end

      proposal_templates = ProposalTemplate.where(company_id: current_user.company.id)             

      render json: proposal_templates, each_serializer: V1::ProposalTemplateSerializer, adapter: :json,
        root: 'templates'
    end

    def show
      proposal_template = ProposalTemplate.find(params[:id])
      render json: proposal_template, serializer: V1::ProposalTemplateSerializer
    end

    def create

      if current_user.company.blank?
        return render json: { errors: ['会社に所属していないため、提案書テンプレートを作成できません'] }, status: :forbidden
      end

      proposal_template = ProposalTemplate.new(proposal_template_params)
      
      proposal_template.company = current_user.company if current_user.company.present?

      if params[:file].present?
        proposal_template.file.attach(params[:file])

        if proposal_template.save
          render json: proposal_template, serializer: V1::ProposalTemplateSerializer, status: :created
        else
          render json: { errors: proposal_template.errors.full_messages }, status: :unprocessable_entity
        end
        
      else
        return render json: { errors: ['ファイルをアップロードしてください'] }, status: :unprocessable_entity
      end
    end

    def destroy
      proposal_template = ProposalTemplate.find(params[:id])
      
      if proposal_template.company.present? && proposal_template.company != current_user.company
        return render json: { errors: ['このテンプレートを削除する権限がありません'] }, status: :forbidden
      end
      
      proposal_template.destroy
      head :no_content
    end

    private

    def proposal_template_params
      params.permit(:name, :url)
    end
  end
end
