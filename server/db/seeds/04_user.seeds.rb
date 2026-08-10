Seeder.seed do
  def create_user(company:, auth0_user_id:, email:, name: nil)
    User.find_by(auth0_user_id: auth0_user_id) || FactoryBot.create(:user, company: company, auth0_user_id: auth0_user_id, email: email, name: name)
  end

  company = Company.first
  email = ENV['DEV_USER_EMAIL']
  raise "Auth0で開発用ユーザーを作成して環境変数DEV_USER_EMAILに設定してください" unless email

  auth0_user = AUTH0_CLIENT.users(q: "email:#{email}", fields: 'user_id,email').first
  raise "No Auth0 user found with email: #{email}" unless auth0_user

  create_user(company: company, auth0_user_id: auth0_user['user_id'], email: email, name: '涅槃太郎')
end
