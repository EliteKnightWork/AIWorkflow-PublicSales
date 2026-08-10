require 'rails_helper'

RSpec.describe Transactions::CreateAdminUser do
  let(:company) { create(:company) }
  let(:params) do
    {
      name: 'テストユーザー',
      email: 'test@example.com',
      password: 'password123'
    }
  end

  describe '#exec' do
    let(:auth0_client) { Auth0Client.new({
      domain: 'DOMAIN',
      client_id: 'CLIENT_ID',
      client_secret: 'TEST_CLIENT_SECRET',
      token: 'TEST_MASTER_JWT'
    })}

    before do
      stub_const('AUTH0_CLIENT', auth0_client)
    end

    context '正常な場合' do
      before do
        allow(auth0_client).to receive(:create_user).and_return(
          { 'user_id' => 'auth0|test123' }
        )
      end

      it 'ユーザーを作成する' do
        transaction = described_class.new(params, company)

        expect(transaction.exec).to be true
        expect(transaction.errors).to be_empty

        user = User.last
        expect(user).to have_attributes(
          name: 'テストユーザー',
          email: 'test@example.com',
          company_id: company.id,
          auth0_user_id: 'auth0|test123'
        )
      end

      it 'Auth0でユーザーが作成される' do
        transaction = described_class.new(params, company)
        transaction.exec

        expect(auth0_client).to have_received(:create_user).with(
          'Username-Password-Authentication',
          {
            name: 'テストユーザー',
            email: 'test@example.com',
            password: 'password123'
          }
        )
      end
    end

    context 'Auth0でのユーザー作成が失敗する場合' do
      before do
        stub_const('AUTH0_CLIENT', auth0_client)
        allow(auth0_client).to receive(:create_user).and_raise(
          Auth0::Exception.new('Auth0 error')
        )
      end

      it 'エラーが発生し、ローカルDBにユーザーが作成されない' do
        transaction = described_class.new(params, company)

        expect(transaction.exec).to be false
        expect(transaction.errors).to include('Auth0でのユーザー作成に失敗しました: Auth0 error')
        expect(User.count).to eq(0)
      end
    end

    context 'ローカルDBの保存が失敗する場合' do
      before do
        stub_const('AUTH0_CLIENT', auth0_client)
        allow(auth0_client).to receive_messages(create_user: { 'user_id' => 'auth0|test123' }, delete_user: true)
        # メールアドレス重複でバリデーションエラーを発生させる
        create(:user, email: 'test@example.com')
      end

      it 'エラーが発生し、Auth0のユーザーが削除される' do
        transaction = described_class.new(params, company)

        expect(transaction.exec).to be false
        expect(transaction.errors).to include('メールアドレスはすでに存在します')
        expect(auth0_client).to have_received(:delete_user).with('auth0|test123')
      end
    end

    context 'Auth0の削除が失敗する場合' do
      before do
        stub_const('AUTH0_CLIENT', auth0_client)
        allow(auth0_client).to receive(:create_user).and_return(
          { 'user_id' => 'auth0|test123' }
        )
        allow(auth0_client).to receive(:delete_user).and_raise(
          Auth0::Exception.new('Delete error')
        )
        # メールアドレス重複でバリデーションエラーを発生させる
        create(:user, email: 'test@example.com')
      end

      it 'エラーが発生し、Auth0の削除エラーがログに記録される' do
        transaction = described_class.new(params, company)

        expect(transaction.exec).to be false
        expect(transaction.errors).to include('メールアドレスはすでに存在します')
        # Auth0の削除エラーはログに記録されるが、トランザクションは失敗する
      end
    end
  end
end
