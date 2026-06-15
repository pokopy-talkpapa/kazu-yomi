import { test } from 'node:test';
import assert from 'node:assert/strict';
import pkg from './judge.js';
const { readingKana, normalize, judge } = pkg;

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

test('normalize: 全角→半角・空白整理', () => {
  assert.equal(normalize('３６５'), '365');
  assert.equal(normalize('  365 '), '365');
});

test('judge: 数字だけ（位の語なし）→ bara（きびしめ）', () => {
  assert.equal(judge('365', 365).kind, 'bara');
  assert.equal(judge('３６５', 365).kind, 'bara');
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
  assert.equal(judge('さんびゃくろくじゅうご', 365).ok, true);
  assert.equal(judge('365', 365).ok, false);   // 位の語なし → bara → NG
  assert.equal(judge('3 6 5', 365).ok, false);
});
