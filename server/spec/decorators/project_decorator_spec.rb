require 'rails_helper'

RSpec.describe ProjectDecorator do
  let(:project) { create(:project) }
  let(:decorated_project) { project.decorate }

  describe '#publication_date' do
    it '日付をフォーマットして返すこと' do
      expect(decorated_project.publication_date).to eq(I18n.l(project.publication_date.to_date))
    end
  end

  describe '#bidding_deadline_date' do
  it '日付をフォーマットして返すこと' do
      expect(decorated_project.bidding_deadline_date).to eq(I18n.l(project.bidding_deadline_date.to_date))
    end
  end

  describe '#application_document_deadline_date' do
  it '日付をフォーマットして返すこと' do
      expect(decorated_project.application_document_deadline_date).to eq(I18n.l(project.application_document_deadline_date.to_date))
    end
  end

  describe '#proposal_document_deadline_date' do
  it '日付をフォーマットして返すこと' do
      expect(decorated_project.proposal_document_deadline_date).to eq(I18n.l(project.proposal_document_deadline_date.to_date))
    end
  end

  describe '#briefing_session_date' do
  it '日付をフォーマットして返すこと' do
      expect(decorated_project.briefing_session_date).to eq(I18n.l(project.briefing_session_date.to_date))
    end
  end

  describe '#registration_date' do
    it '日付をフォーマットして返すこと' do
      expect(decorated_project.registration_date).to eq(I18n.l(project.registration_date.to_date))
    end
  end

  describe '#is_new_arrival' do
    context 'publication_dateが今日の場合' do
      let(:project) { create(:project, publication_date: Time.zone.today) }

      it 'returns true' do
        expect(decorated_project.is_new_arrival).to be(true)
      end
    end

    context 'publication_dateが昨日の場合' do
      let(:project) { create(:project, publication_date: Date.yesterday) }

      it 'returns false' do
        expect(decorated_project.is_new_arrival).to be(false)
      end
    end
  end

  describe '#url' do
    it 'returns the URL of the project' do
      expect(decorated_project.url).to eq("#{ENV.fetch('CLIENT_ORIGIN')}/projects/#{project.uuid}")
    end
  end

  describe 'is_favorite?' do
    context 'userがnilの場合' do
      it 'returns false' do
        expect(decorated_project.is_favorite?(nil)).to be(false)
      end
    end

    context 'userがnilでない場合' do
      let(:user) { create(:user) }

      context 'お気に入り登録されている場合' do
        before { create(:favorite, user: user, project: project) }

        it 'returns true' do
          expect(decorated_project.is_favorite?(user)).to be(true)
        end
      end

      context 'お気に入り登録されていない場合' do
        it 'returns false' do
          expect(decorated_project.is_favorite?(user)).to be(false)
        end
      end
    end
  end

  describe 'is_summarized?' do
    context 'userがnilの場合' do
      it 'returns false' do
        expect(decorated_project.is_summarized?(nil)).to be(false)
      end
    end

    context 'companyがnilの場合' do
      let(:user) { create(:user) }

      it 'returns false' do
        expect(decorated_project.is_summarized?(user)).to be(false)
      end
    end

    context 'userがnilでない場合' do
      let(:company) { create(:company) }
      let(:user) { create(:user, company:) }

      context 'サマリ済の場合' do
        before { create(:project_summary_usage, company: company, project: project) }

        it 'returns true' do
          expect(decorated_project.is_summarized?(user)).to be(true)
        end
      end

      context '未サマリの場合' do
        it 'returns false' do
          expect(decorated_project.is_summarized?(user)).to be(false)
        end
      end
    end
  end

  describe 'has_browsed?' do
    context '閲覧済みの場合' do
      let(:user) { create(:user) }

      it 'true を返すこと' do
        create(:browsing_history, user: user, browsable: project)
        expect(decorated_project.has_browsed?(user)).to be(true)
      end
    end

    context '未閲覧の場合' do
      let(:user) { create(:user) }

      it 'false を返すこと' do
        expect(decorated_project.has_browsed?(user)).to be(false)
      end
    end
  end
end
