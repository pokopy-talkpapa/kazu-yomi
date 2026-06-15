import { test } from 'node:test';
import assert from 'node:assert/strict';
import pkg from './judge.js';
const { readingKana } = pkg;

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
