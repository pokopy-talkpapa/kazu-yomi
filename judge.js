// judge.js — browser global + node export（ビルドなしで両対応）
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
  // 位の語を含まない「数の名前カナ」だけの羅列か
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

    // 「ぜろ」「れい」を声に出すのは位読みとして誤り（0は読まない）
    if (/ぜろ|れい/.test(raw)) return { ok: false, kind: 'wrong', raw };

    // 数字を抜き出して数値化
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 0) return { ok: false, kind: 'unclear', raw };

    const value = parseInt(digits, 10);
    if (value !== target) return { ok: false, kind: 'wrong', raw };

    return { ok: true, kind: 'match', raw };
  }

  const api = { readingKana, normalize, judge };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof window !== 'undefined' ? window : globalThis);
