'use strict';

const assert = require('assert');
const binet = require('../lib/binet');
const vectors = require('./data/vectors');

const allVectors = vectors.ALL.reduce((p, c) => add(p, c));

describe('binet', function() {
  it('should convert binary addresses to string addresses', () => {
    const validOnionAddress = Buffer.from(
      'fd87d87eeb43ffffffffffffffffffff', 'hex');
    const invalidOnionAddress = Buffer.from(
      'fd87d87eeb43fffffffffffffffffff', 'hex');

    assert(binet.toString(validOnionAddress), 'Invalid onion address');

    try {
      assert(binet.toString(invalidOnionAddress),
        'Invalid onion address mistakenly interpreted as valid');
    } catch (e) {
      if (e.message !== 'Invalid IP address.')
        throw e;
    }
  });

  it('should convert a buffer into an ip address string', () => {
    const validIpV4Buffer = Buffer.from('c0a80101', 'hex');
    const invalidIpV4Buffer = Buffer.from('fffa8010111', 'hex');
    const validIpV6Buffer = Buffer.from(
      '20010db885a3000000008a2e03707334', 'hex');

    assert(binet.encode(validIpV4Buffer) === '192.168.1.1');
    assert(binet.encode(validIpV6Buffer) === '2001:db8:85a3::8a2e:370:7334');

    try {
      assert(binet.encode(invalidIpV4Buffer),
        'Invalid IPv4 buffer interpreted as valid buffer');
    } catch (e) {
      if (e.message !== 'Invalid IP address.')
        throw e;
    }
  });

  it('should convert back and forth', () => {
    for (const v of allVectors) {
      const norm = binet.normalize(v);
      const raw = binet.decode(v);
      const encoded = binet.encode(raw);

      assert.strictEqual(encoded, norm);
    }
  });

  const vectorTests = [
    ['isNull', 'null', binet.isNull, vectors.NULL],
    ['isBroadcast', 'broadcast', binet.isBroadcast, vectors.BROADCAST],
    ['isLocal', 'local', binet.isLocal, vectors.LOCAL],

    // IPv4
    ['isRFC1918', 'RFC 1918', binet.isRFC1918, vectors.RFC1918],
    ['isRFC2544', 'RFC 2544', binet.isRFC2544, vectors.RFC2544],
    ['isRFC3927', 'RFC 3927', binet.isRFC3927, vectors.RFC3927],
    ['isRFC6598', 'RFC 6598', binet.isRFC6598, vectors.RFC6598],
    ['isRFC5737', 'RFC 5737', binet.isRFC5737, vectors.RFC5737],

    // IPv6
    ['isRFC3849', 'RFC 3849', binet.isRFC3849, vectors.RFC3849],
    ['isRFC3964', 'RFC 3964', binet.isRFC3964, vectors.RFC3964],
    ['isRFC6052', 'RFC 6052', binet.isRFC6052, vectors.RFC6052],
    ['isRFC4380', 'RFC 4380', binet.isRFC4380, vectors.RFC4380],
    ['isRFC4862', 'RFC 4862', binet.isRFC4862, vectors.RFC4862],
    ['isRFC4193', 'RFC 4193', binet.isRFC4193, vectors.RFC4193],
    ['isRFC6145', 'RFC 6145', binet.isRFC6145, vectors.RFC6145],
    ['isRFC4843', 'RFC 4843', binet.isRFC4843, vectors.RFC4843],
    ['isRFC7343', 'RFC 7343', binet.isRFC7343, vectors.RFC7343],

    ['isIPV4', 'IPv4', binet.isIPv4, vectors.IPV4],
    ['isIPV6', 'IPv6', binet.isIPv6, vectors.IPV6],

    ['isMulticast', 'multicast', binet.isMulticast, vectors.MULTICAST],
    ['isValid', 'invalid', v => !binet.isValid(v), vectors.INVALID],
    ['isRoutable', 'non-routable',
        v => !binet.isRoutable(v), vectors.UNROUTABLE]
  ];

  for (const [desc, name, fn, vector] of vectorTests) {
    describe(desc, function() {
      const not = sub(allVectors, vector);

      it(`should determine ${name} IPs`, () => {
        for (const v of vector) {
          const decoded = binet.decode(v);
          assert.strictEqual(fn(decoded), true, `${v} is ${name}.`);
        }
      });

      it(`should determine non-${name} IPs`, () => {
        for (const v of not) {
          const decoded = binet.decode(v);
          assert.strictEqual(fn(decoded), false, `${v} is not ${name}.`);
        }
      });
    });
  }

  describe('isOnion', function() {
    const notOnion = add(
      sub(allVectors, vectors.ONION),
      vectors.ONION_BORDERS
    );

    it('should determine onion IPs', () => {
      for (const v of vectors.ONION) {
        const decoded = binet.decode(v);
        assert.strictEqual(binet.isOnion(decoded), true, `${v} is Onion.`);
      }
    });

    // This is special case for Routable, RFC4193 is not while Onion is routable.
    it('should be routable', () => {
      for (const v of vectors.ONION) {
        const decoded = binet.decode(v);
        assert.strictEqual(binet.isRoutable(decoded), true,
          `${v} is Routable.`);
      }
    });

    it('should determine non-onion IPs', () => {
      for (const v of notOnion) {
        const decoded = binet.decode(v);
        assert.strictEqual(binet.isOnion(decoded), false, `${v} is not Onion.`);
      }
    });
  });

  describe('getNetwork', function() {
    const gnVectors = {
      NONE: add(vectors.UNROUTABLE),
      INET4: sub(vectors.IPV4, vectors.UNROUTABLE),
      TEREDO: vectors.RFC4380,
      ONION: vectors.ONION,
      INET6: sub(
        allVectors,
        vectors.UNROUTABLE,
        vectors.IPV4,
        vectors.RFC4380,
        vectors.ONION
      )
    };

    for (const [id, gnVector] of Object.entries(gnVectors)) {
      it(`should get ${id}`, () => {
        for (const v of gnVector) {
          const d = binet.decode(v);
          assert.strictEqual(binet.getNetwork(d), binet.networks[id],
            `network of ${v} is ${id}.`);
        }
      });
    }
  });
});

function sub(va, ...args) {
  assert(args.length > 0);
  const sa = new Set(va);

  for (const vb of args) {
    for (const vector of vb)
      sa.delete(vector);
  }

  return Array.from(sa);
}

function add(va, ...args) {
  assert(args.length >= 0);
  const sa = new Set(va);

  for (const vb of args) {
    for (const vector of vb)
      sa.add(vector);
  }

  return Array.from(sa);
}
