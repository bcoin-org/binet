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

// Local
// 127.0.0.0/8
// 0.0.0.0/8
vectors.LOCAL_IPV4 = [
  '127.0.0.0',
  '127.0.0.1',
  '127.255.255.255',
  '0.0.0.0',
  '0.0.0.1',
  '0.1.0.1',
  '0.255.255.255'
];

// ::1/128
vectors.LOCAL_IPV6 = [
  '::1'
];

vectors.LOCAL = [
  ...vectors.LOCAL_IPV4,
  ...vectors.LOCAL_IPV6
];

// Multicast
//  IPv4 - RFC3171
// 224.0.0.0/4
vectors.MULTICAST_IPV4 = [
  '224.0.0.0',
  '224.0.0.1',
  '230.100.100.100',
  '239.255.255.255'
];

vectors.MULTICAST_IPV4_BORDERS = [
  '223.255.255.255',
  '240.0.0.0'
];

// IPv6 - RFC4291
// ff00::/8
vectors.MULTICAST_IPV6 = [
  'ff00::',
  'ff00::1',
  'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'
];

vectors.MULTICAST_IPV6_BORDERS = [
  'feff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'
];

// Multicast combined
vectors.MULTICAST = [
  ...vectors.MULTICAST_IPV4,
  ...vectors.MULTICAST_IPV6
];

vectors.MULTICAST_BORDERS = [
  ...vectors.MULTICAST_IPV4_BORDERS,
  ...vectors.MULTICAST_IPV6_BORDERS
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

// RFC 1918 +1/-1
vectors.RFC1918_BORDERS = [
  '9.255.255.255',
  '11.0.0.0',
  '172.15.255.255',
  '172.32.0.0',
  '192.167.255.255',
  '192.169.0.0'
];

// RFC 2544 - IPv4 inter-network communications
//  - 198.18.0.0/15
vectors.RFC2544 = [
  '198.18.0.0',
  '198.18.255.255',
  '198.19.0.0',
  '198.19.255.255'
];

// RFC 2544 +/- 1.
vectors.RFC2544_BORDERS = [
  '192.17.255.255',
  '192.20.0.0'
];

// RFC 3927 - Dynamic Configuration of IPv4 Link-Local Addresses
// - 169.254/16
vectors.RFC3927 = [
  '169.254.0.0',
  '169.254.1.1',
  '169.254.255.255'
];

vectors.RFC3927_BORDERS = [
  '169.243.255.255',
  '169.255.0.0'
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

vectors.RFC6598_BORDERS = [
  '100.64.255.255',
  '100.128.0.0'
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

vectors.RFC5737_BORDERS = [
  '192.0.1.255',
  '192.0.3.0',
  '198.51.99.255',
  '198.51.101.0',
  '203.0.112.255',
  '203.0.114.0'
];

// RFC 3849 - IPv6 Reserved prefix
// 2001:DB8::/32
vectors.RFC3849 = [
  '2001:0db8::',
  '2001:db8::',
  '2001:db8::1:1',
  '2001:db8:85a3::8a2e:370:7334',
  '2001:0db8:ffff:ffff:ffff:ffff:ffff:ffff'
];

vectors.RFC3849_BORDERS = [
  '2001:db9::',
  '2001:db7:ffff:ffff:ffff:ffff:ffff:ffff'
];

// RFC 3964 - Security Considerations for 6to4
// 2002::/16
vectors.RFC3964 = [
  '2002::',
  '2002::1',
  '2002:20::',
  '2002:ffff:ffff:ffff:ffff:ffff:ffff:ffff'
];

vectors.RFC3964_BORDERS = [
  '2001:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
  '2003::'
];

// RFC 6052 - IPv6 Addressing of IPv4/IPv6 Translators
// 64:ff9b::/96
vectors.RFC6052 = [
  '64:ff9b::',
  '0064:ff9b::ffff:ffff'
];

vectors.RFC6052_BORDERS = [
  '64:ff9b::1:0:0',
  '64:ff9a:ffff:ffff:ffff:ffff:ffff:ffff'
];

// RFC 4380 - Teredo: Tunneling IPv6 over UDP
//            through Network Address Translations (NATs)
// 2001:0000:/32
vectors.RFC4380 = [
  '2001::',
  '2001::1',
  '2001:0:ffff:ffff:ffff:ffff:ffff:ffff'
];

vectors.RFC4380_BORDERS = [
  '2000:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
  '2001:1::',
  '2002::',
  '2001:1:ffff:ffff:ffff:ffff:ffff:ffff'
];

// RFC 4862 - IPv6 Stateless Address Autoconfiguration
// fe80::/64
vectors.RFC4862 = [
  'fe80::',
  'fe80::1',
  'fe80::ffff:ffff:ffff:ffff'
];

vectors.RFC4862_BORDER = [
  'fe79:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
  'fe80:0:0:1::'
];

// RFC 4193 - Unique Local IPv6 Unicast Addresses
// NOTE: Make sure these tests do not include Onion
// fc00::/7
vectors.RFC4193 = [
  'fc00::',
  'fc00::1',
  'fcff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
  'fd00::',
  'fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'
];

vectors.RFC4193_BORDERS = [
  'fbff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
  'fe00::'
];

// RFC 6145 - IP/ICMP Translation Algorithm
// updates RFC 2765 for IPv4 translated.
// 0::ffff:0:0:0/96
vectors.RFC6145 = [
  '0::ffff:0:0:0',
  '0::ffff:0:0:1',
  '0::ffff:0:ffff:ffff'
];

vectors.RFC6145_BORDERS = [
  '0::fffe:ffff:ffff:ffff',
  '0::ffff:1:0:0'
];

// RFC 4843 - An IPv6 Prefix for
//            Overlay Routable Cryptographic Hash Identifiers (ORCHID)
// 2001:10::/28
vectors.RFC4843 = [
  '2001:10::',
  '2001:10::1',
  '2001:1f:ffff:ffff:ffff:ffff:ffff:ffff'
];

vectors.RFC4843_BORDERS = [
  '2001:f:ffff:ffff:ffff:ffff:ffff:ffff',
  '2001:20::' // ORCHIDv2 - should match with RFC7343 test below
];

// RFC 7343 - An IPv6 Prefix for
//            Overlay Routable Cryptographic Hash Identifiers Version 2
//            (ORCHIDv2)
// 2001:20::/28
vectors.RFC7343 = [
  '2001:20::',
  '2001:20::1',
  '2001:2f:ffff:ffff:ffff:ffff:ffff:ffff'
];

vectors.RFC7343_BORDERS = [
  '2001:1f:ffff:ffff:ffff:ffff:ffff:ffff', // ORCHID v1
  '2001:30::',
  '2002:20::' // RFC 3964
];

// Onion
// fd87:d87e:eb43::/48
vectors.ONION = [
  'fd87:d87e:eb43::',
  'fd87:d87e:eb43::1',
  'fd87:d87e:eb43:ffff:ffff:ffff:ffff:ffff'
];

vectors.ONION_BORDERS = [
  'fd87:d87e:eb42:ffff:ffff:ffff:ffff:ffff',
  'fd87:d87e:eb44::'
];

// IPV4
vectors.IPV4 = [
  '0.0.0.0',
  '::ffff:199.200.201.202',

  ...vectors.BROADCAST,

  // local and IPv4
  ...vectors.LOCAL_IPV4,

  // Multicast
  ...vectors.MULTICAST_IPV4,
  ...vectors.MULTICAST_IPV4_BORDERS,

  // RFC 1918
  ...vectors.RFC1918,
  ...vectors.RFC1918_BORDERS,
  // RFC 2544
  ...vectors.RFC2544,
  ...vectors.RFC2544_BORDERS,

  // RFC 3927
  ...vectors.RFC3927,
  ...vectors.RFC3927_BORDERS,

  // RFC 6598
  ...vectors.RFC6598,
  ...vectors.RFC6598_BORDERS,

  ...vectors.RFC5737,
  ...vectors.RFC5737_BORDERS
];

vectors.IPV6 = [
  '::',

  // this is still IPv6?
  ...vectors.SHIFTED,

  // local but IPv6
  ...vectors.LOCAL_IPV6,

  // Multicast
  ...vectors.MULTICAST_IPV6,
  ...vectors.MULTICAST_IPV6_BORDERS,

  ...vectors.RFC3849,
  ...vectors.RFC3849_BORDERS,

  ...vectors.RFC3964,
  ...vectors.RFC3964_BORDERS,

  ...vectors.RFC6052,
  ...vectors.RFC6052_BORDERS,

  ...vectors.RFC4380,
  ...vectors.RFC4380_BORDERS,

  ...vectors.RFC4862,
  ...vectors.RFC4862_BORDER,

  ...vectors.RFC4193,
  ...vectors.RFC4193_BORDERS,

  ...vectors.RFC6145,
  ...vectors.RFC6145_BORDERS,

  ...vectors.RFC4843,
  ...vectors.RFC4843_BORDERS,

  ...vectors.RFC7343,
  ...vectors.RFC7343_BORDERS

  // Because it's also part of RFC4193, we will test them separately.
  // ...vectors.ONION,
  // ...vectors.ONION_BORDERS
];

vectors.INVALID = [
  ...vectors.SHIFTED,
  ...vectors.NULL,
  ...vectors.BROADCAST,
  ...vectors.RFC3849
];

vectors.UNROUTABLE = [
  '::',
  ...vectors.INVALID,
  ...vectors.RFC1918,
  ...vectors.RFC2544,
  ...vectors.RFC3927,
  ...vectors.RFC4862,
  ...vectors.RFC6598,
  ...vectors.RFC5737,
  ...vectors.RFC4193,
  ...vectors.RFC4843,
  ...vectors.RFC7343,
  ...vectors.LOCAL
];

vectors.ALL = [
  vectors.SHIFTED,
  vectors.NULL,
  vectors.BROADCAST,
  vectors.LOCAL,

  vectors.MULTICAST,
  vectors.MULTICAST_BORDERS,

  // IPv4
  vectors.RFC1918,
  vectors.RFC1918_BORDERS,

  vectors.RFC2544,
  vectors.RFC2544_BORDERS,

  vectors.RFC3927,
  vectors.RFC3927_BORDERS,

  vectors.RFC6598,
  vectors.RFC6598_BORDERS,

  vectors.RFC5737,
  vectors.RFC5737_BORDERS,

  // IPv6
  vectors.RFC3849,
  vectors.RFC3849_BORDERS,

  vectors.RFC3964,
  vectors.RFC3964_BORDERS,

  vectors.RFC6052,
  vectors.RFC6052_BORDERS,

  vectors.RFC4380,
  vectors.RFC4380_BORDERS,

  vectors.RFC4862,
  vectors.RFC4862_BORDER,

  vectors.RFC4193,
  vectors.RFC4193_BORDERS,

  vectors.RFC6145,
  vectors.RFC6145_BORDERS,

  vectors.RFC4843,
  vectors.RFC4843_BORDERS,

  vectors.RFC7343,
  vectors.RFC7343_BORDERS,

  // Because it's also part of RFC4193, we will test them separately.
  // vectors.ONION,
  // vectors.ONION_BORDERS,

  vectors.IPV4,
  vectors.IPV6
];
