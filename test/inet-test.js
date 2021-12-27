'use strict';

const assert = require('bsert');
const inet = require('../lib/inet');

const inetVectors = require('./data/inet-vectors');

describe('inet', function() {
  it('should convert using pton4', () => {
    for (const [ebits, off, eraw, str] of inetVectors.PTON4) {
      const raw = Buffer.alloc(4);
      const rawPton = Buffer.alloc(4);
      const resBits = inet.pton4(str, raw, off);
      const resPton = inet.pton(4, str, rawPton, off);

      assert.bufferEqual(raw, eraw,
        `Failed to convert ${str}.`);
      assert.bufferEqual(rawPton, eraw,
        `Failed to convert ${str}.`);
      assert.strictEqual(resBits, ebits,
        `Incorrect bits for ${str}.`);
      assert.strictEqual(resPton, ebits,
        `Incorrect bits for ${str}.`);
    }
  });

  it('should fail converting using pton4', () => {
    for (const [code, size, off, str] of inetVectors.PTON4_MALFORMED) {
      const raw = Buffer.alloc(size);
      const rawPton = Buffer.alloc(size);
      const res = inet.pton4(str, raw, off);
      const resPton = inet.pton(4, str, rawPton, off);

      assert.strictEqual(res, code, `${str} should fail.`);
      assert.strictEqual(resPton, code, `${str} should fail.`);
    }
  });

  it('should convert using pton6', () => {
    for (const [ebits, off, eraw, str] of inetVectors.PTON6) {
      const raw = Buffer.alloc(16);
      const rawPton = Buffer.alloc(16);
      const res = inet.pton6(str, raw, off);
      const resPton = inet.pton(6, str, rawPton, off);

      assert.bufferEqual(raw, eraw,
        `Failed to convert ${str}.`);
      assert.bufferEqual(rawPton, eraw,
        `Failed to convert ${str}.`);
      assert.strictEqual(res, ebits,
        `Incorrect bits for ${str}.`);
      assert.strictEqual(resPton, ebits,
        `Incorrect bits for ${str}.`);
    }
  });

  it('should fail converting using pton6', () => {
    for (const [code, size, off, str] of inetVectors.PTON6_MALFORMED) {
      const raw = Buffer.alloc(size);
      const rawPton = Buffer.alloc(size);
      const res = inet.pton6(str, raw, off);
      const resPton = inet.pton6(str, rawPton, off);

      assert.strictEqual(res, code, `${str} should fail.`);
      assert.strictEqual(resPton, code, `${str} should fail.`);
    }
  });
});
