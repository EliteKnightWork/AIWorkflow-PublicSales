#!/bin/bash

set -eu

# --- Usage and Input Validation ---
if [ $# -ne 2 ]; then
  echo "Usage: $0 <parquet_source_directory> <csv_output_directory>"
  echo "  <parquet_source_directory>: Directory containing table subdirectories with Parquet files."
  echo "  <csv_output_directory>:     Directory where CSV files will be created."
  exit 1
fi

PARQUET_DIR="$1"
CSV_DIR="$2"

if [ ! -d "$PARQUET_DIR" ]; then
  echo "Error: Parquet source directory '${PARQUET_DIR}' not found."
  exit 1
fi

# --- Prerequisite Check ---
if ! command -v duckdb &> /dev/null; then
    echo "Error: 'duckdb' command not found. Please install it first."
    echo "On macOS, you can use: brew install duckdb"
    exit 1
fi

# --- Main Logic ---
echo "Starting Parquet to CSV conversion."
echo "Source: ${PARQUET_DIR}"
echo "Output: ${CSV_DIR}"

mkdir -p "${CSV_DIR}"

DB_NAME=$(basename "${PARQUET_DIR}")

for TABLE_DIR in "${PARQUET_DIR}"/*/; do
  if [ ! -d "${TABLE_DIR}" ]; then
    continue
  fi

  DIR_BASENAME=$(basename "${TABLE_DIR}")
  # The directory name from S3 export is often "database.table", so we extract just the table part.
  TABLE_NAME=${DIR_BASENAME#"${DB_NAME}."}
  CSV_FILE_PATH="${CSV_DIR}/${TABLE_NAME}.csv"

  echo "----------------------------------------"
  echo "Processing table: ${TABLE_NAME} (from ${DIR_BASENAME})"

  if [ -z "$(find "${TABLE_DIR}" -name '*.parquet' -print -quit)" ]; then
      echo "  -> No .parquet files found. Skipping."
      continue
  fi

  if [ "${TABLE_NAME}" != "projects" ]; then
    continue
  fi

  echo "  -> Converting to ${CSV_FILE_PATH}"

  # 特定テーブルのカラムを置換
  if [ "${TABLE_NAME}" = "external_documents" ]; then
    echo "  -> Replacing text column with 'hoge' for external_documents table"
    duckdb :memory: "COPY (SELECT id, attachable_type, attachable_id, 'hoge' as text, is_processed, created_at, updated_at FROM read_parquet('${TABLE_DIR}/**/*.parquet', union_by_name=true)) TO '${CSV_FILE_PATH}' (HEADER, DELIMITER ',', TIMESTAMPFORMAT '%Y-%m-%d %H:%M:%S');"
  elif [ "${TABLE_NAME}" = "project_embeddings" ]; then
    echo "  -> Replacing raw_text with 'hoge' and embedding with '{}' for project_embeddings table"
    duckdb :memory: "COPY (SELECT id, project_id, 'hoge' as raw_text, '{}' as embedding, embedding_type, created_at, updated_at FROM read_parquet('${TABLE_DIR}/**/*.parquet', union_by_name=true)) TO '${CSV_FILE_PATH}' (HEADER, DELIMITER ',', TIMESTAMPFORMAT '%Y-%m-%d %H:%M:%S');"
  elif [ "${TABLE_NAME}" = "projects" ]; then
    echo "  -> Replacing description with 'hoge' for projects table"
    duckdb :memory: "COPY (SELECT id, uuid, ulid, key, title, raw_title, 'hoge' as description, summary, organization_name, organization_id, lg_code, prefecture_name, city_code, city_name, procedure_type, procedure_type_group, source, external_document_url, publication_date, registration_date, briefing_session_date, application_document_deadline_date, proposal_document_deadline_date, bidding_deadline_date, tender_opening_date, delivery_deadline_date, is_backfilled, hidden_at, participation_qualification, is_experience_required, is_office_required, planned_price, keywords, created_at, updated_at FROM read_parquet('${TABLE_DIR}/**/*.parquet', union_by_name=true)) TO '${CSV_FILE_PATH}' (HEADER, DELIMITER ',', TIMESTAMPFORMAT '%Y-%m-%d %H:%M:%S');"
  else
    duckdb :memory: "COPY (SELECT * FROM read_parquet('${TABLE_DIR}/**/*.parquet', union_by_name=true)) TO '${CSV_FILE_PATH}' (HEADER, DELIMITER ',', TIMESTAMPFORMAT '%Y-%m-%d %H:%M:%S');"
  fi

  echo "  -> Done."
done

echo "----------------------------------------"
echo "Conversion completed successfully. CSV files are in '${CSV_DIR}'."
