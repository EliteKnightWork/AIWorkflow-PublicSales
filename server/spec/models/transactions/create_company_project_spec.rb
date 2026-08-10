require 'rails_helper'

RSpec.describe Transactions::CreateCompanyProject do
  let(:company) { create(:company) }
  let(:args) do
    {
      title: 'テスト会社プロジェクト',
    }
  end

  before do
    allow_any_instance_of(Project).to receive(:check_and_build_project_embeddings)
  end

  describe '#exec' do
    subject(:execute_transaction) { transaction.exec }

    context '正常系' do
      let(:transaction) { described_class.new(company.id, args) }

      before do
        allow(Transactions::CreateProject).to receive(:new).and_call_original
      end

      it 'Project と CompanyProject を作成し、is_company_project: true で CreateProject を初期化する' do
        expect { execute_transaction }.to change(Project, :count).by(1)
          .and change(CompanyProject, :count).by(1)

        expect(Transactions::CreateProject).to have_received(:new).with(anything, is_company_project: true)
      end

      it 'true を返し、エラーなしで関連が設定される' do
        result = execute_transaction

        expect(result).to be true
        expect(transaction.errors).to be_empty
        expect(transaction.project).to have_attributes(
          persisted?: true,
          company_project: transaction.company_project
        )
        expect(transaction.company_project).to have_attributes(
          persisted?: true,
          company_id: company.id
        )
      end
    end

    context 'Project の保存に失敗する場合' do
      let(:transaction) { described_class.new(company.id, args.merge(title: nil)) }

      it 'false を返す' do
        expect(execute_transaction).to be false
      end

      it 'CompanyProject が作成されない' do
        expect { execute_transaction }.not_to change(CompanyProject, :count)
      end

      it 'Project が作成されない' do
        expect { execute_transaction }.not_to change(Project, :count)
      end
    end

    context 'CompanyProject の保存に失敗する場合' do
      let(:transaction) { described_class.new(nil, args) }

      it 'false を返す' do
        expect(execute_transaction).to be false
      end

      it 'Project が作成されない' do
        expect { execute_transaction }.not_to change(Project, :count)
      end

      it 'CompanyProject が作成されない' do
        expect { execute_transaction }.not_to change(CompanyProject, :count)
      end
    end
  end
end
