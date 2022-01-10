'use strict';

const assert = require('bsert');
const bufio = require('bufio');
const binet = require('../lib/binet');

const ipVectors = require('./data/ip-vectors');
const otherVectors = require('./data/other-vectors');

const allVectors = ipVectors.ALL.reduce((p, c) => add(p, c));

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

  it('should read IP from a buffer', () => {
    for (const {off, size, buf, str, err} of otherVectors.READ) {
      let rerr = null;
      let rres = null;

      try {
        rres = binet.read(buf, off, size);
      } catch (e) {
        rerr = e;
      }

      if (err != null) {
        assert.notStrictEqual(rerr, null, 'Expected error not found.');
        assert.strictEqual(rerr.message, err);
        continue;
      }

      assert.strictEqual(rerr, null);
      assert.strictEqual(rres, str,
        `${str} was not correctly read from ${buf.toString('hex')}`);
    }
  });

  it('should write IP string to a buffer', () => {
    for (const {off, size, foff, buf, str, err} of otherVectors.WRITE) {
      let rerr = null;
      let roff = null;
      const dest = Buffer.alloc(buf.length);

      try {
        roff = binet.write(dest, str, off, size);
      } catch (e) {
        rerr = e;
      }

      if (err != null) {
        assert.notStrictEqual(rerr, null, 'Expected error not found.');
        assert.strictEqual(rerr.message, err);
        continue;
      }

      assert.strictEqual(rerr, null);

      assert.bufferEqual(dest, buf,
        `${str} was not correctly written.`);
      assert.strictEqual(roff, foff,
        `Final offset for ${str} was not correct.`);
    }
  });

  it('should read/write to a buffer writer', () => {
    const ipv4 = [
      '192.168.1.1',
      '254.254.254.254'
    ];
    const ipv6 = [
      'ffff::eeee'
    ];

    const expectedMin = Buffer.from(
      'c0a80101fefefefeffff000000000000000000000000eeee', 'hex');
    const expectedMax = Buffer.from(''
      + '00000000000000000000ffffc0a80101'
      + '00000000000000000000fffffefefefe'
      + 'ffff000000000000000000000000eeee' , 'hex');

    const casesMin = [
      ['StaticWriter', new bufio.StaticWriter(4 + 4 + 16)],
      ['BufferWriter', new bufio.BufferWriter()]
    ];
    const casesMax = [
      ['StaticWriter', new bufio.StaticWriter(16 * 3)],
      ['BufferWriter', new bufio.BufferWriter()]
    ];

    for (const [name, writer] of casesMin) {
      binet.writeBW(writer, ipv4[0], 4);
      binet.writeBW(writer, ipv4[1], 4);
      binet.writeBW(writer, ipv6[0], 16);

      const final = writer.render();
      assert.bufferEqual(final, expectedMin,
        `Could not serialize for ${name}.`);
    }

    for (const [name, writer] of casesMax) {
      binet.writeBW(writer, ipv4[0], 16);
      binet.writeBW(writer, ipv4[1], 16);
      binet.writeBW(writer, ipv6[0], 16);

      const final = writer.render();
      assert.bufferEqual(final, expectedMax,
        `Could not serialize for ${name}.`);
    }

    const readerMin = new bufio.BufferReader(expectedMin);
    const readerMax = new bufio.BufferReader(expectedMax);

    let resIPV4s = [];
    let resIPV6s = [];

    // check min first
    resIPV4s.push(binet.readBR(readerMin, 4));
    resIPV4s.push(binet.readBR(readerMin, 4));
    resIPV6s.push(binet.readBR(readerMin, 16));

    assert.deepStrictEqual(resIPV4s, ipv4);
    assert.deepStrictEqual(resIPV6s, ipv6);

    resIPV6s = [];
    resIPV4s = [];
    resIPV4s.push(binet.readBR(readerMax, 16));
    resIPV4s.push(binet.readBR(readerMax)); // default 16
    resIPV6s.push(binet.readBR(readerMax)); // default 16

    assert.deepStrictEqual(resIPV4s, ipv4);
    assert.deepStrictEqual(resIPV6s, ipv6);
  });

  const vectorTests = [
    ['isNull', 'null', binet.isNull, ipVectors.NULL],
    ['isBroadcast', 'broadcast', binet.isBroadcast, ipVectors.BROADCAST],
    ['isLocal', 'local', binet.isLocal, ipVectors.LOCAL],

    // IPv4
    ['isRFC1918', 'RFC 1918', binet.isRFC1918, ipVectors.RFC1918],
    ['isRFC2544', 'RFC 2544', binet.isRFC2544, ipVectors.RFC2544],
    ['isRFC3927', 'RFC 3927', binet.isRFC3927, ipVectors.RFC3927],
    ['isRFC6598', 'RFC 6598', binet.isRFC6598, ipVectors.RFC6598],
    ['isRFC5737', 'RFC 5737', binet.isRFC5737, ipVectors.RFC5737],

    // IPv6
    ['isRFC3849', 'RFC 3849', binet.isRFC3849, ipVectors.RFC3849],
    ['isRFC3964', 'RFC 3964', binet.isRFC3964, ipVectors.RFC3964],
    ['isRFC6052', 'RFC 6052', binet.isRFC6052, ipVectors.RFC6052],
    ['isRFC4380', 'RFC 4380', binet.isRFC4380, ipVectors.RFC4380],
    ['isRFC4862', 'RFC 4862', binet.isRFC4862, ipVectors.RFC4862],
    ['isRFC4193', 'RFC 4193', binet.isRFC4193, ipVectors.RFC4193],
    ['isRFC6145', 'RFC 6145', binet.isRFC6145, ipVectors.RFC6145],
    ['isRFC4843', 'RFC 4843', binet.isRFC4843, ipVectors.RFC4843],
    ['isRFC7343', 'RFC 7343', binet.isRFC7343, ipVectors.RFC7343],

    ['isIPV4', 'IPv4', binet.isIPv4, ipVectors.IPV4],
    ['isIPV6', 'IPv6', binet.isIPv6, ipVectors.IPV6],

    ['isMulticast', 'multicast', binet.isMulticast, ipVectors.MULTICAST],
    ['isValid', 'invalid', v => !binet.isValid(v), ipVectors.INVALID],
    ['isRoutable', 'non-routable',
        v => !binet.isRoutable(v), ipVectors.UNROUTABLE]
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
      sub(allVectors, ipVectors.ONION),
      ipVectors.ONION_BORDERS
    );

    it('should determine onion IPs', () => {
      for (const v of ipVectors.ONION) {
        const decoded = binet.decode(v);
        assert.strictEqual(binet.isOnion(decoded), true, `${v} is Onion.`);
      }
    });

    // This is special case for Routable, RFC4193 is not while Onion is routable.
    it('should be routable', () => {
      for (const v of ipVectors.ONION) {
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
      NONE: add(ipVectors.UNROUTABLE),
      INET4: sub(ipVectors.IPV4, ipVectors.UNROUTABLE),
      TEREDO: ipVectors.RFC4380,
      ONION: ipVectors.ONION,
      INET6: sub(
        allVectors,
        ipVectors.UNROUTABLE,
        ipVectors.IPV4,
        ipVectors.RFC4380,
        ipVectors.ONION
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

  describe('getReachability', function() {
    const scores = {
      UNREACHABLE: 0,
      DEFAULT: 1,
      TEREDO: 2,
      IPV6_WEAK: 3,
      IPV4: 4,
      IPV6_STRONG: 5,
      PRIVATE: 6
    };

    const IPV4s = sub(ipVectors.IPV4, ipVectors.UNROUTABLE);
    const TEREDOs = ipVectors.RFC4380;
    const ONIONs = ipVectors.ONION;
    const IPV6s = sub(allVectors,
      ipVectors.UNROUTABLE,
      ipVectors.IPV4,
      ipVectors.RFC4380,
      ipVectors.RFC3964,
      ipVectors.RFC6052,
      ipVectors.RFC6145,
      ipVectors.ONION
    );

    const testVectors = [
      {destName: 'IPv4', destStr: IPV4s[0], srcVector: [
        [IPV4s[1], 'IPV4', 'IPv4'],
        [TEREDOs[0], 'DEFAULT', 'TEREDO'],
        [ONIONs[0], 'DEFAULT', 'ONION'],
        [IPV6s[0], 'DEFAULT', 'IPv6']
      ]},
      {destName: 'IPv6', destStr: IPV6s[0], srcVector: [
        [IPV4s[0], 'IPV4', 'IPv4'],
        [TEREDOs[0], 'TEREDO', 'TEREDO'],
        [ipVectors.RFC3964[0], 'IPV6_WEAK', 'RFC3964'],
        [ipVectors.RFC6052[0], 'IPV6_WEAK', 'RFC6052'],
        [ipVectors.RFC6145[0], 'IPV6_WEAK', 'RFC6145'],
        [IPV6s[0], 'IPV6_STRONG', 'IPv6'],
        [ONIONs[0], 'DEFAULT', 'ONION']
      ]},
      {destName: 'ONION', destStr: ONIONs[0], srcVector: [
        [IPV4s[0], 'IPV4', 'IPv4'],
        [ONIONs[1], 'PRIVATE', 'ONION'],
        [TEREDOs[0], 'DEFAULT', 'TEREDO'],
        [IPV6s[0], 'DEFAULT', 'IPv6']
      ]},
      {destName: 'TEREDO', destStr: TEREDOs[0], srcVector: [
        [TEREDOs[1], 'TEREDO', 'TEREDO'],
        [IPV6s[0], 'IPV6_WEAK', 'IPv6'],
        [IPV4s[0], 'IPV4', 'IPv4'],
        [ONIONs[0], 'DEFAULT', 'ONION']
      ]},
      {destName: 'UNREACHABLE', destStr: ipVectors.UNROUTABLE[0], srcVector: [
        [TEREDOs[1], 'TEREDO', 'TEREDO'],
        [IPV6s[0], 'IPV6_WEAK', 'IPv6'],
        [IPV4s[0], 'IPV4', 'IPv4'],
        [ONIONs[0], 'PRIVATE', 'ONION']
      ]}
    ];

    it('should return UNREACHABLE when source is not routable', () => {
      for (const v of ipVectors.UNROUTABLE) {
        const src = binet.decode(v);

        // For this test, destination does not matter
        const score = binet.getReachability(src, null);

        assert.strictEqual(score, scores.UNREACHABLE,
          `destination is UNREACHABLE from ${src}.`);
      }
    });

    for (const {destName, destStr, srcVector} of testVectors) {
      it(`should work with ${destName} as destionaion`, () => {
        const dest = binet.decode(destStr);

        for (const [srcStr, expected, srcName] of srcVector) {
          const src = binet.decode(srcStr);
          const score = binet.getReachability(src, dest);

          assert.strictEqual(score, scores[expected],
            `${srcName} to ${destName} must have ${expected} score`
            + ` for ${srcStr}->${destStr}.`);
        }
      });
    }
  });

  describe('Mappings', function() {
    it('should map 4 byte ip to IPv6', () => {
      for (const vector of otherVectors.MAP_VECTORS) {
        const mapped = binet.map(vector[0]);

        assert.bufferEqual(mapped, vector[1]);
      }
    });

    it('should fail mapping non-4 ip to IPv6', () => {
      for (let i = 0; i < 20; i++) {
        if (i === 4 || i === 16)
          continue;

        assert.throws(() => {
          binet.map(Buffer.alloc(i));
        }, {
          message: 'Not an IPv4 address.'
        });
      }
    });

    it('should unmap IPv6 mapped to IPv4', () => {
      for (const vector of otherVectors.UNMAP_VECTOR) {
        const unmapped = binet.unmap(vector[0]);

        assert.bufferEqual(unmapped, vector[1]);
      }
    });

    it('should fail unmapping non-mapped IPs', () => {
      // incorrect sizes
      for (let i = 0; i < 20; i++) {
        if (i === 4 || i === 16)
          continue;

        assert.throws(() => {
          binet.unmap(Buffer.alloc(i));
        }, {
          message: 'Not an IPv6 address.'
        });
      }
    });

    it('should fail unmapping non-mapped IPv6s', () => {
      for (const vector of otherVectors.UNMAPPED_VECTOR) {
        assert.throws(() => {
          binet.unmap(vector);
        }, {
          message: 'Not an IPv4 mapped address.'
        });
      }
    });

    it('should check mapped string', () => {
      for (const vector of otherVectors.IS_MAPPED_STRING) {
        assert.strictEqual(binet.isMappedString(vector[0]), vector[1]);
      }
    });
  });

  describe('String type', function() {
    const {types} = binet;

    const none = [
      '',
      '1'.repeat(255 + 1),
      '1'.repeat(100)
    ];

    const all = add(
      ipVectors.IPV4,
      ipVectors.IPV6,
      ipVectors.ONION,
      otherVectors.LEGACY_ONIONS,
      none
    );

    it('should return none', () => {
      assert.strictEqual(binet.getTypeString(''), types.NONE);
      assert.strictEqual(binet.getTypeString('1'.repeat(255 + 1)), types.NONE);
      assert.strictEqual(binet.getTypeString('1'.repeat(100)), types.NONE);
    });

    it('should return IPv4', () => {
      for (const vector of ipVectors.IPV4)
        assert.strictEqual(binet.getTypeString(vector), types.INET4);
    });

    it('should return IPv6', () => {
      for (const vector of ipVectors.IPV6)
        assert.strictEqual(binet.getTypeString(vector), types.INET6);
    });

    it('should return ONION', () => {
      for (const vector of otherVectors.LEGACY_ONIONS)
        assert.strictEqual(binet.getTypeString(vector), types.ONION);
    });

    it('should check isIPv4String', () => {
      const not = sub(all, ipVectors.IPV4);

      for (const vector of ipVectors.IPV4)
        assert.strictEqual(binet.isIPv4String(vector), true);

      for (const vector of not)
        assert.strictEqual(binet.isIPv4String(vector), false);
    });

    it('should check isIPv6String', () => {
      const not = sub(all, ipVectors.IPV6);

      for (const vector of ipVectors.IPV6)
        assert.strictEqual(binet.isIPv6String(vector), true);

      for (const vector of not)
        assert.strictEqual(binet.isIPv6String(vector), false);
    });

    it('should check isOnionString', () => {
      const onions = add(otherVectors.LEGACY_ONIONS, ipVectors.ONION);
      const not = sub(all, onions);

      for (const vector of onions)
        assert.strictEqual(binet.isOnionString(vector), true);

      for (const vector of not)
        assert.strictEqual(binet.isOnionString(vector), false);
    });

    it('should check isUnknownString', () => {
      const not = sub(all, none);

      for (const vector of none)
        assert.strictEqual(binet.isUnknownString(vector), true);

      for (const vector of not)
        assert.strictEqual(binet.isUnknownString(vector), false);
    });

    it('should check isIPString', () => {
      const notIPString = add(ipVectors.NONE, otherVectors.LEGACY_ONIONS);

      // check inet4
      for (const vector of ipVectors.IPV4)
        assert.strictEqual(binet.isIPString(vector), types.INET4);

      for (const vector of ipVectors.IPV6)
        assert.strictEqual(binet.isIPString(vector), types.INET6);

      for (const vector of notIPString)
        assert.strictEqual(binet.isIPString(vector), types.NONE);
    });
  });

  describe('Host string', function() {
    it('should convert toHost string', () => {
      for (const vector of otherVectors.TOHOST) {
        const host = binet.toHost(vector[0], vector[1], vector[2]);

        assert.strictEqual(host, vector[3]);
      }
    });

    it('should fail toHost', () => {
      for (const vector of otherVectors.TOHOST_ERR) {
        let err;
        try {
          binet.toHost(vector[0], vector[1], vector[2]);
        } catch (e) {
          err = e;
        }

        assert(err, `Error not found: ${err}`);

        if (!vector[3])
          assert.strictEqual(err instanceof assert.AssertionError, true, err);

        if (vector[3])
          assert.strictEqual(err.message, vector[3]);
      }
    });
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
