module Transactions
  class UpdateCompanyInformation < ApplicationTransaction
    def initialize(params, company)
      super()
      @params = params
      @company = company
    end

    def exec
      with_transaction do
        update_company
        upsert_company_information
        sync_offices
        sync_attachments
      end
    end

    private

    def company_params
      @params.require(:company_information).permit(:name)
    end

    def company_information_params
      @params
      .require(:company_information)
      .permit(
        :corporate_number,
        :postal_code,
        :address,
        :director,
        :tel_num,
        :fax_num,
        :capital,
        :employees_num,
        :industry_type,
        :business_description,
        :sales,
        :established_at
      )
    end

    def upsert_offices_params
      return { upsert: [] } unless @params.key?(:offices)
      @params.require(:offices).permit(upsert: [:id, :name, :address])
    end

    def delete_offices_params
      return { delete_ids: [] } unless @params.key?(:offices)
      @params.require(:offices).permit(delete_ids: [])
    end

    def offices_params
      upsert_offices_params.merge(delete_offices_params)
    end

    def upsert_attachments_params
      return { upsert: [] } unless @params.key?(:attachments)
      @params.require(:attachments).permit(upsert: [:id, :file_type, :file])
    end

    def delete_attachments_params
      return { delete_ids: [] } unless @params.key?(:attachments)
      @params.require(:attachments).permit(delete_ids: [])
    end

    def attachments_params
      upsert_attachments_params.merge(delete_attachments_params)
    end


    def update_company
      params = company_params
      return if params.blank?

      update_in_transaction(@company, params)
    end


    def upsert_company_information
      params = company_information_params
      return if params.blank?

      if @company.company_information.present?
        update_in_transaction(@company.company_information, params)
      else
        company_information = @company.build_company_information(params)
        save_in_transaction(company_information)
      end
    end

    def sync_offices
      upsert_offices
      delete_offices
    end

    def upsert_offices
      params = offices_params
      return if params[:upsert].blank?

      params[:upsert].each do |office_param|
        if office_param[:id].blank?
          office = @company.offices.build(office_param.except(:id))
          save_in_transaction(office)
        else
          office = @company.offices.find(office_param[:id])
          update_in_transaction(office, office_param.except(:id))
        end
      end
    rescue ActiveRecord::RecordNotFound
      @errors << 'not found'
      raise ActiveRecord::Rollback
    end

    def delete_offices
      params = offices_params
      return if params[:delete_ids].blank?

      @company.offices.where(id: params[:delete_ids]).find_each do |office|
        destroy_in_transaction(office)
      end
    end
    
    def sync_attachments
      upsert_attachments
      delete_attachments
    end

    def upsert_attachments
      params = attachments_params
      return if params[:upsert].blank?

      params[:upsert].each do |attachment_param|
        if attachment_param[:id].blank?
          attachment = @company.company_attachments.build(attachment_param.except(:id, :file))
          attachment.file.attach(attachment_param[:file])
          save_in_transaction(attachment)
        else
          attachment = @company.company_attachments.find(attachment_param[:id])
          update_in_transaction(attachment, attachment_param.except(:id, :file))
        end
      end
    rescue ActiveRecord::RecordNotFound
      @errors << 'not found'
      raise ActiveRecord::Rollback
    end

    def delete_attachments
      params = attachments_params
      return if params[:delete_ids].blank?

      @company.company_attachments.where(id: params[:delete_ids]).find_each do |attachment|
        destroy_in_transaction(attachment)
      end
    end
  end
end
