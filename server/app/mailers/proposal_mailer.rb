class ProposalMailer < ApplicationMailer
  default from: '【Labid：提案書作成完了のお知らせ】 <newsletter@labid.jp>'

  def proposal_created
    @email = params[:email]
    @proposal_job = params[:proposal_job]
    mail(to: @email, subject: '【Labid：提案書作成完了のお知らせ】')
  end

  def proposal_create_failed
    @email = params[:email]
    @proposal_job = params[:proposal_job]
    @error_message = params[:error_message]
    mail(to: @email, subject: '【Labid：提案書作成に失敗しました】')
  end
end
