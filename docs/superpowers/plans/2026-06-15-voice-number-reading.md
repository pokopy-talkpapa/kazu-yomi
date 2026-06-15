# 数読み（kazu-yomi）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 3桁の数字を位を意識して声で読み、ブラウザが聞き取って○×を判定する2年生向け教材アプリを作る。

**Architecture:** 単一 `index.html`（UI＋音声配線）＋ 純ロジックを `judge.js` に分離（ブラウザでも Node でも読める UMD 風）。判定・読み生成はサーバー不要で全部クライアント内。コインは1枚画像をN個並べて描画。既存「りんごの数えかた」アプリ（howmanyapples_trial03）の配置ロジックを忠実コピー。GitHub Pages 配信。

**Tech Stack:** プレーン HTML/CSS/JS（ビルドなし）、Web Speech API（`webkitSpeechRecognition`・ja-JP）、SpeechSynthesis（お手本読み上げ）、`node:test`（ビルド不要の単体テスト）、いらすとや PNG。

---

## File Structure

- Create: `~/Workspace/kazu-yomi/index.html` — 画面・音声配線・描画
- Create: `~/Workspace/kazu-yomi/judge.js` — 純ロジック: `readingKana()`, `normalize()`, `judge()`（browser global ＋ node export）
- Create: `~/Workspace/kazu-yomi/judge.test.mjs` — node:test 単体テスト
- Create: `~/Workspace/kazu-yomi/imgs/money_100.png` `money_10.png` `money_1.png`（Downloads からコピー）
- Create: `~/Workspace/kazu-yomi/README.md`
- 既存: `docs/superpowers/specs/2026-06-15-voice-number-reading-design.md`（設計書）

判定ロジック（最重要・最リスク）を `judge.js` に隔離し、UI と独立にテストする。Web Speech は実機でしか動かないので、純ロジックだけを Node でテスト可能にするのが肝。

---

## Task 0: プロジェクト初期化

**Files:**
- Create: `~/Workspace/kazu-yomi/` 配下一式、`imgs/`

- [ ] **Step 1: フォルダと画像を用意**

```bash
mkdir -p ~/Workspace/kazu-yomi/imgs
cp ~/Downloads/money_100.png ~/Downloads/money_10.png ~/Downloads/money_1.png ~/Workspace/kazu-yomi/imgs/
ls ~/Workspace/kazu-yomi/imgs/
```
Expected: `money_1.png  money_10.png  money_100.png` が並ぶ

- [ ] **Step 2: git 初期化**

```bash
cd ~/Workspace/kazu-yomi && git init && git add -A && git commit -m "chore: scaffold kazu-yomi with coin assets and design spec"
```
Expected: 初回コミット成功

---

## Task 1: readingKana() — 位の正しい読みを生成

数値（1〜999）→ 正しい位読みカナ（例 365→「さんびゃくろくじゅうご」、108→「ひゃくはち」）。
百の位の音変化（300=さんびゃく/600=ろっぴゃく/800=はっぴゃく/100=ひゃく）と 0 のスキップを正確に。

**Files:**
- Create: `~/Workspace/kazu-yomi/judge.js`
- Create: `~/Workspace/kazu-yomi/judge.test.mjs`

- [ ] **Step 1: 失敗するテストを書く**

`judge.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readingKana } from './judge.js';

test('readingKana: 0なし3桁', () => {
  assert.equal(readingKana(365), 'さんびゃくろくじゅうご');
  assert.equal(readingKana(178), 'ひゃくななじゅうはち');
  assert.equal(readingKana(999), 'きゅうひゃくきゅうじゅうきゅう');
});

test('readingKana: 百の位の音変化', () => {
  assert.equal(readingKana(100), 'ひゃく');
  assert.equal(readingKana(300), 'さんびゃく');
  assert.equal(readingKana(600), 'ろっぴゃく');
  assert.equal(readingKana(800), 'はっぴゃく');
});

test('readingKana: 0を含む（位スキップ）', () => {
  assert.equal(readingKana(108), 'ひゃくはち');
  assert.equal(readingKana(250), 'にひゃくごじゅう');
  assert.equal(readingKana(205), 'にひゃくご');
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `cd ~/Workspace/kazu-yomi && node --test`
Expected: FAIL（`readingKana` is not exported / not a function）

- [ ] **Step 3: 最小実装を書く**

`judge.js`:
```js
// judge.js — browser global ＋ node export（ビルドなしで両対応）
(function (root) {
  const HUNDREDS = ['', 'ひゃく', 'にひゃく', 'さんびゃく', 'よんひゃく', 'ごひゃく', 'ろっぴゃく', 'ななひゃく', 'はっぴゃく', 'きゅうひゃく'];
  const TENS = ['', 'じゅう', 'にじゅう', 'さんじゅう', 'よんじゅう', 'ごじゅう', 'ろくじゅう', 'ななじゅう', 'はちじゅう', 'きゅうじゅう'];
  const ONES = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];

  function readingKana(n) {
    const h = Math.floor(n / 100) % 10;
    const t = Math.floor(n / 10) % 10;
    const o = n % 10;
    return HUNDREDS[h] + TENS[t] + ONES[o];
  }

  const api = { readingKana };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: テストが通ることを確認**

Run: `cd ~/Workspace/kazu-yomi && node --test`
Expected: PASS（3 tests）

- [ ] **Step 5: コミット**

```bash
cd ~/Workspace/kazu-yomi && git add judge.js judge.test.mjs && git commit -m "feat: readingKana generates correct place-value reading"
```

---

## Task 2: normalize() ＋ judge() — 判定の核（きびしめ）

声を文字にした結果（transcript）と正解数（target）から ○×を出す。
方針＝きびしめ。「数が合う」かつ「1桁バラ読みでない」ときだけ○。
正直な限界：Chrome の認識は流暢な位読みもバラ読みも "365" に潰すことがある。捕まえられるバラ読みは「数字が空白で分かれている（3 6 5）」「位の語(ひゃく/じゅう)を含まないカナ羅列」に限る。

判定の戻り値 `kind`：
- `'match'` … 正しく位読みできた（○）
- `'wrong'` … 数が違う（×）
- `'bara'` … 1桁バラ読みっぽい（×）
- `'unclear'` … 数字を取り出せなかった＝聞き取れず（×・リトライ促し）

**Files:**
- Modify: `~/Workspace/kazu-yomi/judge.js`
- Modify: `~/Workspace/kazu-yomi/judge.test.mjs`

- [ ] **Step 1: 失敗するテストを書く**

`judge.test.mjs` に追記:
```js
import { normalize, judge } from './judge.js';

test('normalize: 全角→半角・空白整理', () => {
  assert.equal(normalize('３６５'), '365');
  assert.equal(normalize('  365 '), '365');
});

test('judge: 流暢な位読み（数字に潰れて返る）→ match', () => {
  assert.equal(judge('365', 365).kind, 'match');
  assert.equal(judge('３６５', 365).kind, 'match');
});

test('judge: カナの位読みもmatch', () => {
  assert.equal(judge('さんびゃくろくじゅうご', 365).kind, 'match');
});

test('judge: 数が違う→wrong', () => {
  assert.equal(judge('364', 365).kind, 'wrong');
});

test('judge: 空白で割れた1桁読み→bara', () => {
  assert.equal(judge('3 6 5', 365).kind, 'bara');
});

test('judge: 位の語がないカナ羅列→bara', () => {
  assert.equal(judge('さんろくご', 365).kind, 'bara');
});

test('judge: 聞き取れず→unclear', () => {
  assert.equal(judge('えーっと', 365).kind, 'unclear');
  assert.equal(judge('', 365).kind, 'unclear');
});

test('judge: ok フラグ', () => {
  assert.equal(judge('365', 365).ok, true);
  assert.equal(judge('3 6 5', 365).ok, false);
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `cd ~/Workspace/kazu-yomi && node --test`
Expected: FAIL（`normalize`/`judge` not a function）

- [ ] **Step 3: 最小実装を書く**

`judge.js` の `readingKana` の下、`const api` の前に追加。`api` も更新。
```js
  // 全角数字→半角、前後空白除去、連続空白を単一スペースに
  function normalize(s) {
    return (s || '')
      .replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
      .trim()
      .replace(/\s+/g, ' ');
  }

  // カナ位読み（ひゃく/びゃく/ぴゃく/じゅう）を含むか
  function hasPlaceWords(s) {
    return /ひゃく|びゃく|ぴゃく|じゅう/.test(s);
  }
  // 位の語を含まない「数の名前カナ」だけの羅列か（いち に さん …）
  function isBareKana(s) {
    const bare = s.replace(/\s/g, '');
    if (hasPlaceWords(bare)) return false;
    return /^(いち|に|さん|よん|し|ご|ろく|なな|しち|はち|きゅう|く|れい|ぜろ){2,}$/.test(bare);
  }

  function judge(transcript, target) {
    const raw = normalize(transcript);

    // カナの正しい位読みに一致 → match（最も強い○シグナル）
    if (raw.replace(/\s/g, '') === readingKana(target)) {
      return { ok: true, kind: 'match', raw };
    }

    // 空白で割れた複数の数字トークン（"3 6 5"）→ bara
    const numTokens = raw.split(' ').filter(t => /\d/.test(t));
    if (numTokens.length >= 2) return { ok: false, kind: 'bara', raw };

    // 位の語を含まないカナ羅列（"さんろくご"）→ bara
    if (isBareKana(raw)) return { ok: false, kind: 'bara', raw };

    // 数字を抜き出して数値化
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 0) return { ok: false, kind: 'unclear', raw };

    const value = parseInt(digits, 10);
    if (value !== target) return { ok: false, kind: 'wrong', raw };

    return { ok: true, kind: 'match', raw };
  }
```
そして export を更新:
```js
  const api = { readingKana, normalize, judge };
```

- [ ] **Step 4: テストが通ることを確認**

Run: `cd ~/Workspace/kazu-yomi && node --test`
Expected: PASS（全テスト green）

- [ ] **Step 5: コミット**

```bash
cd ~/Workspace/kazu-yomi && git add judge.js judge.test.mjs && git commit -m "feat: strict judge() with bara-yomi detection"
```

---

## Task 3: 画面骨格（位の表＋数字＋Lv切替）

声・コインはまだ。位の表（百/十/一）と大きな数字、Lv1/Lv2 トグル、🎤ボタンの枠だけ作る。

**Files:**
- Create: `~/Workspace/kazu-yomi/index.html`

- [ ] **Step 1: index.html を作る**

```html
<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>かずよみ</title>
<style>
  :root { --line:#222; --ok:#2e9e3f; --ng:#e0453a; --hint:#e5f1ff; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: system-ui, sans-serif; background:#fffdf7; color:var(--line);
         display:flex; flex-direction:column; align-items:center; min-height:100vh; }
  h1 { font-size:1.2rem; margin:12px 0 4px; }
  .board { width:min(94vw, 520px); }
  table.place { width:100%; border-collapse:collapse; table-layout:fixed; }
  table.place th { font-size:1rem; font-weight:600; padding:6px 0; color:#555; }
  table.place td { border-left:3px solid var(--line); border-right:3px solid var(--line);
                   text-align:center; vertical-align:top; }
  table.place td:first-child { border-left:none; }
  table.place td:last-child { border-right:none; }
  .digit { font-size:4rem; line-height:1.1; border-bottom:4px solid var(--line); }
  .coins { min-height:46vh; padding-top:8px; }   /* Task 4 で中身 */
  .controls { display:flex; gap:12px; align-items:center; margin:16px 0; }
  button { font-size:1.1rem; padding:12px 18px; border-radius:14px; border:2px solid var(--line);
           background:#fff; cursor:pointer; }
  #mic { font-size:1.4rem; padding:16px 26px; }
  .result { font-size:2.4rem; min-height:3rem; font-weight:700; }
  .result.ok { color:var(--ok); } .result.ng { color:var(--ng); }
  .lv { display:flex; gap:8px; }
  .lv button[aria-pressed="true"] { background:var(--line); color:#fff; }
  .heard { color:#888; font-size:.9rem; min-height:1.2rem; }
</style>
</head>
<body>
  <h1>かずを こえで よもう</h1>
  <div class="lv">
    <button id="lv1" aria-pressed="true">Lv1（おかね あり）</button>
    <button id="lv2" aria-pressed="false">Lv2（すうじ だけ）</button>
  </div>
  <div class="board">
    <table class="place">
      <thead><tr><th>百のくらい</th><th>十のくらい</th><th>一のくらい</th></tr></thead>
      <tbody>
        <tr>
          <td class="digit" id="d100">3</td>
          <td class="digit" id="d10">6</td>
          <td class="digit" id="d1">5</td>
        </tr>
        <tr>
          <td class="coins" id="c100"></td>
          <td class="coins" id="c10"></td>
          <td class="coins" id="c1"></td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="result" id="result"></div>
  <div class="heard" id="heard"></div>
  <div class="controls">
    <button id="mic">🎤 よむ</button>
    <button id="next">つぎ ▶</button>
  </div>

  <script src="judge.js"></script>
  <script>
  // ===== 状態 =====
  let current = 365;     // 現在のお題
  let level = 1;         // 1=おかねあり, 2=すうじだけ

  const $ = id => document.getElementById(id);

  function renderNumber(n) {
    $('d100').textContent = Math.floor(n / 100) % 10;
    $('d10').textContent  = Math.floor(n / 10) % 10;
    $('d1').textContent   = n % 10;
  }

  function newProblem() {
    // Task 7 までは 0なし（各位1〜9）
    const h = 1 + Math.floor(Math.random() * 9);
    const t = 1 + Math.floor(Math.random() * 9);
    const o = 1 + Math.floor(Math.random() * 9);
    current = h * 100 + t * 10 + o;
    renderNumber(current);
    $('result').textContent = ''; $('result').className = 'result';
    $('heard').textContent = '';
    renderCoins(); // Task 4
  }

  function renderCoins() { /* Task 4 */ }

  $('next').addEventListener('click', newProblem);
  $('lv1').addEventListener('click', () => setLevel(1));
  $('lv2').addEventListener('click', () => setLevel(2));
  function setLevel(lv) {
    level = lv;
    $('lv1').setAttribute('aria-pressed', lv === 1);
    $('lv2').setAttribute('aria-pressed', lv === 2);
    renderCoins();
  }

  renderNumber(current);
  </script>
</body>
</html>
```

- [ ] **Step 2: ブラウザで見た目を確認**

Run: `cd ~/Workspace/kazu-yomi && python3 -m http.server 8765` を起動し、preview_start で `http://localhost:8765/` を開く。
Expected: 百/十/一の表に「3 6 5」、Lv1/Lv2 トグル、🎤よむ・つぎ ボタンが表示。「つぎ」で数字が変わる。

- [ ] **Step 3: コミット**

```bash
cd ~/Workspace/kazu-yomi && git add index.html && git commit -m "feat: place-value board skeleton with level toggle"
```

---

## Task 4: コイン描画（りんごアプリ配置を忠実コピー）＋ Lv連動

各位の数字ぶんコインを並べる。配置＝「1列5枚まで・下から積む・6枚目から右列・左列優先・左寄せ・中央寄せしない」。
Lv1=表示、Lv2=非表示。

**Files:**
- Modify: `~/Workspace/kazu-yomi/index.html`

- [ ] **Step 1: コイン用 CSS を追加**

`<style>` 内（`.coins` の下）に追加:
```css
  .coinGroup { display:flex; gap:4%; justify-content:flex-start; align-items:flex-end;
               height:100%; padding:0 4px; }
  .coinCol { display:flex; flex-direction:column-reverse; align-items:center; gap:4px;
             flex:0 0 46%; }
  .coinImg { width:100%; max-width:64px; object-fit:contain; user-select:none; pointer-events:none; }
```

- [ ] **Step 2: renderCoins() を実装**（howmanyapples の renderGroup を踏襲）

`function renderCoins() { /* Task 4 */ }` を差し替え:
```js
  const COIN_FILE = { 100: 'imgs/money_100.png', 10: 'imgs/money_10.png', 1: 'imgs/money_1.png' };

  // りんごアプリと同じ：1列5枚まで・下から積む(column-reverse)・6枚目から右列・左列優先
  function renderOnePlace(el, file, count) {
    el.textContent = '';
    if (level === 2 || count === 0) return;     // Lv2 は非表示。0 は空っぽ（Task 7）
    const group = document.createElement('div');
    group.className = 'coinGroup';
    const columns = count <= 5 ? [count] : [5, count - 5];
    columns.forEach(n => {
      const col = document.createElement('div');
      col.className = 'coinCol';
      for (let i = 0; i < n; i++) {
        const img = document.createElement('img');
        img.className = 'coinImg';
        img.src = file; img.alt = '';
        col.appendChild(img);
      }
      group.appendChild(col);
    });
    el.appendChild(group);
  }

  function renderCoins() {
    renderOnePlace($('c100'), COIN_FILE[100], Math.floor(current / 100) % 10);
    renderOnePlace($('c10'),  COIN_FILE[10],  Math.floor(current / 10) % 10);
    renderOnePlace($('c1'),   COIN_FILE[1],   current % 10);
  }
```
そして最終行 `renderNumber(current);` を `renderNumber(current); renderCoins();` に変更。

- [ ] **Step 3: ブラウザで確認**

サーバー稼働のまま preview をリロード。
Expected:
- Lv1：百の位に100円玉、十の位に10円玉、一の位に1円玉が、数字の枚数ぶん、左寄せ・下から積みで並ぶ。6枚以上は2列目（右）に。
- Lv2 を押すとコインが消え、数字だけになる。「つぎ」で枚数が変わっても各コインの位置がずれない。
- preview_screenshot で見た目を保存し、Lv1/Lv2 両方を共有。

- [ ] **Step 4: コミット**

```bash
cd ~/Workspace/kazu-yomi && git add index.html && git commit -m "feat: coin rendering (apple-app layout) wired to level"
```

---

## Task 5: 音声入力 → 判定 → ○×

🎤ボタンで認識開始、結果を judge() に通して ○×表示。

**Files:**
- Modify: `~/Workspace/kazu-yomi/index.html`

- [ ] **Step 1: 認識＆判定を実装**

`</script>` 直前に追加:
```js
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognizing = false;

  function startListen() {
    if (!SR) { $('heard').textContent = 'このブラウザは音声に未対応（Chrome推奨）'; return; }
    if (recognizing) return;
    const rec = new SR();
    rec.lang = 'ja-JP';
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    recognizing = true;
    $('mic').textContent = '🎙 きいてるよ…';
    $('result').textContent = ''; $('result').className = 'result';

    rec.onresult = e => {
      // 全候補から最も良い判定を採用（match を最優先）
      const alts = Array.from(e.results[0]).map(r => r.transcript);
      let best = null;
      for (const a of alts) {
        const v = judge(a, current);
        if (!best || rank(v.kind) < rank(best.kind)) best = { ...v, said: a };
        if (v.kind === 'match') break;
      }
      showResult(best);
    };
    rec.onerror = () => { $('heard').textContent = 'もう一度ためしてね'; };
    rec.onend = () => { recognizing = false; $('mic').textContent = '🎤 よむ'; };
    rec.start();
  }
  // 良い順（小さいほど良い）
  function rank(kind) { return { match:0, bara:1, wrong:2, unclear:3 }[kind]; }

  function showResult(v) {
    $('heard').textContent = v && v.said ? `きこえた：「${v.said}」` : '';
    if (v && v.ok) {
      $('result').textContent = '○ せいかい！';
      $('result').className = 'result ok';
    } else {
      $('result').textContent = '× もういちど';
      $('result').className = 'result ng';
      onWrong(v);   // Task 6
    }
  }
  function onWrong(v) { /* Task 6 */ }

  $('mic').addEventListener('click', startListen);
```

- [ ] **Step 2: 実機で確認（手動）**

サーバーを稼働し、Chrome で開いてマイク許可。「365」を「さんびゃくろくじゅうご」と読む → ○。「さん ろく ご」と区切って読む → ×（bara）。違う数を言う → ×（wrong）。
Expected: 言い終わって約1秒で ○/× が出る。「きこえた：…」に認識結果が出る。
（※自動テストは judge.js 側で担保済み。ここは実機の体感確認）

- [ ] **Step 3: コミット**

```bash
cd ~/Workspace/kazu-yomi && git add index.html && git commit -m "feat: speech recognition wired to judge with ○× result"
```

---

## Task 6: ×のときの動き（リトライ／お手本/ヒント自動オン）

**Files:**
- Modify: `~/Workspace/kazu-yomi/index.html`

- [ ] **Step 1: onWrong を実装**

`function onWrong(v) { /* Task 6 */ }` を差し替え:
```js
  function speakModel(n) {
    if (!('speechSynthesis' in window)) return;
    // 位ごとに間をあけて読む：さんびゃく、ろくじゅう、ご
    const h = Math.floor(n / 100) % 10, t = Math.floor(n / 10) % 10, o = n % 10;
    const parts = [readingKana(h * 100), readingKana(t * 10), readingKana(o)].filter(Boolean);
    const u = new SpeechSynthesisUtterance(parts.join('、'));
    u.lang = 'ja-JP'; u.rate = 0.85;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }

  function onWrong(v) {
    // ③ お金ヒントを自動でオンに戻す（足場を戻す）
    if (level === 2) setLevel(1);
    // ② 正しい読みをお手本で聞かせる
    speakModel(current);
    // ① リトライは 🎤ボタンをそのまま押せばOK（文言で誘導）
    $('mic').textContent = '🎤 もういちど';
  }
```
注：`readingKana(h*100)` 等は「ひゃくの位だけ」「じゅうの位だけ」を返すので、`readingKana(300)`→「さんびゃく」, `readingKana(60)`→「ろくじゅう」, `readingKana(5)`→「ご」。位スキップ(0)は空文字で filter 除去。

- [ ] **Step 2: お手本読みの単体テストを追加**（readingKana の部品流用を担保）

`judge.test.mjs` に追記:
```js
test('readingKana: 単位ごとの部品（お手本読み用）', () => {
  assert.equal(readingKana(300), 'さんびゃく');
  assert.equal(readingKana(60), 'ろくじゅう');
  assert.equal(readingKana(5), 'ご');
  assert.equal(readingKana(0), '');
});
```
Run: `cd ~/Workspace/kazu-yomi && node --test` → PASS

- [ ] **Step 3: 実機で確認（手動）**

Lv2 で×になったとき：コインが自動で出る（Lv1へ）／「さんびゃく、ろくじゅう、ご」と読み上げる／ボタンが「もういちど」に変わる。
Expected: 上記3つが起きる。

- [ ] **Step 4: コミット**

```bash
cd ~/Workspace/kazu-yomi && git add index.html judge.test.mjs && git commit -m "feat: wrong-answer flow (model speech, auto-hint, retry)"
```

---

## Task 7: フェーズB — 0ありの出題＋空っぽの皿

108・250・300 のような「位が抜ける」数を出題できるようにし、0の位のコイン欄を「空っぽ」と分かる見た目にする。

**Files:**
- Modify: `~/Workspace/kazu-yomi/index.html`

- [ ] **Step 1: 出題に0を許可するトグルを追加**

`<div class="lv">` の下に追加:
```html
  <label style="font-size:.9rem"><input type="checkbox" id="zero"> 0のれんしゅう（108など）</label>
```
`newProblem()` を差し替え:
```js
  function newProblem() {
    const allowZero = $('zero').checked;
    const h = 1 + Math.floor(Math.random() * 9);                 // 百の位は1〜9（3桁を保証）
    const lo = allowZero ? 0 : 1;
    const t = lo + Math.floor(Math.random() * (10 - lo));
    const o = lo + Math.floor(Math.random() * (10 - lo));
    current = h * 100 + t * 10 + o;
    renderNumber(current);
    $('result').textContent = ''; $('result').className = 'result';
    $('heard').textContent = '';
    $('mic').textContent = '🎤 よむ';
    renderCoins();
  }
```

- [ ] **Step 2: 0の位を「空っぽの皿」に**

`.coins` CSS の下に追加:
```css
  .empty { display:flex; align-items:flex-start; justify-content:center; height:100%; padding-top:8px; }
  .empty span { color:#bbb; font-size:.9rem; border:2px dashed #ccc; border-radius:10px; padding:6px 10px; }
```
`renderOnePlace` の `if (level === 2 || count === 0) return;` を差し替え:
```js
    if (level === 2) { el.textContent = ''; return; }
    if (count === 0) { el.innerHTML = '<div class="empty"><span>０まい</span></div>'; return; }
    el.textContent = '';
```

- [ ] **Step 3: judge の0ありテストを追加**

`judge.test.mjs` に追記:
```js
test('judge: 0あり 108', () => {
  assert.equal(judge('108', 108).kind, 'match');
  assert.equal(judge('ひゃくはち', 108).kind, 'match');
  assert.equal(judge('ひゃくぜろはち', 108).kind, 'wrong'); // 「ぜろ」を読むのは誤り
});
test('judge: 0あり 250', () => {
  assert.equal(judge('250', 250).kind, 'match');
  assert.equal(judge('にひゃくごじゅう', 250).kind, 'match');
});
```
Run: `cd ~/Workspace/kazu-yomi && node --test`
Expected: PASS。※「ひゃくぜろはち」→ digits抽出は"108"だが readingKana(108)="ひゃくはち"とカナ不一致、かつ数字トークンなし・bareKana該当せず → digits=108 で value一致 → match になってしまう懸念。FAIL する場合は Step 4 で対処。

- [ ] **Step 4: 「ぜろ/れい」混入の誤読を弾く**（Step3 が FAIL したら）

`judge()` の digits 数値化の直前に追加:
```js
    // 「ぜろ」「れい」を声に出すのは位読みとして誤り（0は読まない）
    if (/ぜろ|れい/.test(raw)) return { ok: false, kind: 'wrong', raw };
```
Run: `node --test` → PASS を確認。

- [ ] **Step 5: ブラウザ確認＋コミット**

「0のれんしゅう」ON で 108 等が出る。0の位が「０まい」破線枠で表示。preview_screenshot 共有。
```bash
cd ~/Workspace/kazu-yomi && git add index.html judge.test.mjs && git commit -m "feat: phase B zeros with empty-plate and zero-misread guard"
```

---

## Task 8: 仕上げ＋公開（ぽこぴぃの明示OK後）

**Files:**
- Create: `~/Workspace/kazu-yomi/README.md`
- Modify: `~/Workspace/apps/REGISTRY.md`

- [ ] **Step 1: README を書く**

```markdown
# かずよみ（kazu-yomi）
3桁の数を位を意識して声で読む練習アプリ（小2向け）。Chrome 推奨。
- Lv1: 数字＋お金ヒント / Lv2: 数字だけ
- 判定はブラウザ内・記録なし・個人情報なし
- ロジック単体テスト: `node --test`
```

- [ ] **Step 2: コミット**

```bash
cd ~/Workspace/kazu-yomi && git add README.md && git commit -m "docs: add README"
```

- [ ] **Step 3: 公開（ぽこぴぃが「公開して」と言ったら）**

教材アプリ・個人情報なしのため Public 可（reference_app_derivative_craft 準拠）。
```bash
cd ~/Workspace/kazu-yomi && gh repo create pokopy-talkpapa/kazu-yomi --public --source=. --push
```
GitHub Pages 有効化（Settings→Pages→main / root）。公開URL: `https://pokopy-talkpapa.github.io/kazu-yomi/`

- [ ] **Step 4: REGISTRY.md に追記**

`~/Workspace/apps/REGISTRY.md` のアプリ一覧表に1行追加:
```
| **kazu-yomi** | `~/Workspace/kazu-yomi/` | https://pokopy-talkpapa.github.io/kazu-yomi/ | かずよみ - 3桁の数を位を意識して声で読む練習(小2)。画面の数字を「さんびゃくろくじゅうご」と読み、Web Speech API(Chrome)で聞き取り○×判定。Lv1=数字+お金ヒント/Lv2=数字だけ。お金は1枚画像をN個描画(りんごアプリ配置踏襲)。0あり(108等)は空っぽの皿。判定ロジックはjudge.jsに分離しnode --testで担保。記録なし・個人情報なし。GitHub Pages |
```
コミット（REGISTRY は別リポジトリでなければ Workspace 側で管理）。

---

## Self-Review（記録）

- **Spec coverage**: 画面=Task3/4、Lv段階=Task3/4、出題A=Task3・B=Task7、判定きびしめ=Task2、×の動き①②③=Task6、コイン配置=Task4、速さ=Task5、Chrome前提=Task5。全項目に対応タスクあり。
- **Placeholder**: `renderCoins`/`onWrong` は後続タスクで実体化する旨を明示（空のままにしない）。
- **Type consistency**: `judge()` の戻り `{ok,kind,raw}`、`kind ∈ {match,wrong,bara,unclear}`、`rank()` のキーと一致。`readingKana(n)` は単位部品(300/60/5)にも流用、Task6 と整合。
- **既知の限界（合意済み）**: 流暢なバラ読みが "365" に潰れる場合は捕捉不可。Task5 の実機確認でさじ加減を見る。
