// 產生簡單／中等難度要用的注音資料。新增或修改了簡化版文字之後，重新執行這支程式即可。
//
// 做兩件事：
//   1. 掃 js/app.js 裡會顯示在簡單／中等難度的文字，用 pinyin-pro 判斷每個字在句子裡的讀音，
//      跟字型的預設讀音不同的字，就在字後面接「讀音選擇碼」(IVS)，輸出成 js/zhuyin-ivs.js
//   2. 輸出 tools/zhuyin/.out/chars.txt（app.js + index.html 裡所有中文字），給 subset-fonts.sh 裁字型用
//
// 事前準備（只需做一次）：
//   cd tools/zhuyin && npm install
// 執行：
//   node tools/zhuyin/build.mjs
import { pinyin } from 'pinyin-pro';
import { p2z } from 'pinyin-to-zhuyin';
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const cacheDir = path.join(here, '.cache');
const outDir = path.join(here, '.out');
fs.mkdirSync(cacheDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

// 字型專案提供的讀音資料（第一個列出的讀音＝字型預設讀音；其餘讀音靠選擇碼切換）
async function cached(name, url) {
  const p = path.join(cacheDir, name);
  if (!fs.existsSync(p)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('下載失敗 ' + url + ' ' + res.status);
    fs.writeFileSync(p, Buffer.from(await res.arrayBuffer()));
  }
  return fs.readFileSync(p, 'utf8');
}
const base = 'https://raw.githubusercontent.com/ButTaiwan/bpmfvs/master/ime/';
const poyinTxt = await cached('poyin_db.txt', base + 'poyin_db.txt');
const ivsJs = await cached('zhuivsdic.js', base + 'zhuivsdic.js');

const defaultReading = {};
for (const line of poyinTxt.split('\n')) {
  const m = line.match(/^\[(.)[\]}] (\S+)\t/u);
  if (m && !(m[1] in defaultReading)) defaultReading[m[1]] = m[2];
}
const sandbox = { window: {} };
vm.runInNewContext(ivsJs, sandbox);
const ivsDic = sandbox.window.ivsdic; // { 讀音: { 字: 選擇碼序號 } }

// pinyin-pro 在這個 App 的內容裡判斷錯的字，手動指定正確讀音（拼音，數字代表聲調，5＝輕聲）
const OVERRIDES = {
  '車': 'che1', '麼': 'me5', '應': 'ying4',
  // 助詞、輕聲：pinyin-pro 單看字會給字典本調
  '的': 'de5', '了': 'le5', '嗎': 'ma5', '呢': 'ne5', '吧': 'ba5', '們': 'men5', '喔': 'o1',
  // 這份內容裡 pinyin-pro 判斷錯的字
  '著': 'zhe5', '搶': 'qiang3', '嚇': 'xia4', '暈': 'yun1', '調': 'tiao2', '識': 'shi4',
  '子': 'zi5', '得': 'de5', '地': 'de5', '興': 'xing4'
};
// 需要依上下文決定讀音的特例：[字, 前後文片段, 拼音]（例如「改變不了」的「了」念 liǎo，不是輕聲）
const CONTEXT_OVERRIDES = [
  ['了', '不了', 'liao3'],
  ['教', '事教', 'jiao1'],   // 故事教我們（動詞「教」念第一聲）
  ['數', '慢數', 'shu3'],    // 慢慢數數（第一個「數」是動詞，念第三聲）
  ['西', '東西', 'xi5'],     // 東西（輕聲）
];

// 找出會顯示在簡單／中等難度的文字欄位
const appJs = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const fieldRe = /\b(caption|cue|label|feedback|scene|prompt)\s*:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g;
const strings = new Set();
for (const m of appJs.matchAll(fieldRe)) {
  const s = (m[2] ?? m[3]).replace(/\\(.)/g, '$1');
  if (/[一-鿿]/u.test(s)) strings.add(s);
}

const isHan = (ch) => /[一-鿿]/u.test(ch);
const table = {};
const report = [];
const reviewSet = new Set();
const readingCount = {};
for (const line of poyinTxt.split('\n')) {
  const m = line.match(/^\[(.)[\]}] (\S+)\t/u);
  if (m) (readingCount[m[1]] ||= new Set()).add(m[2]);
}
const multi = new Set(Object.entries(readingCount).filter(([, v]) => v.size > 1).map(([k]) => k));
for (const s of strings) {
  const chars = Array.from(s);
  const py = pinyin(s, { toneType: 'num', type: 'array' });
  let out = '';
  let changed = false;
  chars.forEach((ch, i) => {
    out += ch;
    if (!isHan(ch)) return;
    const ctx = chars.slice(Math.max(0, i - 1), i + 2).join('');
    const ctxHit = CONTEXT_OVERRIDES.find(([c, frag]) => c === ch && (chars.slice(Math.max(0, i - 1), i + 1).join('') === frag));
    const raw = (ctxHit ? ctxHit[2] : (OVERRIDES[ch] || py[i] || '')).replace(/0$/, '5'); // pinyin-pro 用 0 表示輕聲，p2z 要吃 5
    let target;
    try { target = p2z(raw, { tonemarks: true }).replace(/\s+/g, ''); } catch (e) { return; }
    if (multi.has(ch)) reviewSet.add(`${ch} ${target}｜${chars.slice(Math.max(0, i - 2), i + 3).join('')}`);
    if (!target || target === defaultReading[ch]) return;     // 跟字型預設讀音一樣，不用選擇碼
    const idx = ivsDic[target] && ivsDic[target][ch];
    if (idx) {
      out += String.fromCodePoint(0xE01E0 + idx);
      changed = true;
      report.push(`${ch} → ${target}（選擇碼 ${idx}）  ${s}`);
    } else if (defaultReading[ch] !== undefined) {
      report.push(`!! 找不到 ${ch} 的讀音 ${target}（字型預設 ${defaultReading[ch]}），會顯示預設讀音  ${s}`);
    }
  });
  if (changed) table[s] = out;
}

const esc = (s) => Array.from(s).map((c) => (c.codePointAt(0) >= 0xE0100 && c.codePointAt(0) <= 0xE01EF)
  ? '\\u{' + c.codePointAt(0).toString(16) + '}' : JSON.stringify(c).slice(1, -1)).join('');
const body = Object.entries(table).map(([k, v]) => `  "${esc(k)}": "${esc(v)}"`).join(',\n');
fs.writeFileSync(path.join(root, 'js/zhuyin-ivs.js'),
  '// 自動產生，請勿手改：node tools/zhuyin/build.mjs\n' +
  '// 句子 → 加上「讀音選擇碼」的句子（只列出有多音字需要切換讀音的句子，其餘用字型預設讀音）\n' +
  'window.ZHUYIN_IVS = {\n' + body + '\n};\n');

const allText = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8') + fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const han = Array.from(new Set(Array.from(allText).filter((c) => /[一-鿿㐀-䶿]/u.test(c)))).join('');
fs.writeFileSync(path.join(outDir, 'chars.txt'), han + '，。！？、…「」：；→（）—');

console.log(`句子 ${strings.size} 句，其中 ${Object.keys(table).length} 句需要切換多音字讀音；字型要收 ${Array.from(han).length} 個字`);
fs.writeFileSync(path.join(outDir, 'review.txt'), Array.from(reviewSet).sort().join('\n'));
console.log(report.filter((r) => r.startsWith('!!')).join('\n'));
console.log('多音字逐一檢查清單 → tools/zhuyin/.out/review.txt（' + reviewSet.size + ' 筆）');
