namespace :project do
  desc "指定された attachable_id の ExternalDocuments でプロンプトを実行"
  task verify_prompt: :environment do
    Rails.logger.level = :info
    uuids = ENV['UUIDS']
    if uuids.nil?
      puts "attachable_ids を指定してください。例えば: rake project:verify_prompt UUIDS=\"1,2,3\""
      return
    end

    file_name = "projects_#{Time.zone.now.strftime('%Y%m%d%H%M%S')}.tsv"
    file_path = Rails.root.join('tmp', file_name)

    projects=[]

    uuids.split(',').each do |uuid|
      uuid.strip! # 空白を削除

      project = Project.find_by(uuid: uuid)

      if project.nil?
        puts "入札情報が見つかりませんでした: #{uuid}"
        next
      end
      Rails.logger.info("処理開始: #{project.title} (#{project.uuid})")

      texts = project.aggregate_external_document_texts()

      if  texts.blank? && project.description.blank?
        puts "テキスト情報がありませんでした"
        next
      end

      cnt = 0

      while cnt < 3
        response = LlmProjectDateExtractor.extract(project.description + texts)
        if cnt < 2 && (response["tenderAnnouncementDate"].empty? || !response["tenderAnnouncementDate"].match?(/^\d{4}年\d{2}月\d{2}日$/))
          cnt +=1
          next
        end
        break
      end
    end

    CSV.open(file_path, 'w', force_quotes: true, col_sep: "\t") do |tsv|
      tsv << %w[id uuid key source title external_document_url organization_name procedure_type publication_date	application_document_deadline_date	proposal_document_deadline_date	bidding_deadline_date]
      projects.each do |project_tuple|
        project=project_tuple[0]
        llm_response=project_tuple[1]
        tsv << [project.id, project.uuid, project.key, project.source, project.title, project.external_document_url, project.organization_name, project.procedure_type, llm_response["tenderAnnouncementDate"], llm_response["applicationDocumentDeadlineDate"], llm_response["proposalDocumentDeadlineDate"], llm_response["biddingDay"] ].map { |str| remove_tab(str) }
      end
    end

    upload_to_s3(file_path, file_name)
  end

  def upload_to_s3(file_path, file_name)
    s3 = Aws::S3::Resource.new
    bucket = s3.bucket(Settings.aws.s3.bucket.llm_tmp)
    obj = bucket.object(file_name)
    obj.upload_file(file_path)

    Rails.logger.info("Uploaded: #{obj.public_url}")
  end

end
