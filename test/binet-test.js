'use strict';

const assert = require('assert');
const binet = require('../lib/binet');
const vectors = require('./data/vectors');

const allVectors = vectors.all;

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

  describe('isNull', function() {
    const notNull = subtract(allVectors, vectors.NULL);

    it('should determine null IPs', () => {
      for (const v of vectors.NULL) {
        const decoded = binet.decode(v);

        assert.strictEqual(binet.isNull(decoded), true,
          `${v} is null.`);
      }
    });

    it('should determine not-null IPs', () => {
      for (const v of notNull) {
        const decoded = binet.decode(v);

        assert.strictEqual(binet.isNull(decoded), false,
          `${v} is not null.`);
      }
    });
  });

  describe('isBroadcast', function() {
    const notBroadcast = subtract(allVectors, vectors.BROADCAST);

    it('should determine broadcast IPs', () => {
      for (const v of vectors.BROADCAST) {
        const decoded = binet.decode(v);

        assert.strictEqual(binet.isBroadcast(decoded), true,
          `${v} is broadcast.`);
      }
    });

    it('should determine non-broadcast IPs', () => {
      for (const v of notBroadcast) {
        const decoded = binet.decode(v);

        assert.strictEqual(binet.isBroadcast(decoded), false,
          `${v} is not a broadcast.`);
      }
    });
  });

  describe('isRFC1918', function() {
    const notRFC1918 = subtract(allVectors, vectors.RFC1918);

    it('should determine RFC1918 IPs', () => {
      for (const v of vectors.RFC1918) {
        const decoded = binet.decode(v);
        assert.strictEqual(binet.isRFC1918(decoded), true,
          `${v} is RFC1918.`);
      }
    });

    it('should determine non-RFC1918 IPs', () => {
      for (const v of notRFC1918) {
        const decoded = binet.decode(v);
        assert.strictEqual(binet.isRFC1918(decoded), false,
          `${v} is not RFC1918.`);
      }
    });
  });

  describe('isRFC2544', function() {
    const notRFC2544 = subtract(allVectors, vectors.RFC2544);

    it('should determine RFC2544 IPs', () => {
      for (const v of vectors.RFC2544) {
        const decoded = binet.decode(v);
        assert.strictEqual(binet.isRFC2544(decoded), true,
          `${v} is RFC2544.`);
      }
    });

    it('should determine non-RFC2544 IPs', () => {
      for (const v of notRFC2544) {
        const decoded = binet.decode(v);
        assert.strictEqual(binet.isRFC2544(decoded), false,
          `${v} is not RFC2544.`);
      }
    });
  });

  describe('isRFC3927', function() {
    const notRFC3927 = subtract(allVectors, vectors.RFC3927);

    it('should determine RFC3927 IPs', () => {
      for (const v of vectors.RFC3927) {
        const decoded = binet.decode(v);
        assert.strictEqual(binet.isRFC3927(decoded), true,
          `${v} is RFC3927.`);
      }
    });

    it('should determine non-RFC3927 IPs', () => {
      for (const v of notRFC3927) {
        const decoded = binet.decode(v);
        assert.strictEqual(binet.isRFC3927(decoded), false,
          `${v} is not RFC3927.`);
      }
    });
  });

  describe('isRFC6598', function() {
    const notRFC6598 = subtract(allVectors, vectors.RFC6598);

    it('should determine RFC6598 IPs', () => {
      for (const v of vectors.RFC6598) {
        const decoded = binet.decode(v);
        assert.strictEqual(binet.isRFC6598(decoded), true,
          `${v} is RFC6598.`);
      }
    });

    it('should determine non-RFC6598 IPs', () => {
      for (const v of notRFC6598) {
        const decoded = binet.decode(v);
        assert.strictEqual(binet.isRFC6598(decoded), false,
          `${v} is not RFC6598.`);
      }
    });
  });

  describe('isRFC5737', function() {
    const notRFC5737 = subtract(allVectors, vectors.RFC5737);

    it('should determine RFC5737 IPs', () => {
      for (const v of vectors.RFC5737) {
        const decoded = binet.decode(v);
        assert.strictEqual(binet.isRFC5737(decoded), true,
          `${v} is RFC5737.`);
      }
    });

    it('should determine non-RFC5737 IPs', () => {
      for (const v of notRFC5737) {
        const decoded = binet.decode(v);
        assert.strictEqual(binet.isRFC5737(decoded), false,
          `${v} is not RFC5737.`);
      }
    });
  });

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

  describe('isRFC3849', function() {
    const notRFC3849 = subtract(allVectors, vectors.RFC3849);

    it('should determine RFC3849 IPs', () => {
      for (const v of vectors.RFC3849) {
        const decoded = binet.decode(v);
        assert.strictEqual(binet.isRFC3849(decoded), true,
          `${v} is valid RFC3849.`);
      }
    });

    it('should determine non-RFC3849 IPs', () => {
      for (const v of notRFC3849) {
        const decoded = binet.decode(v);
        assert.strictEqual(binet.isRFC3849(decoded), false,
          `${v} is not RFC3849.`);
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
