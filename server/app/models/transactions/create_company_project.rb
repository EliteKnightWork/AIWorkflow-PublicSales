module Transactions
  class CreateCompanyProject < ApplicationTransaction
    attr_reader :company_project, :project

    def initialize(company_id, args)
      super()
      @company_id = company_id
      @args = args
      @company_project = nil
      @project = nil
    end

    def exec
      with_transaction do
        build_project
        next if @errors.present?

        build_company_project
        @company_project.project = @project
        save_in_transaction(@company_project)
        next if @errors.present?
      end
    end

    private

    def build_company_project
      @company_project = CompanyProject.new(company_id: @company_id)
    end

    def build_project
      @args[:company_id] = @company_id
      @args[:key] = SecureRandom.uuid
      @args[:source] = "company_project-#{@company_id}"
      @args[:registration_date] = Time.zone.now.to_date

      transaction = Transactions::CreateProject.new(@args, is_company_project: true)
      if transaction.exec
        @project = transaction.project
      else
        @errors.concat(transaction.errors)
      end
    end

  end
end
