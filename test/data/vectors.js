'use strict';

const vectors = exports;

// Invalid shifted.
vectors.SHIFTED = [
  '::ff:ff00:0:0:0',
  '::ff:ff00:0:0:1',
  '::ff:ffff:ffff:ffff:ffff'
];

// Null
vectors.NULL = [
  '::',
  '0.0.0.0'
];

// Broadcast
vectors.BROADCAST = [
  '255.255.255.255'
];

// RFC 1918 - Private Internets
// - 10/8
// - 172.16/12
// - 192.168/16
vectors.RFC1918 = [
  '192.168.0.0',
  '192.168.1.1',
  '192.168.255.255',
  '10.0.0.0',
  '10.0.0.1',
  '10.255.255.255',
  '172.16.0.0',
  '172.16.255.255',
  '172.31.255.255'
];

// RFC 2544 - IPv4 inter-network communications
//  - 198.18.0.0/15
vectors.RFC2544 = [
  '198.18.0.0',
  '198.18.255.255',
  '198.19.0.0',
  '198.19.255.255'
];

// RFC 3927 - Dynamic Configuration of IPv4 Link-Local Addresses
// - 169.254/16
vectors.RFC3927 = [
  '169.254.0.0',
  '169.254.1.1',
  '169.254.255.255'
];

// RFC 6598 - IANA-Reserved IPv4 Prefix for Shared Address Space
// - 100.64.0.0/10
vectors.RFC6598 = [
  '100.64.0.0',
  '100.64.255.255',
  '100.100.100.100',
  '100.100.200.200',
  '100.127.255.255'
];

// RFC 5737 - IPv4 Address Blocks Reserved for Documentation
// - 192.0.2.0/24    (TEST-NET-1)
// - 198.51.100.0/24 (TEST-NET-2)
// - 203.0.113.0/24  (TEST-NET-3)
vectors.RFC5737 = [
  '192.0.2.0',
  '192.0.2.1',
  '192.0.2.255',
  '198.51.100.0',
  '198.51.100.1',
  '198.51.100.255',
  '203.0.113.0',
  '203.0.113.1',
  '203.0.113.255'
];

// RFC3849 - IPv6 Reserved prefix
// 2001:DB8::/32
vectors.RFC3849 = [
  '2001:0db8::',
  '2001:db8::',
  '2001:db8::1:1',
  '2001:db8:85a3::8a2e:370:7334',
  '2001:0db8:ffff:ffff:ffff:ffff:ffff:ffff'
];

// IPV4
vectors.IPV4 = [
  '0.0.0.0',
  '255.255.255.255',
  ...vectors.RFC1918,
  ...vectors.RFC2544,
  ...vectors.RFC3927,
  ...vectors.RFC6598,
  ...vectors.RFC5737
];

vectors.IPV6 = [
  '::',
  ...vectors.RFC3849
];

vectors.all = [
  ...vectors.SHIFTED,
  ...vectors.NULL,
  ...vectors.BROADCAST,
  ...vectors.RFC1918,
  ...vectors.RFC2544,
  ...vectors.RFC3927,
  ...vectors.RFC6598,
  ...vectors.RFC5737,
  ...vectors.RFC3849,
  ...vectors.IPV4,
  ...vectors.IPV6
];
