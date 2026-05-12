/**
 * Unit tests for the Gamified Review Scoring Algorithm
 *
 * Project 2 — Week 3 Requirement:
 * The review engine must programmatically allocate points based on an algorithm
 * that weighs word count, keyword density, and the presence of uploaded media.
 */

// ─── Pure scoring function extracted for testability ─────────────────────────
// This mirrors the exact logic in reviewRoutes.js POST /

const BONUS_KEYWORDS = [
  'delicious', 'amazing', 'fresh', 'hot', 'spicy', 'tasty',
  'excellent', 'perfect', 'quick', 'friendly'
];
const MEDIA_BONUS = 15;
const MAX_WORD_POINTS = 20;
const MAX_KEYWORD_POINTS = 30;
const MIN_WORDS_TO_QUALIFY = 5;
const KEYWORD_POINT_VALUE = 5;

/**
 * Calculates review reward points.
 * @param {string} reviewText
 * @param {boolean} hasMedia
 * @returns {number} total reward points
 */
function calculateReviewPoints(reviewText, hasMedia = false) {
  const words = reviewText?.trim().split(/\s+/).filter(Boolean) || [];
  const lowerWords = words.map(w => w.toLowerCase().replace(/[.,!?]/g, ''));
  const keywordMatches = lowerWords.filter(w => BONUS_KEYWORDS.includes(w)).length;

  let points = 0;
  if (words.length >= MIN_WORDS_TO_QUALIFY) {
    points = Math.min(words.length, MAX_WORD_POINTS)
           + Math.min(keywordMatches * KEYWORD_POINT_VALUE, MAX_KEYWORD_POINTS);
  }

  if (hasMedia) points += MEDIA_BONUS;
  return points;
}

/**
 * Calculates sentiment from rating and review text.
 * @param {number} rating  1–5
 * @param {string} reviewText
 * @returns {'positive'|'neutral'|'negative'}
 */
function calculateSentiment(rating, reviewText) {
  const lowerText = reviewText?.toLowerCase() || '';
  const posWords = ['good', 'great', 'excellent', 'amazing', 'delicious', 'fresh', 'hot', 'quick', 'friendly', 'tasty'];
  const negWords = ['bad', 'poor', 'cold', 'late', 'rude', 'unpleasant', 'wrong', 'oily', 'expensive', 'salty'];
  const posCount = posWords.filter(w => lowerText.includes(w)).length;
  const negCount = negWords.filter(w => lowerText.includes(w)).length;

  if (rating >= 4 || posCount > negCount) return 'positive';
  if (rating <= 2 || negCount > posCount) return 'negative';
  return 'neutral';
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Review Scoring Algorithm — Word Count', () => {
  test('should award 0 points for reviews with fewer than 5 words', () => {
    expect(calculateReviewPoints('Good food')).toBe(0);
    expect(calculateReviewPoints('')).toBe(0);
    expect(calculateReviewPoints('Nice')).toBe(0);
  });

  test('should award 1 point per word up to 20', () => {
    // 5 words → 5 pts
    expect(calculateReviewPoints('The food was very good')).toBe(5);
    // 11 words → 11 pts (no keywords match)
    expect(calculateReviewPoints('The food was very good and I enjoyed every single bite')).toBe(11);
  });

  test('should cap word points at 20 for reviews longer than 20 words', () => {
    const longReview = 'word '.repeat(30).trim(); // 30 words, no keywords
    expect(calculateReviewPoints(longReview)).toBe(20);
  });
});

describe('Review Scoring Algorithm — Keyword Density', () => {
  test('should award 5 points per bonus keyword match', () => {
    // 5 words + 1 keyword = 5 + 5 = 10
    expect(calculateReviewPoints('The food was absolutely delicious')).toBe(10);
  });

  test('should award bonus for multiple keyword matches', () => {
    // 5 words, 2 keywords (fresh + hot): 5 + 10 = 15
    expect(calculateReviewPoints('The food was fresh hot')).toBe(15);
  });

  test('should cap keyword points at 30', () => {
    // 6+ keywords, should cap at 30 keyword pts + word pts
    // "delicious amazing fresh hot spicy tasty excellent" = 7 words, 7 keywords → 7 + min(35,30) = 7+30=37
    expect(calculateReviewPoints('delicious amazing fresh hot spicy tasty excellent')).toBe(7 + 30);
  });

  test('should be case-insensitive for keyword matching', () => {
    const pts1 = calculateReviewPoints('The food was DELICIOUS and so FRESH');
    const pts2 = calculateReviewPoints('The food was delicious and so fresh');
    expect(pts1).toBe(pts2);
  });

  test('should ignore punctuation on keywords', () => {
    // "delicious," should still match
    const pts = calculateReviewPoints('The food was delicious, hot and fresh');
    expect(pts).toBeGreaterThan(5); // must get keyword bonus
  });
});

describe('Review Scoring Algorithm — Media Bonus (Project 2 Core)', () => {
  test('should award +15 points when media is uploaded', () => {
    const withoutMedia = calculateReviewPoints('The food was very good');  // 5 pts
    const withMedia = calculateReviewPoints('The food was very good', true); // 5 + 15 = 20
    expect(withMedia - withoutMedia).toBe(MEDIA_BONUS);
  });

  test('should award media bonus even with a short review (< 5 words)', () => {
    // Short review earns 0 word pts but should still get media bonus
    expect(calculateReviewPoints('Good', true)).toBe(15);
  });

  test('total score with long review + keywords + media should not exceed 65', () => {
    // Max: 20 word + 30 keyword + 15 media = 65
    const review = 'delicious amazing fresh hot spicy tasty excellent quick friendly perfect perfect perfect perfect perfect perfect perfect perfect perfect perfect perfect';
    const score = calculateReviewPoints(review, true);
    expect(score).toBeLessThanOrEqual(65);
    expect(score).toBe(65); // Should hit the exact ceiling
  });
});

describe('Sentiment Analysis', () => {
  test('should return positive for high rating', () => {
    expect(calculateSentiment(5, 'food was ok')).toBe('positive');
    expect(calculateSentiment(4, 'decent place')).toBe('positive');
  });

  test('should return negative for low rating', () => {
    expect(calculateSentiment(1, 'food was ok')).toBe('negative');
    expect(calculateSentiment(2, 'nothing special')).toBe('negative');
  });

  test('should detect positive sentiment from text', () => {
    expect(calculateSentiment(3, 'food was great and delicious')).toBe('positive');
  });

  test('should detect negative sentiment from text', () => {
    expect(calculateSentiment(3, 'food was cold and bad, very rude staff')).toBe('negative');
  });

  test('should default to neutral when signals are balanced', () => {
    expect(calculateSentiment(3, 'it was okay')).toBe('neutral');
  });
});
