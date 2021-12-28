'use strict';

/*
 * Some extra vectors for the options and etc.
 */

const vectors = exports;

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
