/**
 * scripts/add-brackets.mjs
 * 
 * 目的:
 * 既存の orval では、クエリパラメータに配列を指定した場合、ブラケット([])が付与されず、 Ruby 側でエラーが発生する事象に対する対応スクリプト
 * 
 * 動作:
 * 1. src/api/generated/endpoints 配下の .ts ファイルを対象とする
 * 2. if (Array.isArray(value) && explodeParameters.includes(key)) ブロック内の
 *    normalizedParams.append(key, ...) を normalizedParams.append(`${key}[]`, ...) に置換する
 * 3. 置換後のファイルを src/api/generated/endpoints 配下に保存する
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TARGET_DIR = join(
  __dirname,
  '..',
  'src',
  'api',
  'generated',
  'endpoints'
);

function main() {
  console.log('scripts/add-brackets.mjs を実行します...');

  if (!existsSync(TARGET_DIR)) {
    console.error(`ターゲットディレクトリが存在しません: ${TARGET_DIR}`);
    process.exit(1);
  }

  const entries = readdirSync(TARGET_DIR, { withFileTypes: true });

  entries.forEach((entry) => {
    // 直下の .ts ファイルのみ対象とする
    if (!entry.isFile() || !entry.name.endsWith('.ts')) {
      return;
    }

    const filePath = join(TARGET_DIR, entry.name);
    const original = readFileSync(filePath, 'utf8');
    let modified = original;

    // 対象:
    // if (Array.isArray(value) && explodeParameters.includes(key)) { ... normalizedParams.append(key, ... }
    //
    // この if ブロックの中にある normalizedParams.append(key, ... だけを
    // normalizedParams.append(`${key}[]`, ... に変更する。
    //
    // 1. 該当 if ブロックをすべてマッチさせる
    // 2. そのブロックの中だけで normalizedParams.append(key, を置換する
    const ifBlockRegex =
      /if\s*\(\s*Array\.isArray\(value\)\s*&&\s*explodeParameters\.includes\(key\)\s*\)\s*{[\s\S]*?}/g;

    modified = modified.replace(ifBlockRegex, (ifBlock) => {
      // ブロック内の normalizedParams.append(key, ...) を置換
      return ifBlock.replace(
        /normalizedParams\.append\(\s*key\s*,/g,
        "normalizedParams.append(`${key}[]`,"
      );
    });

    if (modified !== original) {
      writeFileSync(filePath, modified, 'utf8');
    }
  });

  console.log('ブラケットの追加が完了しました。');
}

main();
