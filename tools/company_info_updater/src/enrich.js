#!/usr/bin/env node
'use strict';

const process = require('process');
const { google } = require('googleapis');
const dotenv = require('dotenv');

dotenv.config();

if (typeof fetch !== 'function') {
  console.error('Global fetch API is not available. Use Node.js 18 or later.');
  process.exit(1);
}

const CONFIG = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
  SEARCH_ENGINE_ID: process.env.SEARCH_ENGINE_ID || '',

  START_ROW: Number(process.env.START_ROW || 2),
  COMPANY_COLUMN: 5, // E
  URL_COLUMN: 7, // G
  ADDRESS_COLUMN: 8, // H
  REP_COLUMN: 9, // I
  TEL_COLUMN: 10, // J
  SALES_COLUMN: 11, // K
  CAPITAL_COLUMN: 12, // L
  EMPLOYEES_COLUMN: 13, // M

  BATCH_SIZE: Number(process.env.BATCH_SIZE || 16),
  SEARCH_DELAY: Number(process.env.SEARCH_DELAY || 200),

  DEBUG: process.env.DEBUG ? process.env.DEBUG === 'true' : true,
  LOG_SHEET_NAME: process.env.LOG_SHEET_NAME || 'LOG',
  LOG_TRUNCATE_BODY_AT: Number(process.env.LOG_TRUNCATE_BODY_AT || 800),
  TIME_ZONE: process.env.TIME_ZONE || 'Asia/Tokyo',

  SITE_CANDIDATE_PATHS: [
    'company','about','corporate','profile','outline','overview',
    '会社概要','企業情報','会社情報'
  ],
  EXCLUDED_DOMAINS: [
    'twitter.com','x.com','facebook.com','instagram.com','linkedin.com',
    'wantedly.com','openwork.jp','mynavi','rikunabi','en-japan',
    'note.com','wikipedia.org','njss.info','www2.njss.info','nsearch.jp'
  ],
  PREF_LIST: ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県']
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const spreadsheetId = args['spreadsheet-id'] || args.spreadsheet || process.env.SPREADSHEET_ID;
  const sheetName = args.sheet || process.env.SHEET_NAME;
  const limit = args.limit ? Number(args.limit) : undefined;
  const dryRun = args['dry-run'] || false;
  const startRow = args['start-row'] ? Number(args['start-row']) : CONFIG.START_ROW;

  if (!spreadsheetId) {
    console.error('Missing spreadsheet id. Use --spreadsheet-id or set SPREADSHEET_ID.');
    process.exit(1);
  }
  if (!sheetName) {
    console.error('Missing sheet name. Use --sheet or set SHEET_NAME.');
    process.exit(1);
  }
  if (!Number.isFinite(startRow) || startRow < 1) {
    console.error('Invalid start row.');
    process.exit(1);
  }

  CONFIG.START_ROW = startRow;

  if (!CONFIG.GEMINI_API_KEY) {
    console.warn('[WARN] GEMINI_API_KEY is not set. Grounding requests will be skipped.');
  }
  if (!CONFIG.GOOGLE_API_KEY || !CONFIG.SEARCH_ENGINE_ID) {
    console.warn('[WARN] GOOGLE_API_KEY or SEARCH_ENGINE_ID is not set. Custom Search fallback will fail.');
  }

  const sheets = await createSheetsClient();
  const ctx = {
    sheets,
    spreadsheetId,
    sheetName,
    config: CONFIG,
    dryRun
  };

  await addHeadersIfNeeded(ctx);
  await enrichAllCompanies(ctx, { limit });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

function parseArgs(argv) {
  const result = {};
  let pendingKey = null;
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      if (value !== undefined) {
        result[toCamel(key)] = value;
      } else {
        pendingKey = toCamel(key);
        result[pendingKey] = true;
      }
    } else if (pendingKey) {
      result[pendingKey] = arg;
      pendingKey = null;
    }
  }
  return result;
}

function toCamel(key) {
  return key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

async function createSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/cloud-platform'
    ]
  });
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

async function enrichAllCompanies(ctx, options = {}) {
  const { sheets, spreadsheetId, sheetName, config } = ctx;
  const limit = options.limit != null ? Number(options.limit) : undefined;

  const range = `${sheetName}!A${config.START_ROW}:M`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range
  });
  const rows = res.data.values || [];

  let processed = 0;
  let errors = 0;
  const updates = [];

  for (let idx = 0; idx < rows.length; idx += 1) {
    if (limit !== undefined && processed >= limit) break;

    const rowNumber = config.START_ROW + idx;
    const row = rows[idx] || [];
    const company = row[config.COMPANY_COLUMN - 1];
    if (!company) continue;

    if (processed && processed % config.BATCH_SIZE === 0) {
      await flushUpdates(ctx, updates);
      await sleep(config.SEARCH_DELAY * 2);
    }

    await logRow(ctx, rowNumber, company, 'INFO', '--- 処理開始（一括） ---');

    try {
      const info = await fetchCompanyInfoBundle(ctx, company, rowNumber);
      queueInfoUpdate(updates, sheetName, rowNumber, info, config);
      processed += 1;
      await sleep(config.SEARCH_DELAY);
      await logRow(ctx, rowNumber, company, 'INFO', '--- 処理完了（一括） ---');
    } catch (error) {
      errors += 1;
      queueErrorUpdate(updates, sheetName, rowNumber, error, config);
      await logRow(ctx, rowNumber, company, 'ERROR', `例外: ${formatError(error)}`);
      if (errors > 10) {
        console.error('Too many errors (>10). Aborting.');
        break;
      }
    }

    if (updates.length >= config.BATCH_SIZE) {
      await flushUpdates(ctx, updates);
    }
  }

  if (updates.length) {
    await flushUpdates(ctx, updates);
  }

  console.log(`✅ 完了 / 処理件数: ${processed} / エラー: ${errors}`);
}

async function flushUpdates(ctx, updates) {
  if (!updates.length) return;
  if (ctx.dryRun) {
    updates.length = 0;
    return;
  }
  const data = updates.splice(0, updates.length);
  await ctx.sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: ctx.spreadsheetId,
    requestBody: {
      valueInputOption: 'RAW',
      data
    }
  });
}

function queueInfoUpdate(updates, sheetName, rowNumber, info, config) {
  const range = `${sheetName}!${columnLetter(config.URL_COLUMN)}${rowNumber}:${columnLetter(config.EMPLOYEES_COLUMN)}${rowNumber}`;
  const rowValues = info ? [
    info.url || '',
    info.address || '不明',
    info.representative || '不明',
    info.tel || '不明',
    info.sales || '非公開/不明',
    info.capital || '不明',
    info.employees || '不明'
  ] : ['', '', '', '', '', '', ''];
  updates.push({ range, values: [rowValues] });
}

function queueErrorUpdate(updates, sheetName, rowNumber, error, config) {
  const range = `${sheetName}!${columnLetter(config.URL_COLUMN)}${rowNumber}:${columnLetter(config.EMPLOYEES_COLUMN)}${rowNumber}`;
  const rowValues = [`エラー: ${formatError(error)}`, '', '', '', '', '', ''];
  updates.push({ range, values: [rowValues] });
}

function columnLetter(index) {
  let n = Number(index);
  let result = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

async function fetchCompanyInfoBundle(ctx, companyName, rowIndex) {
  const { config } = ctx;
  const useGrounding = Boolean(config.GEMINI_API_KEY);
  let url = '', address = '', representative = '', tel = '', sales = '', capital = '', employees = '';

  if (useGrounding) {
    const result = await groundedBundle(ctx, companyName, rowIndex);
    if (result) {
      url = result.url || '';
      address = result.address || '';
      representative = result.representative || '';
      tel = result.tel || '';
      sales = result.sales || '';
      capital = result.capital || '';
      employees = result.employees || '';
    }
  } else {
    await logRow(ctx, rowIndex, companyName, 'WARN', 'Gemini API未設定 → CSEへフォールバック');
  }

  if (url && !isGovOrPdf(url)) {
    await logRow(ctx, rowIndex, companyName, 'INFO', `URL確定(Gemini): ${url}`);
  } else {
    await logRow(ctx, rowIndex, companyName, 'INFO', 'URL不足 → CSEフォールバック');
    const site = await resolveOfficialSiteSmart(ctx, companyName, rowIndex);
    url = filterOfficialUrlOrEmpty(site);
    await logRow(ctx, rowIndex, companyName, 'INFO', `CSE URL候補: ${url || '(なし)'}`);
  }

  const needHtml = !address || !representative || !tel || !sales || !capital || !employees;
  let profileUrl = '';
  let html1 = null;

  if (needHtml && url) {
    profileUrl = await resolveCompanyProfileUrl(ctx, url);
    if (profileUrl) {
      await logRow(ctx, rowIndex, companyName, 'DEBUG', `会社概要候補=${profileUrl}`);
      html1 = await safeFetchHtml(profileUrl, ctx);
    }

    const before = { address, representative, tel, sales, capital, employees };
    if (!address) address = extractAddress(html1);
    if (!representative) representative = extractRepresentative(html1);
    if (!tel) tel = extractTel(html1);
    if (!sales) sales = extractSales(html1);
    if (!capital) capital = extractCapital(html1);
    if (!employees) employees = extractEmployees(html1);
    for (const [k, v] of Object.entries({ address, representative, tel, sales, capital, employees })) {
      if (!before[k] && v) await logRow(ctx, rowIndex, companyName, 'DEBUG', `HTML補完 ${k}=${v}`);
    }
  }

  if (needHtml && url && (!address || !representative || !tel || !sales || !capital || !employees)) {
    const second = await searchCompanyProfileByCse(ctx, url, rowIndex);
    if (second && second !== profileUrl) {
      await logRow(ctx, rowIndex, companyName, 'INFO', `会社概要 再探索ヒット: ${second}`);
      const html2 = await safeFetchHtml(second, ctx);
      const b2 = { address, representative, tel, sales, capital, employees };
      address = address || extractAddress(html2);
      representative = representative || extractRepresentative(html2);
      tel = tel || extractTel(html2);
      sales = sales || extractSales(html2);
      capital = capital || extractCapital(html2);
      employees = employees || extractEmployees(html2);
      for (const [k, v] of Object.entries({ address, representative, tel, sales, capital, employees })) {
        if (!b2[k] && v) await logRow(ctx, rowIndex, companyName, 'DEBUG', `2nd補完 ${k}=${v}`);
      }
    }
  }

  const gOut = filterOfficialUrlOrEmpty(profileUrl || url);
  if (!gOut) await logRow(ctx, rowIndex, companyName, 'INFO', 'G列: gov/PDFのため空出力');

  return {
    url: gOut || '',
    address: address || '不明',
    representative: representative || '不明',
    tel: tel || '不明',
    sales: sales || '非公開/不明',
    capital: capital || '不明',
    employees: employees || '不明'
  };
}

async function groundedBundle(ctx, companyName, rowIndex) {
  if (!ctx.config.GEMINI_API_KEY) return null;
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  const prompt = `\nあなたは日本企業情報の抽出アシスタントです。対象企業:「${companyName}」。\ngoogle_search と url_context を使い、信頼できる一次情報（会社公式サイト、会社概要ページ、EDINET/IR等）を優先して参照してください。\n次の JSON だけを返してください。説明文や余計なテキストは出力しないこと。\n\n{\n  "url": "<公式コーポレートサイトのトップURL。*.go.jp/*.lg.jpやPDFは空文字>",\n  "address": "<本社住所。テナント名・フロアがあれば含めても可>",\n  "representative": "<代表取締役/代表者の氏名のみ（肩書除く）>",\n  "tel": "<代表電話。0X-XXXX-XXXX形式に近いもの>",\n  "sales": "<最新の売上高（分かれば連結優先）〜円。なければ空>",\n  "capital": "<資本金〜円。なければ空>",\n  "employees": "<従業員数。分かれば「連結/単体」表記を含める。なければ空>"\n}\n\n制約:\n- url は *.go.jp / *.lg.jp を採用しない。PDFも不可。見つからない場合は空文字。\n- SNS/求人サイト/まとめサイトは不可。\n- 値が見つからない項目は空文字 "" を返す。\n- 日本語で。\n`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    tools: [{ google_search: {} }, { url_context: {} }],
    generationConfig: { temperature: 0.1 }
  };

  const parseLooseJson = (txt) => {
    if (!txt) return null;
    const cleaned = txt.replace(/```json/gi, '').replace(/```/g, '').trim();
    try { return JSON.parse(cleaned); } catch (_) {}
    const m = cleaned.match(/\{[\s\S]*\}/);
    try { return m ? JSON.parse(m[0]) : null; } catch (_) { return null; }
  };

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await logRow(ctx, rowIndex, companyName, 'DEBUG', `[Grounding] 一括リクエスト送信 try=${attempt}`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': ctx.config.GEMINI_API_KEY
        },
        body: JSON.stringify(payload)
      });

      const body = await response.text();
      await logRow(ctx, rowIndex, companyName, 'DEBUG', `[Grounding] HTTP ${response.status} bodyHead=${body.substring(0, ctx.config.LOG_TRUNCATE_BODY_AT)}`);

      if (response.status >= 400) {
        if (attempt === 1) {
          await logRow(ctx, rowIndex, companyName, 'WARN', 'HTTPエラー → ツール無しフォールバック');
          payload.tools = [];
          continue;
        }
        return null;
      }

      let data;
      try { data = JSON.parse(body); } catch (_) { data = undefined; }
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const joined = parts.map(p => p.text || '').join('') || '';
      if (!joined) {
        await logRow(ctx, rowIndex, companyName, 'WARN', '一括 応答parts空');
        return null;
      }

      const obj = parseLooseJson(joined) || {};
      const rawUrl = obj.url || '';
      const url1 = extractHttpUrl(rawUrl);
      const url2 = stripTrailingPunct(url1);
      const url3 = normalizeUrlAscii(url2);
      obj.url = filterOfficialUrlOrEmpty(toRootUrl(url3)) || '';

      obj.address = cleanup(obj.address || '');
      obj.representative = cleanup(obj.representative || '');
      obj.tel = normalizePhone(obj.tel || '');
      obj.sales = cleanup(obj.sales || '');
      obj.capital = cleanup(obj.capital || '');
      obj.employees = cleanup(obj.employees || '');

      await logRow(ctx, rowIndex, companyName, 'INFO', `一括 値: url=${obj.url || '(空)'} / addr=${obj.address || '(空)'} / rep=${obj.representative || '(空)'} / tel=${obj.tel || '(空)'} / sales=${obj.sales || '(空)'} / cap=${obj.capital || '(空)'} / emp=${obj.employees || '(空)'}`);
      return obj;

    } catch (error) {
      await logRow(ctx, rowIndex, companyName, 'ERROR', `一括 例外: ${formatError(error)}`);
      return null;
    }
  }
  return null;
}

async function resolveOfficialSiteSmart(ctx, companyName, rowIndex) {
  const queries = [`${companyName}`, `${companyName} 公式`, `${companyName} コーポレート`, `${companyName} 会社概要`];
  let pick = null;
  let bestScore = -1;

  for (const q of queries) {
    await logRow(ctx, rowIndex, companyName, 'DEBUG', `[CSE] q="${q}"`);
    const items = await cse(ctx, q, 10) || [];
    for (const it of items) {
      const link = it.link || '';
      const title = it.title || '';
      const snippet = it.snippet || '';

      if (!/^https?:\/\//i.test(link)) continue;
      if (!parseHost(link)) {
        await logRow(ctx, rowIndex, companyName, 'DEBUG', `[CSE] URL不正除外 ${link}`);
        continue;
      }
      if (isGovOrPdf(link)) {
        await logRow(ctx, rowIndex, companyName, 'DEBUG', `[CSE] gov/PDF除外 ${link}`);
        continue;
      }
      if (isExcludedDomain(link, `${title} ${snippet}`)) {
        await logRow(ctx, rowIndex, companyName, 'DEBUG', `[CSE] 除外(ドメイン/求人/SNS等) ${link}`);
        continue;
      }

      const s = scoreOfficialCandidate(link, title, snippet, companyName);
      await logRow(ctx, rowIndex, companyName, 'DEBUG', `[CSE] 候補 ${link} score=${s}`);
      if (s > bestScore) { bestScore = s; pick = link; }
    }
    if (bestScore >= 60) break;
  }
  await logRow(ctx, rowIndex, companyName, 'INFO', `[CSE] 最良候補=${pick || '(なし)'} score=${bestScore}`);
  return pick ? toRootUrl(pick) : null;
}

async function resolveCompanyProfileUrl(ctx, siteRoot) {
  for (const p of ctx.config.SITE_CANDIDATE_PATHS) {
    const url = joinUrl(siteRoot, p);
    if (isGovOrPdf(url)) continue;
    const html = await safeFetchHtml(url, ctx);
    if (html && /会社概要|企業情報|会社情報|Company|Corporate|Profile|Outline|Overview/i.test(html)) {
      return url;
    }
  }
  return null;
}

async function searchCompanyProfileByCse(ctx, siteRoot, rowIndex) {
  const domain = toDomain(siteRoot);
  const q = `site:${domain} (会社概要 OR 企業情報 OR 会社情報 OR corporate OR company OR profile OR outline)`;
  await logRow(ctx, rowIndex, domain, 'DEBUG', `[CSE] 再探索 q="${q}"`);
  const items = await cse(ctx, q, 5) || [];
  const pick = items.find(it => {
    if (isGovOrPdf(it.link)) return false;
    return /会社概要|企業情報|会社情報|Corporate|Company|Profile|Outline|Overview/i.test(`${it.title} ${it.snippet}`);
  });
  return pick ? pick.link : null;
}

async function cse(ctx, query, num) {
  if (!ctx.config.GOOGLE_API_KEY || !ctx.config.SEARCH_ENGINE_ID) return null;
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(ctx.config.GOOGLE_API_KEY)}&cx=${encodeURIComponent(ctx.config.SEARCH_ENGINE_ID)}&q=${encodeURIComponent(query)}&num=${num || 10}`;
  try {
    const res = await fetch(url, { headers: { 'accept': 'application/json' } });
    const body = await res.text();
    await logRow(ctx, null, '(CSE)', 'DEBUG', `HTTP ${res.status} query="${query}" bodyHead="${body.substring(0,200)}"`);
    if (res.status >= 400) return null;
    const data = JSON.parse(body);
    const items = (data.items || []).filter(it => !ctx.config.EXCLUDED_DOMAINS.some(d => (it.link || '').includes(d)));
    return items;
  } catch (error) {
    await logRow(ctx, null, '(CSE)', 'ERROR', `CSE例外: ${formatError(error)}`);
    return null;
  }
}

async function safeFetchHtml(url, ctx) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (CloudRunJob)' }
    });
    if (res.status >= 200 && res.status < 400) {
      const text = await res.text();
      return stripHtmlNoise(text);
    }
    await logRow(ctx, null, '(HTML)', 'WARN', `Fetch ${res.status} ${url}`);
  } catch (error) {
    await logRow(ctx, null, '(HTML)', 'ERROR', `fetch例外 ${url} ${formatError(error)}`);
  }
  return null;
}

function stripHtmlNoise(html) {
  if (!html) return '';
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/&nbsp;|&emsp;|&ensp;|&thinsp;/g, ' ')
    .replace(/\s+/g, ' ');
}

function extractAddress(html) {
  if (!html) return '';
  const prefAlt = CONFIG.PREF_LIST.join('|');
  const key = '(所在地|本社所在地|本社|住所)[:：]?[\\s　]*';
  const rx1 = new RegExp(`${key}((?:${prefAlt}).{10,120}?)\\s{0,10}(?:代表者|代表取締役|資本金|設立|電話|TEL|創業|従業員|FAX)`, 'i');
  const m1 = html.match(rx1); if (m1) return cleanup(m1[1]);
  const rx2 = new RegExp(`((?:${prefAlt}).{10,140}?)\\s{0,10}(?:代表者|代表取締役|資本金|設立|電話|TEL|FAX)`, 'i');
  const m2 = html.match(rx2); if (m2) return cleanup(m2[1]);
  return '';
}

function extractRepresentative(html) {
  if (!html) return '';
  let m = html.match(/代表取締役[^\w一-龠ぁ-んァ-ン]*[:：]?\s*([一-龠ぁ-んァ-ンA-Za-z・\s　]{2,20})/); if (m) return cleanup(m[1]);
  m = html.match(/代表者[^\w一-龠ぁ-んァ-ン]*[:：]?\s*([一-龠ぁ-んァ-ンA-Za-z・\s　]{2,20})/); if (m) return cleanup(m[1]);
  m = html.match(/代表取締役\s*社長[^\w]*[:：]?\s*([一-龠ぁ-んァ-ンA-Za-z・\s　]{2,20})/); if (m) return cleanup(m[1]);
  return '';
}

function extractTel(html) {
  if (!html) return '';
  let m = html.match(/(?:電話|TEL)[^\d]*(0\d{1,4}[-−–‐]?\d{1,4}[-−–‐]?\d{3,4})/i); if (m) return normalizePhone(m[1]);
  m = html.match(/(0\d{1,4}[-−–‐]?\d{1,4}[-−–‐]?\d{3,4})/); if (m) return normalizePhone(m[1]);
  return '';
}

function extractSales(html) {
  if (!html) return '';
  const p1 = /(売上高|売上)[^0-9一二三四五六七八九十兆億万]*([0-9,\.]+)\s*(兆|億|万)?\s*円?/;
  const m1 = html.match(p1); if (m1) return `${m1[2]}${m1[3] || ''}円`;
  const p2 = /連結?売上高[^0-9一二三四五六七八九十兆億万]*([0-9,\.]+)\s*(兆|億|万)?\s*円?/;
  const m2 = html.match(p2); if (m2) return `連結 ${m2[1]}${m2[2] || ''}円`;
  if (/非公開|未公表/i.test(html)) return '非公開';
  return '';
}

function extractCapital(html) {
  if (!html) return '';
  const p1 = /資本金[^0-9一二三四五六七八九十兆億万千百]*([0-9,\.]+)\s*(兆|億|万|千|百)?\s*円?/i;
  const m1 = html.match(p1);
  if (m1) return `${m1[1]}${m1[2] || ''}円`;
  if (/資本金\s*非公開|未公表/i.test(html)) return '非公開';
  return '';
}

function extractEmployees(html) {
  if (!html) return '';
  const p1 = /(連結)?\s*(従業員数|従業員|社員数)[^\d]*([0-9,，．\.]+)\s*(名|人)?/i;
  const m1 = html.match(p1);
  if (m1) {
    const scope = m1[1] ? '連結 ' : '';
    const num = String(m1[3] || '').replace(/[，．]/g, ',');
    return `${scope}${num}名`;
  }
  return '';
}

async function addHeadersIfNeeded(ctx) {
  const { sheets, spreadsheetId, sheetName, config } = ctx;
  const range = `${sheetName}!A1:${columnLetter(config.EMPLOYEES_COLUMN)}1`;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const header = (res.data.values && res.data.values[0]) || [];
  const updates = [];

  const setIfEmpty = (col, name) => {
    if (!header[col - 1]) {
      updates.push({
        range: `${sheetName}!${columnLetter(col)}1:${columnLetter(col)}1`,
        values: [[name]]
      });
    }
  };

  setIfEmpty(config.COMPANY_COLUMN, '会社名');
  setIfEmpty(config.URL_COLUMN, '公式サイトURL/会社概要URL');
  setIfEmpty(config.ADDRESS_COLUMN, '住所');
  setIfEmpty(config.REP_COLUMN, '代表者名');
  setIfEmpty(config.TEL_COLUMN, '電話番号');
  setIfEmpty(config.SALES_COLUMN, '売上');
  setIfEmpty(config.CAPITAL_COLUMN, '資本金');
  setIfEmpty(config.EMPLOYEES_COLUMN, '従業員数');

  if (updates.length && !ctx.dryRun) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates
      }
    });
  }
}

async function logRow(ctx, row, company, level, message, field) {
  if (!ctx.config.DEBUG) return;

  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: ctx.config.TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const timestamp = formatter.format(new Date()).replace(/\//g, '-');

  const parts = [
    `[${timestamp}]`,
    `[${level || 'INFO'}]`
  ];
  if (row != null) parts.push(`row=${row}`);
  if (company) parts.push(`company=${company}`);
  if (field) parts.push(`field=${field}`);
  if (message) parts.push(message);

  console.log(parts.join(' '));
}

function cleanup(s) {
  return String(s || '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[|｜]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePhone(s) {
  return String(s || '').replace(/[−–‐]/g, '-').replace(/--+/g, '-').trim();
}

function parseHost(u) {
  const s = String(u || '').trim();
  const m = s.match(/^[a-zA-Z][a-zA-Z0-9+.\-]*:\/\/([^\/\s?#]+)/);
  return m ? m[1].toLowerCase() : '';
}

function parseProto(u) {
  const m = String(u || '').match(/^([a-zA-Z][a-zA-Z0-9+.\-]*):\/\//);
  return m ? (m[1].toLowerCase() + '://') : 'https://';
}

function toDomain(u) { return parseHost(u) || u; }

function toRootUrl(u) {
  const host = parseHost(u);
  if (!host) return '';
  return parseProto(u) + host;
}

function getPathDepth(link) {
  const s = String(link || '');
  const m = s.match(/^[a-zA-Z][a-zA-Z0-9+.\-]*:\/\/[^\/\s?#]+(\/[^?#]*)?/);
  const path = m ? (m[1] || '') : '';
  const norm = path.replace(/\/+$/, '');
  if (!norm || norm === '/') return 0;
  return norm.split('/').filter(Boolean).length;
}

function normalizeCompanyKey(name) {
  return String(name)
    .replace(/株式会社|（株）|\(株\)|有限会社|合同会社|Inc\.?|Co\.?|Ltd\.?/gi, '')
    .replace(/[・\s　]/g, '')
    .toLowerCase();
}

function isExcludedDomain(link, text) {
  const l = (link || '').toLowerCase();
  if (CONFIG.EXCLUDED_DOMAINS.some(d => l.includes(d))) return true;
  if (/(採用|求人|口コミ|転職|インターン|エントリー)/i.test(text || '')) return true;
  return false;
}

function normalizeUrlAscii(s) {
  let t = String(s || '');
  t = t.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '');
  t = t.replace(/[\u0000-\u001F\u007F]/g, '');
  t = t.replace(/：/g, ':').replace(/／/g, '/').replace(/．/g, '.');
  t = t.replace(/（/g, '(').replace(/）/g, ')').replace(/［/g, '[').replace(/］/g, ']');
  t = t.replace(/[“”]/g, '"').replace(/[‘’＇]/g, "'");
  return t.trim();
}

function extractHttpUrl(s) {
  const txt = normalizeUrlAscii(s);
  const m = txt.match(/https?:\/\/[^\s<>'\"()]+/i);
  return m ? m[0] : txt;
}

function stripTrailingPunct(u) {
  return String(u || '').replace(/[)\]\}>"'。、．・。､，]+$/, '').trim();
}

function isPdfUrl(u) { return /\.pdf(?:$|\?)/i.test(normalizeUrlAscii(String(u))); }

function isGovHost(host) { return /\.go\.jp$/.test(host || '') || /\.lg\.jp$/.test(host || ''); }

function isGovOrPdf(u) {
  const s = normalizeUrlAscii(String(u || '').trim());
  if (!s) return true;
  if (isPdfUrl(s)) return true;
  const h = parseHost(s);
  if (!h) return true;
  return isGovHost(h);
}

function filterOfficialUrlOrEmpty(u) {
  const s = normalizeUrlAscii(String(u || '').trim());
  if (!s || isPdfUrl(s)) return '';
  const h = parseHost(s);
  if (!h || isGovHost(h)) return '';
  return s;
}

function joinUrl(root, path) {
  try {
    if (!/\/$/.test(root)) root += '/';
    path = String(path).replace(/^\//, '');
    return root + encodeURI(path);
  } catch (e) {
    return root + '/' + path;
  }
}

function scoreOfficialCandidate(link, title, snippet, companyName) {
  const t = (title + ' ' + snippet).toLowerCase();
  const host = parseHost(link) || link.toLowerCase();
  let s = 0;
  if (host.endsWith('.co.jp')) s += 30; else if (/\.(jp)$/.test(host)) s += 20;
  const key = normalizeCompanyKey(companyName);
  const raw = companyName.toLowerCase().replace(/[・\s　]/g, '');
  if (key && host.includes(key)) s += 25;
  if (raw && t.includes(raw)) s += 20;
  if (key && t.includes(key)) s += 10;
  if (/会社概要|企業情報|会社情報|corporate|company|profile|outline|overview/.test(t)) s += 8;
  const depth = getPathDepth(link); if (depth <= 1) s += 10; else if (depth >= 3) s -= 8;
  if (/recruit|採用|career|jobs|エントリー/.test(t)) s -= 30;
  if (/facebook|instagram|twitter\.com|x\.com|linkedin|wantedly|openwork|mynavi|rikunabi|en-japan|note\.com/.test(link)) s -= 100;
  if (/yahoo|rakuten|amazon|tabelog|hotpepper|goo\.ne\.jp|livedoor/.test(host)) s -= 20;
  if (/\/news\/|\/ir\/|\/press|\/inquiry|\/contact/.test(link.toLowerCase())) s -= 5;
  if (isGovHost(host) || isPdfUrl(link)) s -= 999;
  return s;
}

function formatError(error) {
  if (!error) return 'unknown';
  if (error instanceof Error) return error.stack || error.message;
  if (typeof error === 'object') {
    try { return JSON.stringify(error); } catch (_) { return error.toString(); }
  }
  return String(error);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
