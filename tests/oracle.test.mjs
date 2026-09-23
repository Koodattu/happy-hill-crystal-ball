import test from 'node:test';
import assert from 'node:assert/strict';
import { answers, drawAnswer, createShakeDetector } from '../answers.mjs';

test('five topics contain 100 unique, concise answers', () => {
  assert.equal(Object.keys(answers).length, 5);
  const all = Object.values(answers).flat();
  assert.equal(all.length, 100);
  assert.equal(new Set(all).size, 100);
  for (const pool of Object.values(answers)) {
    assert.equal(pool.length, 20);
    assert.ok(pool.every(answer => answer.length > 0 && answer.length < 120));
  }
});
test('answers stay on topic and never repeat the previous answer', () => {
  for (const [topic, pool] of Object.entries(answers)) {
    for (const previous of [undefined, ...pool]) {
      for (let sample = 0; sample < 100; sample++) {
        const answer = drawAnswer(topic, previous, () => sample / 100);
        assert.ok(pool.includes(answer));
        assert.notEqual(answer, previous);
      }
    }
  }
});
test('shaking needs fast direction reversals and resets after triggering', () => {
  const shake = createShakeDetector(7);
  assert.equal(shake(20, 0), false);
  assert.equal(shake(20, 100), false);
  assert.equal(shake(-20, 200), false);
  assert.equal(shake(20, 300), false);
  assert.equal(shake(-20, 400), true);
  assert.equal(shake(20, 500), false);
});
test('small movements and slow drags cannot trigger an answer', () => {
  const shake = createShakeDetector(12);
  for (let i = 0; i < 30; i++) assert.equal(shake(i % 2 ? 5 : -5, i * 20), false);
  for (let i = 0; i < 10; i++) assert.equal(shake(i % 2 ? 20 : -20, 1000 + i * 800), false);
});
