'use strict';
/**
 * Bộ bài 52 lá dùng chung cho Tiến lên miền Nam và Phỏm.
 * Mã lá c = 0..51: r = c >> 2 (0..12 = 3 4 5 6 7 8 9 10 J Q K A 2), s = c & 3 (0 ♠, 1 ♣, 2 ♦, 3 ♥).
 * Thứ tự mã = thứ tự Tiến lên (3♠ nhỏ nhất, 2♥ lớn nhất).
 */
const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
const SUITS = ['♠', '♣', '♦', '♥'];
const rankOf = (c) => c >> 2;
const suitOf = (c) => c & 3;
const isRed = (c) => (c & 3) >= 2;
const name = (c) => `${RANKS[c >> 2]}${SUITS[c & 3]}`;
/** Giá trị Phỏm: A = 1, 2 = 2, 3..K = 3..13. */
const phomRank = (c) => { const r = c >> 2; return r <= 10 ? r + 3 : r - 10; };

function shuffled(rng = Math.random) {
  const d = Array.from({ length: 52 }, (_, i) => i);
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}

const validCard = (c) => Number.isInteger(c) && c >= 0 && c < 52;

/** Danh sách lá hợp lệ, không trùng, đều có trong `hand`. */
function takeFrom(hand, cards) {
  if (!Array.isArray(cards) || !cards.length || !cards.every(validCard) || new Set(cards).size !== cards.length) return null;
  if (!cards.every((c) => hand.includes(c))) return null;
  return [...cards].sort((a, b) => a - b);
}

module.exports = { RANKS, SUITS, rankOf, suitOf, isRed, name, phomRank, shuffled, validCard, takeFrom };
