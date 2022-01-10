'use strict';

const binet = require('../..');

const vectors = exports;

/*
 * Map/Unmap
 */

vectors.MAP_VECTORS = [
  [binet.ZERO_IPV6, binet.ZERO_IPV6],
  [Buffer.alloc(16, 1), Buffer.alloc(16, 1)],
  [binet.ZERO_IPV4, binet.ZERO_IPV4],
  [Buffer.alloc(4, 0), binet.ZERO_IPV4],
  [
    Buffer.from('00000000000000000000fffffefefefe', 'hex'),
    Buffer.from('00000000000000000000fffffefefefe', 'hex')
  ], [
    Buffer.from('fefefefe', 'hex'),
    Buffer.from('00000000000000000000fffffefefefe', 'hex')
  ], [
    Buffer.from('ffffffff', 'hex'),
    Buffer.from('00000000000000000000ffffffffffff', 'hex')
  ], [
    // NOTE: Maybe it should fail if RAW is not mapped and is unmappable?
    Buffer.from('ffffffffffffffffffffffffffffffff', 'hex'),
    Buffer.from('ffffffffffffffffffffffffffffffff', 'hex')
  ]
];

// these are mapped ips
vectors.UNMAP_VECTOR = [
  [Buffer.alloc(4, 0), Buffer.alloc(4, 0)],
  [Buffer.alloc(4, 0xff), Buffer.alloc(4, 0xff)],
  [binet.ZERO_IPV4, Buffer.alloc(4, 0)],
  [
    Buffer.from('00000000000000000000ffffffffffff', 'hex'),
    Buffer.from('ffffffff', 'hex')
  ]
];

// isMappedString tests
vectors.IS_MAPPED_STRING = [
  ['127.0.0.1', false],
  ['0.0.0.0', false],
  ['255.255.255.255', false],
  ['hello', false],
  ['::', false],
  ['::1', false],
  ['::ffff:ffff', false],
  ['::f:ffff:ffff', false],
  ['::ff:ffff:ffff', false],
  ['::fff:ffff:ffff', false],
  ['::1:ffff:ffff:ffff', false],
  ['1::ffff:ffff:ffff', false],
  ['::ffff:ffff:ffff', true],
  ['::ffff:0000:0000', true]
];

// These are not mapped.
vectors.UNMAPPED_VECTOR = [
  binet.ZERO_IPV6,
  Buffer.from('000000000000000000000000ffffffff', 'hex'),
  Buffer.from('00000000000000000000000fffffffff', 'hex'),
  Buffer.from('0000000000000000000000ffffffffff', 'hex'),
  Buffer.from('000000000000000000000fffffffffff', 'hex'),
  Buffer.from('00000000000000000001ffffffffffff', 'hex'),
  Buffer.from('10000000000000000000ffffffffffff', 'hex'),
  Buffer.from('f0000000000000000000ffff00000000', 'hex'),
  Buffer.from('ffffffffffffffffffffffff00000000', 'hex'),
  Buffer.from('ffffffffffffffffffffffffffffffff', 'hex')
];

/*
 * Small onion address set
 */
vectors.LEGACY_ONIONS = [
  '0000000000000000.onion',
  'aaaaaaaaaaaaaaaa.onion',
  'ffffffffffffffff.onion',
  'zzzzzzzzzzzzzzzz.onion',
  'abcdefghijklmnop.onion',
  'qrstuvwxyz234567.onion'
];

/*
 * READ/WRITE Vectors
 */

// NOTE: str needs to be normalized.
vectors.READ = [
  {
    off: 0,
    size: 16,
    buf: Buffer.from('00000000000000000000000000000001', 'hex'),
    str: '::1',
    err: null
  },
  {
    off: null,
    size: null,
    buf: Buffer.from('00000000000000000000000000000002', 'hex'),
    str: '::2',
    err: null
  },
  {
    off: 0,
    size: 16,
    buf: Buffer.from('fd87d87eeb43ffffffffffffffffffff', 'hex'),
    str: '7777777777777777.onion',
    err: null
  },

  // some errors
  {
    off: 10,
    size: 16,
    buf: Buffer.alloc(25),
    str: '',
    err: 'Out of bounds read.'
  },
  {
    off: 0,
    size: 32,
    buf: Buffer.alloc(32),
    str: '',
    err: 'Invalid IP address.'
  }
];

// Writes with SIZE: 4
vectors.WRITE_4 = [
  {
    str: '4.3.2.1',
    off: 0,
    size: 4,
    foff: 4,
    buf: Buffer.from('04030201', 'hex'),
    err: null
  },
  {
    str: '4.3.2.1',
    off: null,
    size: 4,
    foff: 4,
    buf: Buffer.from('04030201', 'hex'),
    err: null
  },
  {
    str: '4.3.2.1',
    off: 0,
    size: 4,
    foff: 4,
    buf: Buffer.from('0403020100000000', 'hex'),
    err: null
  },
  {
    str: '4.3.2.1',
    off: 4,
    size: 4,
    foff: 8,
    buf: Buffer.from('0000000004030201', 'hex'),
    err: null
  },
  // mapped 4
  {
    str: '::ffff:0403:0201',
    off: 0,
    size: 4,
    foff: 4,
    buf: Buffer.from('04030201', 'hex'),
    err: null
  },

  // Errors
  // Not Mapped IPv4
  {
    str: '::0403:0201',
    off: 0,
    size: 4,
    foff: 0,
    buf: Buffer.from('00000000000000000000000000000000', 'hex'),
    err: 'Out of bounds write.'
  },
  {
    str: '     ',
    off: 0,
    size: 4,
    foff: 0,
    buf: Buffer.from('00000000000000000000000000000000', 'hex'),
    err: 'Invalid IPv4 address.'
  }
];

vectors.WRITE_6 = [
  // size 16
  {
    str: '::1',
    off: 0,
    size: 16,
    foff: 16,
    buf: Buffer.from('00000000000000000000000000000001', 'hex'),
    err: null
  },
  {
    str: '::2',
    off: null,
    size: null,
    foff: 16,
    buf: Buffer.from('00000000000000000000000000000002', 'hex'),
    err: null
  },
  {
    str: 'ffff::eeee',
    off: 16,
    size: 16,
    foff: 32,
    buf: Buffer.from('00000000000000000000000000000000'
                   + 'ffff000000000000000000000000eeee', 'hex'),
    err: null
  },
  {
    str: 'ffff::eeee',
    off: 8,
    size: 16,
    foff: 24,
    buf: Buffer.from('0000000000000000'
                   + 'ffff000000000000000000000000eeee'
                   + '0000000000000000', 'hex'),
    err: null
  },
  {
    str: '4.3.2.1',
    off: 0,
    size: 16,
    foff: 16,
    buf: Buffer.from('00000000000000000000ffff04030201', 'hex'),
    err: null
  },
  {
    str: '4.3.2.1',
    off: 8,
    size: 16,
    foff: 24,
    buf: Buffer.from('0000000000000000'
                   + '00000000000000000000ffff04030201'
                   + '0000000000000000', 'hex'),
    err: null
  },

  // Errors
  // size: 16
  {
    off: 10,
    size: 16,
    foff: 0,
    buf: Buffer.alloc(25),
    str: '',
    err: 'Out of bounds write.'
  },
  {
    str: '   ',
    off: 0,
    size: 16,
    foff: 0,
    buf: Buffer.alloc(32),
    err: 'Invalid IPv6 address.'
  },

  // Incorrect size
  {
    off: 0,
    size: 32,
    foff: 0,
    buf: Buffer.alloc(40),
    str: '',
    err: 'Invalid IP address.'
  }
];

vectors.WRITE_ONION = [
  {
    off: 0,
    size: 16,
    foff: 16,
    buf: Buffer.from('fd87d87eeb43ffffffffffffffffffff', 'hex'),
    str: '7777777777777777.onion',
    err: null
  },
  {
    off: 0,
    size: 16,
    foff: 16,
    buf: Buffer.from('fd87d87eeb4300000000000000000000', 'hex'),
    str: 'aaaaaaaaaaaaaaaa.onion',
    err: null
  }
];

vectors.WRITE = [
  ...vectors.WRITE_4,
  ...vectors.WRITE_6,
  ...vectors.WRITE_ONION
];

/*
 * toHost/fromHost tests
 */

// host, port, key, returned val
vectors.TOHOST = [
  ['handshake', 0, null, 'handshake:0'],
  ['handshake', 0xffff, null, 'handshake:65535'],
  ['::1', 1000, null, '[::1]:1000'],
  ['127.0.0.1', 1000, null, '127.0.0.1:1000'],
  ['0.0.0.0', 1000, null, '0.0.0.0:1000'],

  // do we need more strict rules in toHost?
  ['---', 1000, null, '---:1000'],
  ['handshake', 1000, Buffer.alloc(33, 0), 'handshake:1000'],
  ['handshake', 1000, Buffer.alloc(33, 0x11),
    'ceirceirceirceirceirceirceirceirceirceirceirceirceirc@handshake:1000']
];

// host, port, key, thrown err message - null = assertion error.
vectors.TOHOST_ERR = [
  // bad hostnames
  ['', 1000, null, 'Invalid host (zero length).'],
  ['a'.repeat(255 + 1 + 5 + 1), 1000, null, 'Invalid host (too large).'],
  ['[::]', 1000, null, 'Bad host.'],
  ['hsd@handshake-org', 1000, null, 'Bad host.'],
  ['handshake\n', 1000, null, 'Bad host.'],
  ['handshake\u0019', 1000, null, 'Bad host.'],
  ['handshake\u007f', 1000, null, 'Bad host.'],
  ['not-an-ipv6:addr', 1000, null, 'Unexpected colon.'],
  ['not-an-ipv6:1000', 1000, null, 'Unexpected colon.'],

  // bad ports
  ['handshake', null, null, null],
  ['handshake', -1, null, null],
  ['handshake', 0xffff + 1, null, null],

  // bad keys
  ['handshake', 100, 'not-a-key', null],
  ['handshake', 100, Buffer.alloc(0), null]
];
