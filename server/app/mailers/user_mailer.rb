class UserMailer < ApplicationMailer
  default from: '【Labid：本日の新着案件のお知らせ】 <newsletter@labid.jp>'

  def new_projects
    email = params[:email]
    @new_projects = params[:new_projects]
    @new_recommendations = params[:new_recommendations]
    mail(to: email, subject: '【Labid：本日の新着案件のお知らせ】')
  end

  def task
    email = params[:email]
    @tasks = params[:tasks]
    @days_before_due_date = params[:days_before_due_date]

    mail(
      to: email,
      subject: '【Labid：期限が迫ったタスクのお知らせ】',
      from: '【Labid：期限が迫ったタスクのお知らせ】 <newsletter@labid.jp>'
    )
  end
end
