module V1
  module Proposal
    class TemplateController < ApplicationController
      def index
        proposal_templates = current_user.company.proposal_templates.with_attached_file

        render(
          json: proposal_templates,
          each_serializer: V1::ProposalTemplateSerializer,
          adapter: :json,
          root: 'templates'
        )
      end

      def show
        proposal_template = ProposalTemplate.with_attached_file.find(params[:id])

        render(
          json: proposal_template,
          serializer: V1::ProposalTemplateSerializer
        )
      rescue ActiveRecord::RecordNotFound
        render json: { errors: ['テンプレートが見つかりませんでした'] }, status: :not_found
      end

      def create
        proposal_template = ProposalTemplate.new(
          company: current_user.company
        )
        
        if params[:file].present?
          filename = params[:file].original_filename.to_s
          extension = File.extname(filename).downcase
          
          unless ProposalTemplate::ALLOWED_EXTENSIONS.include?(extension)
            render json: { 
              errors: ["ファイル形式が無効です。Google SlidesまたはPowerPointファイル（#{ProposalTemplate::ALLOWED_EXTENSIONS.join(', ')}）のみ許可されています"] 
            }, status: :unprocessable_entity
            return
          end
          
          proposal_template.file.attach(params[:file])
        else
          render json: { errors: ['ファイルを入力してください'] }, status: :bad_request
          return
        end

        if proposal_template.save
          render json: proposal_template, serializer: V1::ProposalTemplateSerializer, status: :created
        else
          render json: { errors: proposal_template.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        proposal_template = ProposalTemplate.find(params[:id])

        if proposal_template.company_id != current_user.company.id
          render json: { errors: ['テンプレートの削除権限がありません'] }, status: :forbidden
          return
        end

        if proposal_template.destroy
          head :no_content
        else
          render json: { errors: proposal_template.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { errors: ['テンプレートが見つかりませんでした'] }, status: :not_found
      end

      private

      def template_params
        params.permit(:file)
      end
    end
  end
end
