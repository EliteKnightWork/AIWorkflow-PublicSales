/***** =========================================================
 *  一括取得版：会社名 → Gemini 1リクエストで7項目まとめて取得（Grounding優先）
 *  - E列(会社名)
 *  - G: 公式サイトURL（.go.jp/.lg.jp/PDFは空）
 *  - H: 住所 / I: 代表者名 / J: 電話番号 / K: 売上 / L: 資本金 / M: 従業員数
 *  - LOGシートに詳細ログ
 * ========================================================= *****/

/***** ========= 設定 ========= *****/
const CONFIG = {
    GEMINI_API_KEY: 'AIzaSyCln5hntT74IH_yo7wVcjLKtnhgQzpFRLY',   // 置換
    GOOGLE_API_KEY: 'AIzaSyCxUjb1UFWmQrpguhFwbrJsJUMflJiy5Yk',   // 置換（フォールバック）
    SEARCH_ENGINE_ID: '40a1df6997d3344ed',                        // 置換
  
    START_ROW: 2,
    COMPANY_COLUMN: 5,      // E
    URL_COLUMN: 7,          // G
    ADDRESS_COLUMN: 8,      // H
    REP_COLUMN: 9,          // I
    TEL_COLUMN: 10,         // J
    SALES_COLUMN: 11,       // K
    CAPITAL_COLUMN: 12,     // L
    EMPLOYEES_COLUMN: 13,   // M
  
    BATCH_SIZE: 16,
    SEARCH_DELAY: 200,      // 短縮（既定300→200）
  
    DEBUG: true,
    LOG_SHEET_NAME: 'LOG',
    LOG_TRUNCATE_BODY_AT: 800,
  
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
  
  /***** ========= メニュー ========= *****/
  function onOpen() {
    SpreadsheetApp.getUi()
      .createMenu('会社情報調査')
      .addItem('全行を実行（1回で7項目）', 'enrichAllCompanies')
      .addItem('選択行だけ実行（1回で7項目）', 'enrichSelectedCompanies')
      .addToUi();
  }
  
  /***** ========= メイン ========= *****/
  function enrichAllCompanies() {
    const sheet = SpreadsheetApp.getActiveSheet();
    addHeadersIfNeeded(sheet);
    const lastRow = sheet.getLastRow();
    let processed = 0, errors = 0;
  
    for (let row = CONFIG.START_ROW; row <= lastRow; row++) {
      const company = val(sheet, row, CONFIG.COMPANY_COLUMN);
      if (!company) continue;
  
      try {
        if (processed && processed % CONFIG.BATCH_SIZE === 0) {
          SpreadsheetApp.flush();
          Utilities.sleep(CONFIG.SEARCH_DELAY * 2);
        }
        logRow(row, company, 'INFO', '--- 処理開始（一括） ---');
  
        const info = fetchCompanyInfoBundle(company, row);
        writeInfo(sheet, row, info);
  
        processed++;
        Utilities.sleep(CONFIG.SEARCH_DELAY);
        logRow(row, company, 'INFO', '--- 処理完了（一括） ---');
      } catch (e) {
        errors++;
        set(sheet, row, CONFIG.URL_COLUMN, `エラー: ${e}`);
        logRow(row, company, 'ERROR', `例外: ${String(e)}`);
        if (errors > 10) break;
      }
    }
    SpreadsheetApp.getUi().alert(`✅ 完了\n処理件数: ${processed}\nエラー: ${errors}`);
  }
  
  function enrichSelectedCompanies() {
    const sheet = SpreadsheetApp.getActiveSheet();
    addHeadersIfNeeded(sheet);
    const ranges = sheet.getActiveRangeList()?.getRanges() || [];
    let processed = 0, errors = 0;
  
    ranges.forEach(r => {
      const start = r.getRow();
      const rows = r.getNumRows();
      for (let i=0;i<rows;i++){
        const row = start+i;
        if (row < CONFIG.START_ROW) continue;
        const company = val(sheet, row, CONFIG.COMPANY_COLUMN);
        if (!company) continue;
  
        try {
          logRow(row, company, 'INFO', '--- 処理開始（選択・一括） ---');
          const info = fetchCompanyInfoBundle(company, row);
          writeInfo(sheet, row, info);
          processed++;
          Utilities.sleep(CONFIG.SEARCH_DELAY);
          logRow(row, company, 'INFO', '--- 処理完了（選択・一括） ---');
        } catch (e) {
          errors++;
          set(sheet, row, CONFIG.URL_COLUMN, `エラー: ${e}`);
          logRow(row, company, 'ERROR', `例外: ${String(e)}`);
        }
      }
    });
    SpreadsheetApp.getUi().alert(`✅ 完了\n処理件数: ${processed}\nエラー: ${errors}`);
  }
  
  /***** ========= 一括取得ロジック ========= *****/
  // 会社ごとに 1 回だけ Gemini 呼び出し（google_search + url_context）→ JSON で7項目まとめて
  function fetchCompanyInfoBundle(companyName, rowIndex) {
    const useGrounding = !!CONFIG.GEMINI_API_KEY;
    let url='', address='', representative='', tel='', sales='', capital='', employees='';
  
    if (useGrounding) {
      const result = groundedBundle(companyName, rowIndex); // {url,address,representative,tel,sales,capital,employees}
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
      logRow(rowIndex, companyName, 'WARN', 'Gemini API未設定 → CSEへフォールバック');
    }
  
    // 改善1: GeminiでURLが入り、gov/PDFでないならCSEを完全スキップ
    if (url && !isGovOrPdf(url)) {
      logRow(rowIndex, companyName, 'INFO', `URL確定(Gemini): ${url}`);
    } else {
      // URLが空 or gov/PDF の場合のみ CSE 補完
      logRow(rowIndex, companyName, 'INFO', 'URL不足 → CSEフォールバック');
      const site = resolveOfficialSiteSmart(companyName, rowIndex);
      url = filterOfficialUrlOrEmpty(site);
      logRow(rowIndex, companyName, 'INFO', `CSE URL候補: ${url||'(なし)'}`);
    }
  
    // 改善2: 不足がある場合のみ会社概要HTMLを当てに行く
    const needHtml = !address || !representative || !tel || !sales || !capital || !employees;
  
    // 会社概要ページ候補 → HTML抽出で不足分を補完
    let profileUrl = '';
    let html1 = null;
  
    if (needHtml && url) {
      profileUrl = resolveCompanyProfileUrl(url) || url;
      if (profileUrl) logRow(rowIndex, companyName, 'DEBUG', `会社概要候補=${profileUrl}`);
      html1 = profileUrl ? safeFetchHtml(profileUrl) : null;
  
      const before = {address,representative,tel,sales,capital,employees};
      if (!address) address = extractAddress(html1);
      if (!representative) representative = extractRepresentative(html1);
      if (!tel) tel = extractTel(html1);
      if (!sales) sales = extractSales(html1);
      if (!capital) capital = extractCapital(html1);
      if (!employees) employees = extractEmployees(html1);
      Object.entries({address,representative,tel,sales,capital,employees}).forEach(([k,v])=>{
        if (!before[k] && v) logRow(rowIndex, companyName, 'DEBUG', `HTML補完 ${k}=${v}`);
      });
    }
  
    // さらに不足なら site: 再探索
    if (needHtml && url && (!address || !representative || !tel || !sales || !capital || !employees)) {
      const second = searchCompanyProfileByCse(url, rowIndex);
      if (second && second !== profileUrl) {
        logRow(rowIndex, companyName, 'INFO', `会社概要 再探索ヒット: ${second}`);
        const html2 = safeFetchHtml(second);
        const b2 = {address,representative,tel,sales,capital,employees};
        address = address || extractAddress(html2);
        representative = representative || extractRepresentative(html2);
        tel = tel || extractTel(html2);
        sales = sales || extractSales(html2);
        capital = capital || extractCapital(html2);
        employees = employees || extractEmployees(html2);
        Object.entries({address,representative,tel,sales,capital,employees}).forEach(([k,v])=>{
          if (!b2[k] && v) logRow(rowIndex, companyName, 'DEBUG', `2nd補完 ${k}=${v}`);
        });
      }
    }
  
    const gOut = filterOfficialUrlOrEmpty(profileUrl || url);
    if (!gOut) logRow(rowIndex, companyName, 'INFO', 'G列: gov/PDFのため空出力');
  
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
  
  /***** ========= Gemini 一括（7項目） ========= *****/
  function groundedBundle(companyName, rowIndex) {
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  
    const prompt = `
  あなたは日本企業情報の抽出アシスタントです。対象企業:「${companyName}」。
  google_search と url_context を使い、信頼できる一次情報（会社公式サイト、会社概要ページ、EDINET/IR等）を優先して参照してください。
  次の JSON だけを返してください。説明文や余計なテキストは出力しないこと。
  
  {
    "url": "<公式コーポレートサイトのトップURL。*.go.jp/*.lg.jpやPDFは空文字>",
    "address": "<本社住所。テナント名・フロアがあれば含めても可>",
    "representative": "<代表取締役/代表者の氏名のみ（肩書除く）>",
    "tel": "<代表電話。0X-XXXX-XXXX形式に近いもの>",
    "sales": "<最新の売上高（分かれば連結優先）〜円。なければ空>",
    "capital": "<資本金〜円。なければ空>",
    "employees": "<従業員数。分かれば「連結/単体」表記を含める。なければ空>"
  }
  
  制約:
  - url は *.go.jp / *.lg.jp を採用しない。PDFも不可。見つからない場合は空文字。
  - SNS/求人サイト/まとめサイトは不可。
  - 値が見つからない項目は空文字 "" を返す。
  - 日本語で。
  `;
  
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }, { url_context: {} }],
      generationConfig: { temperature: 0.1 }
    };
  
    const parseLooseJson = (txt) => {
      if (!txt) return null;
      const cleaned = txt.replace(/```json/gi,'').replace(/```/g,'').trim();
      try { return JSON.parse(cleaned); } catch (_) {}
      const m = cleaned.match(/\{[\s\S]*\}/);
      try { return m ? JSON.parse(m[0]) : null; } catch (_) { return null; }
    };
  
    for (let attempt=1; attempt<=2; attempt++){
      try {
        logRow(rowIndex, companyName, 'DEBUG', `[Grounding] 一括リクエスト送信 try=${attempt}`);
        const res = UrlFetchApp.fetch(endpoint, {
          method: 'post',
          contentType: 'application/json',
          headers: { 'x-goog-api-key': CONFIG.GEMINI_API_KEY },
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        });
        const code = res.getResponseCode();
        const body = res.getContentText() || '';
        logRow(rowIndex, companyName, 'DEBUG',
          `[Grounding] HTTP ${code} bodyHead=${body.substring(0, CONFIG.LOG_TRUNCATE_BODY_AT)}`);
  
        if (code >= 400) {
          if (attempt === 1) { // ツール無しフォールバック
            logRow(rowIndex, companyName, 'WARN', 'HTTPエラー → ツール無しフォールバック');
            payload.tools = [];
            continue;
          }
          return null;
        }
  
        let data; try { data = JSON.parse(body); } catch (_){}
        const parts = data?.candidates?.[0]?.content?.parts || [];
        const joined = parts.map(p=>p.text||'').join('') || '';
        if (!joined) { logRow(rowIndex, companyName, 'WARN', '一括 応答parts空'); return null; }
  
        const obj = parseLooseJson(joined) || {};
  
        // === URLは強力正規化してから判定 ===
        const rawUrl = obj.url || '';
        const url1   = extractHttpUrl(rawUrl);
        const url2   = stripTrailingPunct(url1);
        const url3   = normalizeUrlAscii(url2);
        obj.url = filterOfficialUrlOrEmpty(toRootUrl(url3)) || '';
  
        // そのほかの項目は通常サニタイズ
        obj.address = cleanup(obj.address||'');
        obj.representative = cleanup(obj.representative||'');
        obj.tel = normalizePhone(obj.tel||'');
        obj.sales = cleanup(obj.sales||'');
        obj.capital = cleanup(obj.capital||'');
        obj.employees = cleanup(obj.employees||'');
  
        logRow(rowIndex, companyName, 'INFO', `一括 値: url=${obj.url||'(空)'} / addr=${obj.address||'(空)'} / rep=${obj.representative||'(空)'} / tel=${obj.tel||'(空)'} / sales=${obj.sales||'(空)'} / cap=${obj.capital||'(空)'} / emp=${obj.employees||'(空)'}`);
        return obj;
  
      } catch(e){
        logRow(rowIndex, companyName, 'ERROR', `一括 例外: ${String(e)}`);
        return null;
      }
    }
    return null;
  }
  
  /***** ========= CSE/抽出・ユーティリティ ========= *****/
  function resolveOfficialSiteSmart(companyName, rowIndex) {
    const queries = [`${companyName}`, `${companyName} 公式`, `${companyName} コーポレート`, `${companyName} 会社概要`];
    let pick=null, bestScore=-1;
  
    for (const q of queries) {
      logRow(rowIndex, companyName, 'DEBUG', `[CSE] q="${q}"`);
      const items = cse(q, 10) || [];
      for (const it of items) {
        const link = it.link || '';
        const title = it.title || '';
        const snippet = it.snippet || '';
  
        if (!/^https?:\/\//i.test(link)) continue;
  
        // 不正URL判定を先に
        if (!parseHost(link)) {
          logRow(rowIndex, companyName, 'DEBUG', `[CSE] URL不正除外 ${link}`);
          continue;
        }
        if (isGovOrPdf(link)) {
          logRow(rowIndex, companyName, 'DEBUG', `[CSE] gov/PDF除外 ${link}`);
          continue;
        }
        if (isExcludedDomain(link, `${title} ${snippet}`)) {
          logRow(rowIndex, companyName, 'DEBUG', `[CSE] 除外(ドメイン/求人/SNS等) ${link}`);
          continue;
        }
  
        const s = scoreOfficialCandidate(link, title, snippet, companyName);
        logRow(rowIndex, companyName, 'DEBUG', `[CSE] 候補 ${link} score=${s}`);
        if (s > bestScore) { bestScore = s; pick = link; }
      }
      if (bestScore >= 60) break;
    }
    logRow(rowIndex, companyName, 'INFO', `[CSE] 最良候補=${pick || '(なし)'} score=${bestScore}`);
    return pick ? toRootUrl(pick) : null;
  }
  
  function scoreOfficialCandidate(link, title, snippet, companyName) {
    const t = (title + ' ' + snippet).toLowerCase();
    const host = parseHost(link) || link.toLowerCase();
    let s=0;
    if (host.endsWith('.co.jp')) s+=30; else if (/\.(jp)$/.test(host)) s+=20;
    const key = normalizeCompanyKey(companyName);
    const raw = companyName.toLowerCase().replace(/[・\s　]/g,'');
    if (key && host.includes(key)) s+=25;
    if (raw && t.includes(raw)) s+=20;
    if (key && t.includes(key)) s+=10;
    if (/会社概要|企業情報|会社情報|corporate|company|profile|outline|overview/.test(t)) s+=8;
    const depth=getPathDepth(link); if (depth<=1) s+=10; else if (depth>=3) s-=8;
    if (/recruit|採用|career|jobs|エントリー/.test(t)) s-=30;
    if (/facebook|instagram|twitter\.com|x\.com|linkedin|wantedly|openwork|mynavi|rikunabi|en-japan|note\.com/.test(link)) s-=100;
    if (/yahoo|rakuten|amazon|tabelog|hotpepper|goo\.ne\.jp|livedoor/.test(host)) s-=20;
    if (/\/news\/|\/ir\/|\/press|\/inquiry|\/contact/.test(link.toLowerCase())) s-=5;
    if (isGovHost(host) || isPdfUrl(link)) s-=999;
    return s;
  }
  
  function resolveCompanyProfileUrl(siteRoot) {
    for (const p of CONFIG.SITE_CANDIDATE_PATHS) {
      const url = joinUrl(siteRoot, p);
      if (isGovOrPdf(url)) continue;
      const html = safeFetchHtml(url);
      if (html && /会社概要|企業情報|会社情報|Company|Corporate|Profile|Outline|Overview/i.test(html)) {
        return url;
      }
    }
    return null;
  }
  function searchCompanyProfileByCse(siteRoot, rowIndex) {
    const domain = toDomain(siteRoot);
    const q = `site:${domain} (会社概要 OR 企業情報 OR 会社情報 OR corporate OR company OR profile OR outline)`;
    logRow(rowIndex, domain, 'DEBUG', `[CSE] 再探索 q="${q}"`);
    const items = cse(q, 5) || [];
    const pick = items.find(it => {
      if (isGovOrPdf(it.link)) return false;
      return /会社概要|企業情報|会社情報|Corporate|Company|Profile|Outline|Overview/i.test(`${it.title} ${it.snippet}`);
    });
    return pick ? pick.link : null;
  }
  function cse(query, num) {
    const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(CONFIG.GOOGLE_API_KEY)}&cx=${encodeURIComponent(CONFIG.SEARCH_ENGINE_ID)}&q=${encodeURIComponent(query)}&num=${num||10}`;
    try {
      const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
      const code = res.getResponseCode();
      const body = res.getContentText() || '';
      logRow(null, '(CSE)', 'DEBUG', `HTTP ${code} query="${query}" bodyHead="${body.substring(0,200)}"`);
      const data = JSON.parse(body);
      const items = (data.items || []).filter(it => !CONFIG.EXCLUDED_DOMAINS.some(d => (it.link||'').includes(d)));
      return items;
    } catch (e) { logRow(null, '(CSE)', 'ERROR', `CSE例外: ${String(e)}`); return null; }
  }
  
  /***** ========= HTML取得/抽出 ========= *****/
  function safeFetchHtml(url) {
    try {
      const res = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true, followRedirects: true,
        headers: { 'User-Agent': 'Mozilla/5.0 (AppsScript)' }
      });
      const code = res.getResponseCode();
      if (code >= 200 && code < 400) return stripHtmlNoise(res.getContentText());
      logRow(null, '(HTML)', 'WARN', `Fetch ${code} ${url}`);
    } catch(e){ logRow(null, '(HTML)', 'ERROR', `fetch例外 ${url} ${e}`); }
    return null;
  }
  function stripHtmlNoise(html) {
    return html.replace(/<script[\s\S]*?<\/script>/gi,' ')
               .replace(/<style[\s\S]*?<\/style>/gi,' ')
               .replace(/<!--[\s\S]*?-->/g,' ')
               .replace(/&nbsp;|&emsp;|&ensp;|&thinsp;/g,' ')
               .replace(/\s+/g,' ');
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
    const m1 = html.match(p1); if (m1) return `${m1[2]}${m1[3]||''}円`;
    const p2 = /連結?売上高[^0-9一二三四五六七八九十兆億万]*([0-9,\.]+)\s*(兆|億|万)?\s*円?/;
    const m2 = html.match(p2); if (m2) return `連結 ${m2[1]}${m2[2]||''}円`;
    if (/非公開|未公表/i.test(html)) return '非公開';
    return '';
  }
  function extractCapital(html) {
    if (!html) return '';
    const p1 = /資本金[^0-9一二三四五六七八九十兆億万千百]*([0-9,\.]+)\s*(兆|億|万|千|百)?\s*円?/i;
    const m1 = html.match(p1);
    if (m1) return `${m1[1]}${m1[2]||''}円`;
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
  
  /***** ========= 共通ユーティリティ（URL安全版＋強力正規化） ========= *****/
  function addHeadersIfNeeded(sheet) {
    const header = 1;
    const setIfEmpty = (c, name) => { if (!sheet.getRange(header, c).getValue()) sheet.getRange(header, c).setValue(name); };
    setIfEmpty(CONFIG.COMPANY_COLUMN, '会社名');
    setIfEmpty(CONFIG.URL_COLUMN, '公式サイトURL/会社概要URL');
    setIfEmpty(CONFIG.ADDRESS_COLUMN, '住所');
    setIfEmpty(CONFIG.REP_COLUMN, '代表者名');
    setIfEmpty(CONFIG.TEL_COLUMN, '電話番号');
    setIfEmpty(CONFIG.SALES_COLUMN, '売上');
    setIfEmpty(CONFIG.CAPITAL_COLUMN, '資本金');
    setIfEmpty(CONFIG.EMPLOYEES_COLUMN, '従業員数');
  }
  function writeInfo(sheet, row, info) {
    if (info) {
      set(sheet, row, CONFIG.URL_COLUMN, info.url || '');
      set(sheet, row, CONFIG.ADDRESS_COLUMN, info.address || '不明');
      set(sheet, row, CONFIG.REP_COLUMN, info.representative || '不明');
      set(sheet, row, CONFIG.TEL_COLUMN, info.tel || '不明');
      set(sheet, row, CONFIG.SALES_COLUMN, info.sales || '非公開/不明');
      set(sheet, row, CONFIG.CAPITAL_COLUMN, info.capital || '不明');
      set(sheet, row, CONFIG.EMPLOYEES_COLUMN, info.employees || '不明');
    } else {
      set(sheet, row, CONFIG.URL_COLUMN, '');
      set(sheet, row, CONFIG.ADDRESS_COLUMN, '');
      set(sheet, row, CONFIG.REP_COLUMN, '');
      set(sheet, row, CONFIG.TEL_COLUMN, '');
      set(sheet, row, CONFIG.SALES_COLUMN, '');
      set(sheet, row, CONFIG.CAPITAL_COLUMN, '');
      set(sheet, row, CONFIG.EMPLOYEES_COLUMN, '');
    }
  }
  function val(sheet, row, col){ return sheet.getRange(row,col).getValue(); }
  function set(sheet, row, col, v){ sheet.getRange(row,col).setValue(v); }
  
  // 文字クリーニング強化：全角/半角空白・縦線・不可視スペース類
  function cleanup(s){
    return String(s||'')
      .replace(/[\u200B-\u200D\uFEFF]/g,'')     // ゼロ幅
      .replace(/[|｜]/g,'')
      .replace(/\s+/g,' ')
      .trim();
  }
  function normalizePhone(s){ return String(s||'').replace(/[−–‐]/g,'-').replace(/--+/g,'-').trim(); }
  
  // === new URL 非依存の安全なURL処理 ===
  function parseHost(u){
    const s = String(u || '').trim();
    const m = s.match(/^[a-zA-Z][a-zA-Z0-9+.\-]*:\/\/([^\/\s?#]+)/);
    return m ? m[1].toLowerCase() : '';
  }
  function parseProto(u){
    const m = String(u||'').match(/^([a-zA-Z][a-zA-Z0-9+.\-]*):\/\//);
    return m ? (m[1].toLowerCase() + '://') : 'https://';
  }
  function toDomain(u){ return parseHost(u) || u; }
  function toRootUrl(u){
    const host = parseHost(u);
    if (!host) return '';
    return parseProto(u) + host;
  }
  function getPathDepth(link){
    const s = String(link||'');
    const m = s.match(/^[a-zA-Z][a-zA-Z0-9+.\-]*:\/\/[^\/\s?#]+(\/[^?#]*)?/);
    const path = m ? (m[1] || '') : '';
    const norm = path.replace(/\/+$/,'');
    if (!norm || norm === '/') return 0;
    return norm.split('/').filter(Boolean).length;
  }
  
  function normalizeCompanyKey(name){
    return String(name)
      .replace(/株式会社|（株）|\(株\)|有限会社|合同会社|Inc\.?|Co\.?|Ltd\.?/gi,'')
      .replace(/[・\s　]/g,'')
      .toLowerCase();
  }
  function isExcludedDomain(link,text){
    const l=(link||'').toLowerCase();
    if (CONFIG.EXCLUDED_DOMAINS.some(d => l.includes(d))) return true;
    if (/(採用|求人|口コミ|転職|インターン|エントリー)/i.test(text||'')) return true;
    return false;
  }
  function normalizeUrlAscii(s){
    let t = String(s||'');
    // 不可視・制御類の除去
    t = t.replace(/[\u200B-\u200D\uFEFF\u2060]/g, ''); // ゼロ幅
    t = t.replace(/[\u0000-\u001F\u007F]/g, '');       // 制御
    // 全角→半角（よく混ざるもの）
    t = t.replace(/：/g, ':').replace(/／/g, '/').replace(/．/g, '.');
    t = t.replace(/（/g, '(').replace(/）/g, ')').replace(/［/g,'[').replace(/］/g,']');
    // スマートクオートなど
    t = t.replace(/[“”]/g, '"').replace(/[‘’＇]/g, "'");
    return t.trim();
  }
  function extractHttpUrl(s){
    const txt = normalizeUrlAscii(s);
    const m = txt.match(/https?:\/\/[^\s<>"'()]+/i);
    return m ? m[0] : txt;
  }
  function stripTrailingPunct(u){
    return String(u||'').replace(/[)\]\}>"'。、．・。､，]+$/,'').trim();
  }
  function isPdfUrl(u){ return /\.pdf(?:$|\?)/i.test(normalizeUrlAscii(String(u))); }
  function isGovHost(host){ return /\.go\.jp$/.test(host||'') || /\.lg\.jp$/.test(host||''); }
  function isGovOrPdf(u){
    const s = normalizeUrlAscii(String(u || '').trim());
    if (!s) return true;
    if (isPdfUrl(s)) return true;
    const h = parseHost(s);
    if (!h) return true; // 不正URLは除外
    return isGovHost(h);
  }
  function filterOfficialUrlOrEmpty(u){
    const s = normalizeUrlAscii(String(u || '').trim());
    if (!s || isPdfUrl(s)) return '';
    const h = parseHost(s);
    if (!h || isGovHost(h)) return '';
    return s;
  }
  function joinUrl(root, path){
    try{
      if(!/\/$/.test(root)) root+='/';
      path=String(path).replace(/^\//,'');
      return root+encodeURI(path);
    }catch(e){return root+'/'+path;}
  }
  
  /***** ========= ログ ========= *****/
  function ensureLogSheet_(){
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(CONFIG.LOG_SHEET_NAME);
    if (!sh){ sh = ss.insertSheet(CONFIG.LOG_SHEET_NAME); sh.appendRow(['timestamp','row','company','level','field','message']); }
    return sh;
  }
  function logRow(row, company, level, message, field){
    try{
      if (!CONFIG.DEBUG) return;
      const sh = ensureLogSheet_();
      const tz = Session.getScriptTimeZone();
      sh.appendRow([
        Utilities.formatDate(new Date(), tz, 'yyyy/MM/dd HH:mm:ss'),
        (row==null?'':row), company||'', level||'INFO', field||'', String(message||'')
      ]);
    }catch(e){ Logger.log('LOG FAIL: '+e); }
  }
  
  