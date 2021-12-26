'use strict';

const assert = require('assert');
const binet = require('../lib/binet');
const vectors = require('./data/vectors');

const allVectors = vectors.all.reduce((p, c) => add(p, c));

const {
  NONE,
  INET4,
  INET6,
  ONION,
  TEREDO
} = binet.networks;

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

  it('should getNetwork', () => {
    assert.equal(binet.getNetwork(binet.decode('127.0.0.1')), NONE);
    assert.equal(binet.getNetwork(binet.decode('::1')), NONE);
    assert.equal(binet.getNetwork(binet.decode('8.8.8.8')), INET4);
    assert.equal(binet.getNetwork(binet.decode('8888::8888')), INET6);
    assert.equal(binet.getNetwork(binet.decode('2001::')), TEREDO);
    assert.equal(binet.getNetwork(binet.decode('FD87:D87E:EB43:edb1:8e4:3588:e546:35ca')), ONION);
  });

  it('should return the correct property', () => {
    assert(binet.isIPv4(binet.decode('127.0.0.1')));
    assert(binet.isIPv4(binet.decode('::FFFF:192.168.1.1')));
    assert(binet.isIPv6(binet.decode('::1')));
    assert(binet.isRFC3964(binet.decode('2002::1')));
    assert(binet.isRFC4193(binet.decode('FC00::')));
    assert(binet.isRFC4843(binet.decode('2001:10::')));
    assert(binet.isRFC4862(binet.decode('FE80::')));
    assert(binet.isRFC6052(binet.decode('64:FF9B::')));
    assert(
      binet.isOnion(binet.decode('FD87:D87E:EB43:edb1:8e4:3588:e546:35ca'))
    );

    // isLocal should return true for:
    // - IPv4 loopback (127.0.0.0/8 or 0.0.0.0/8)
    // - IPv6 loopback (::1/128)
    assert(binet.isLocal(binet.decode('127.0.0.1')));
    assert(binet.isLocal(binet.decode('::1')));
    assert(binet.isLocal(binet.decode('0.1.0.0')));
    assert(!binet.isLocal(binet.decode('1.0.0.0')));
    assert(!binet.isLocal(binet.decode('::2')));

    // isRFC7343 should return true for:
    // - IPv6 ORCHIDv2 (2001:20::/28)
    assert(binet.isRFC7343(binet.decode('2001:20::')));
    assert(
      binet.isRFC7343(binet.decode('2001:2f:ffff:ffff:ffff:ffff:ffff:ffff'))
    );
    assert(!binet.isRFC7343(binet.decode('2002:20::')));
    assert(!binet.isRFC7343(binet.decode('0.0.0.0')));
    // isRFC4380 should return true for:
    // - IPv6 Teredo tunnelling (2001::/32)
    assert(binet.isRFC4380(binet.decode('2001::2')));
    assert(binet.isRFC4380(binet.decode('2001:0:ffff:ffff:ffff:ffff:ffff:ffff')));
    assert(!binet.isRFC4380(binet.decode('2002::')));
    assert(!binet.isRFC4380(binet.decode('2001:1:ffff:ffff:ffff:ffff:ffff:ffff')));
    assert(binet.isRoutable(binet.decode('8.8.8.8')));
    assert(binet.isRoutable(binet.decode('2001::1')));
    assert(binet.isValid(binet.decode('127.0.0.1')));
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

    // ['isValid', 'valid', vectors.VALID]
  ];

  for (const [desc, name, fn, vector] of vectorTests) {
    describe(desc, function() {
      const not = subtract(allVectors, vector);

      it(`should determine ${name} IPs`, () => {
        for (const v of vector) {
          const decoded = binet.decode(v);
          assert.strictEqual(fn(decoded), true,
            `${v} is ${name}.`);
        }
      });

      it(`should determine non-${name} IPs`, () => {
        for (const v of not) {
          const decoded = binet.decode(v);
          assert.strictEqual(fn(decoded), false,
            `${v} is not ${name}.`);
        }
      });
    });
  }

  describe('isValid', function() {
    const invalidVectors = [
      ...vectors.SHIFTED,
      ...vectors.NULL,
      ...vectors.BROADCAST,
      ...vectors.RFC3849
    ];

    const validVectors = subtract(allVectors, invalidVectors);

    it('should validate valid IPs', () => {
      for (const v of validVectors) {
        const decoded = binet.decode(v);
        assert.strictEqual(binet.isValid(decoded), true,
          `${v} is valid.`);
      }
    });

    it('should validate invalid IPs', () => {
      for (const v of invalidVectors) {
        const decoded = binet.decode(v);

        assert.strictEqual(binet.isValid(decoded), false,
          `${v} is invalid.`);
      }
    });
  });
});

function subtract(va, vb) {
  const sa = new Set(va);

  for (const vector of vb)
    sa.delete(vector);

  return Array.from(sa);
}

function add(va, vb) {
  const sa = new Set(va);

  for (const vector of vb)
    sa.add(vector);

  return Array.from(sa);
}
