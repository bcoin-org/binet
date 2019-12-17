/**
 * Copyright (c) 2017-2018, Christopher Jeffrey (MIT License).
 * Copyright (c) 2019, Mark Tyneway (MIT License).
 * Copyright (c) 2019, Sean Kilgarriff (MIT License).
 *
 * Parts of this software are based on bitcoin/bitcoin:
 * Copyright (c) 2009-2019, The Bitcoin Core Developers (MIT License).
 * Copyright (c) 2009-2019, The Bitcoin Developers (MIT License).
 * https://github.com/bitcoin/bitcoin
 *
 * Resources:
 *   https://github.com/bitcoin/bitcoin/blob/master/src/test/netbase_tests.cpp
 */

/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */

'use strict';

const assert = require('assert');
const binet  = require('../lib/binet');

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

  it('should convert back and forth', () => {
    const ip4 = '192.168.1.1';
    const ip6 = '2001:db8:85a3::8a2e:370:7334';

    const raw4 = binet.decode(ip4);
    const raw6 = binet.decode(ip6);

    assert.strictEqual(binet.encode(raw4), ip4);
    assert.strictEqual(binet.encode(raw6), ip6);
  });

  it('should return the correct property', () => {
    assert(binet.isIPv4(binet.decode('127.0.0.1')));
    assert(binet.isIPv4(binet.decode('::FFFF:192.168.1.1')));
    assert(binet.isIPv6(binet.decode('::1')));
    assert(binet.isRFC1918(binet.decode('10.0.0.1')));
    assert(binet.isRFC1918(binet.decode('192.168.1.1')));
    assert(binet.isRFC1918(binet.decode('172.31.255.255')));
    assert(binet.isRFC3849(binet.decode('2001:0DB8::')));
    assert(binet.isRFC3927(binet.decode('169.254.1.1')));
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

  it('should getNetwork', () => {
    assert.equal(binet.getNetwork(binet.decode('127.0.0.1')), NONE);
    assert.equal(binet.getNetwork(binet.decode('::1')), NONE);
    assert.equal(binet.getNetwork(binet.decode('8.8.8.8')), INET4);
    assert.equal(binet.getNetwork(binet.decode('8888::8888')), INET6);
    assert.equal(binet.getNetwork(binet.decode('2001::')), TEREDO);
    assert.equal(binet.getNetwork(binet.decode('FD87:D87E:EB43:edb1:8e4:3588:e546:35ca')), ONION);
  });
});
