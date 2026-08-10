# 参考: https://engineer.blog.lancers.jp/sendgrid/replace-sendgrid/
class Mail::SendGrid
  # settingsにはsendgrid.rbで渡したapi_keyが格納されている
  def initialize(settings)
    @settings = settings
  end

  def deliver!(mail)
    # ActionMailerのメイラー内で作成したメールオブジェクトの詳細情報をSendGrid用のメールオブジェクトに置き換えていく
    # personalizationでto, cc, bccを設定
    personalization = ::SendGrid::Personalization.new
    personalization.subject = mail.subject

    Array(mail.to).each do |email|
      personalization.add_to(::SendGrid::Email.new(email: email))
    end

    Array(mail.cc).each do |email|
      personalization.add_cc(::SendGrid::Email.new(email: email))
    end

    Array(mail.bcc).each do |email|
      personalization.add_bcc(::SendGrid::Email.new(email: email))
    end

    # from, subject, content, personalizationを設定しSendGrid用のメールオブジェクト完成
    sg_mail = ::SendGrid::Mail.new
    from_address = mail.from.first
    from_name = mail.header['from'].display_names.first
    sg_mail.from = ::SendGrid::Email.new(email: from_address, name: from_name)
    sg_mail.subject = mail.subject
    sg_mail.add_content(::SendGrid::Content.new(type: 'text/plain', value: mail.body.raw_source))
    sg_mail.add_personalization(personalization)

    # API呼び出し
    sg = ::SendGrid::API.new(api_key: @settings[:api_key])
    response = sg.client.mail._('send').post(request_body: sg_mail.to_json)
    Rails.logger.debug response.status_code
    Rails.logger.debug response.headers
  end
end
