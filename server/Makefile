.PHONY: db-create
db-create:
	@echo "=== データベースを作成しています ==="
	@bundle exec rake db:create

.PHONY: db-drop
db-drop:
	@echo "=== データベースを削除しています ==="
	@bundle exec rake db:drop

.PHONY: db-migrate
db-migrate:
	@echo "=== マイグレーションを実行しています(development) ==="
	@bundle exec rake ridgepole:apply
	@echo "=== マイグレーションを実行しています(test) ==="
	@bundle exec rake ridgepole:apply:test

.PHONY: db-seed
db-seed:
	@echo "=== シードデータを投入しています ==="
	@bundle exec rake db:seed

.PHONY: es-reset
es-reset:
	@echo "=== Elasticsearchのインデックスを初期化しています ==="
	@bundle exec rake elasticsearch:reset_index:all

.PHONY: db-setup
db-setup: db-drop db-create es-reset db-migrate db-seed

# Project統合開発用の一時的なコマンド
.PHONY: project-migrate
project-migrate:
	@echo "=== 落札案件のデータ移行を実行しています ==="
	@rails once_scripts:project_migration:create_projects_from_awarded_projects
	@echo "=== Elasticsearchのインデックスを更新しています ==="
	@rails elasticsearch:update_index:project
