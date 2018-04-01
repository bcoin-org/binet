/*!
 * ip.js - ip utils for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License).
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 *
 * Parts of this software are based on node-ip.
 * https://github.com/indutny/node-ip
 * Copyright (c) 2012, Fedor Indutny (MIT License).
 */

/* eslint no-unreachable: "off" */
/* eslint spaced-comment: "off" */

'use strict';

const assert = require('assert');
const os = require('os');
const base32 = require('bs32');
const inet = require('./inet');
const onion = require('./onion');
const binet = exports;

/*
 * Constants
 */

const ZERO_IP = Buffer.from('00000000000000000000000000000000', 'hex');
const LOCAL_IP = Buffer.from('00000000000000000000000000000001', 'hex');
const RFC6052 = Buffer.from('0064ff9b0000000000000000', 'hex');
const RFC4862 = Buffer.from('fe80000000000000', 'hex');
const RFC6145 = Buffer.from('0000000000000000ffff0000', 'hex');
const SHIFTED = Buffer.from('00000000000000ffff', 'hex');
const TOR_ONION = Buffer.from('fd87d87eeb43', 'hex');
const ZERO_KEY = Buffer.alloc(33, 0x00);

/**
 * Address types.
 * @enum {Number}
 */

const types = {
  NAME: -1,
  INET4: 4,
  INET6: 6,
  ONION: 10
};

/**
 * Address networks.
 * @enum {Number}
 */

const networks = {
  INET4: 1,
  INET6: 2,
  ONION: 3,
  TEREDO: 4
};

/**
 * Convert a buffer to an ip string.
 * @param {Buffer} raw
 * @returns {String}
 */

binet.toString = function toString(raw) {
  assert(Buffer.isBuffer(raw));

  if (raw.length === 16 && binet.isOnion(raw))
    return binet.encodeOnion(raw);

  return binet.encode(raw);
};

/**
 * Convert a buffer to an ip string.
 * @param {Buffer} raw
 * @returns {String}
 */

binet.encode = function encode(raw) {
  assert(Buffer.isBuffer(raw));

  if (raw.length === 4) {
    const str = inet.ntop(raw, 0, 4);

    if (!str)
      throw new Error('Invalid IPv4 address.');

    return str;
  }

  if (raw.length === 16) {
    if (binet.isIPv4(raw))
      return binet.encodeIPv4(raw);
    return binet.encodeIPv6(raw);
  }

  throw new Error('Invalid IP address.');
};

/**
 * Convert a buffer to an ip string.
 * @param {Buffer} raw
 * @returns {String}
 */

binet.encodeIPv4 = function encodeIPv4(raw) {
  const str = inet.ntop(raw, 12, 16);

  if (!str)
    throw new Error('Invalid IPv4 address.');

  return str;
};

/**
 * Convert a buffer to an ip string.
 * @param {Buffer} raw
 * @returns {String}
 */

binet.encodeIPv6 = function encodeIPv6(raw) {
  const str = inet.ntop(raw, 0, 16);

  if (!str)
    throw new Error('Invalid IPv6 address.');

  return str;
};

/**
 * Convert a buffer to an ip string.
 * @param {Buffer} raw
 * @returns {String}
 */

binet.encodeOnion = function encodeOnion(raw) {
  assert(binet.isOnion(raw));
  return onion.encodeLegacy(raw.slice(6));
};

/**
 * Get address type (-1=dns, 4=ipv4, 6=ipv6, 10=tor).
 * @param {String?} str
 * @returns {Number}
 */

binet.getStringType = function getStringType(str) {
  if (binet.isIPv4String(str))
    return types.INET4;

  if (binet.isIPv6String(str))
    return types.INET6;

  if (binet.isOnionString(str))
    return types.ONION;

  return types.NAME;
};

/**
 * Test whether a string is IPv4.
 * @param {String?} str
 * @returns {Boolean}
 */

binet.isIPv4String = function isIPv4String(str) {
  assert(typeof str === 'string');
  return inet.pton4(str, null, 0) >= 0;
};

/**
 * Test whether a string is IPv6.
 * @param {String?} str
 * @returns {Boolean}
 */

binet.isIPv6String = function isIPv6String(str) {
  assert(typeof str === 'string');
  return inet.pton6(str, null, 0) >= 0;
};

/**
 * Test whether a string is IPv4 or IPv6.
 * @param {String?} str
 * @returns {Boolean}
 */

binet.isIPString = function isIPString(str) {
  if (binet.isIPv4String(str))
    return 4;

  if (binet.isIPv6String(str))
    return 6;

  return 0;
};

/**
 * Test whether a string is an onion address.
 * @param {String?} str
 * @returns {Boolean}
 */

binet.isOnionString = function isOnionString(str) {
  return onion.isLegacyString(str);
};

/**
 * Test whether a string is a domain name.
 * @param {String?} str
 * @returns {Boolean}
 */

binet.isNameString = function isNameString(str) {
  assert(typeof str === 'string');

  if (str.length === 0)
    return false;

  if (str.length > 255)
    return false;

  if (binet.isIPv4String(str))
    return false;

  if (binet.isIPv6String(str))
    return false;

  if (binet.isOnionString(str))
    return false;

  return true;
};

/**
 * Parse an IP string and return a buffer.
 * @param {String} str
 * @returns {Buffer}
 */

binet.toBuffer = function toBuffer(str) {
  assert(typeof str === 'string');

  if (binet.isOnionString(str))
    return binet.decodeOnion(str);

  return binet.decode(str);
};

/**
 * Parse an IP string and return a buffer.
 * @param {String} str
 * @returns {Buffer}
 */

binet.decode = function decode(str) {
  const raw = Buffer.allocUnsafe(16);

  if (inet.pton4(str, raw, 12) >= 0) {
    raw.fill(0, 0, 10);
    raw[10] = 0xff;
    raw[11] = 0xff;
    return raw;
  }

  if (inet.pton6(str, raw, 0) < 0)
    throw new Error('Invalid IP address.');

  return raw;
};

/**
 * Convert an IPv4 string to a buffer.
 * @param {String} str
 * @returns {Buffer}
 */

binet.decodeIPv4 = function decodeIPv4(str) {
  const raw = Buffer.allocUnsafe(16);

  if (inet.pton4(str, raw, 12) < 0)
    throw new Error('Invalid IPv4 address.');

  raw.fill(0, 0, 10);
  raw[10] = 0xff;
  raw[11] = 0xff;

  return raw;
};

/**
 * Convert an IPv6 string to a buffer.
 * @param {String} str
 * @returns {Buffer}
 */

binet.decodeIPv6 = function decodeIPv6(str) {
  const raw = Buffer.allocUnsafe(16);

  if (inet.pton6(str, raw, 0) < 0)
    throw new Error('Invalid IPv6 address.');

  return raw;
};

/**
 * Convert an onion string to a buffer.
 * @param {String} str
 * @returns {Buffer}
 */

binet.decodeOnion = function decodeOnion(str) {
  const prefix = TOR_ONION;
  const data = onion.decodeLegacy(str);
  const raw = Buffer.allocUnsafe(16);
  prefix.copy(raw, 0);
  data.copy(raw, 6);
  return raw;
};

/**
 * Convert 4 byte ip address
 * to IPv4 mapped IPv6 address.
 * @param {String} str
 * @returns {Buffer}
 */

binet.toMapped = function toMapped(raw) {
  assert(Buffer.isBuffer(raw));
  assert(raw.length === 4);

  const data = Buffer.allocUnsafe(16);

  data.fill(0, 0, 10);

  data[10] = 0xff;
  data[11] = 0xff;

  raw.copy(data, 12);

  return data;
};

/**
 * Normalize an ip.
 * @param {String} str
 * @returns {String}
 */

binet.normalize = function normalize(str) {
  return binet.toString(binet.toBuffer(str));
};

/**
 * Get address type.
 * @param {Buffer} raw
 * @returns {Number}
 */

binet.getType = function getType(raw) {
  if (binet.isIPv4(raw))
    return types.INET4;

  if (binet.isIPv6(raw))
    return types.INET6;

  if (binet.isOnion(raw))
    return types.ONION;

  throw new Error('Unknown type.');
};

/**
 * Test whether the address is IPv4.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isIPv4 = function isIPv4(raw) {
  assert(Buffer.isBuffer(raw));
  assert(raw.length === 16);

  return raw[0] === 0x00
    && raw[1] === 0x00
    && raw[2] === 0x00
    && raw[3] === 0x00
    && raw[4] === 0x00
    && raw[5] === 0x00
    && raw[6] === 0x00
    && raw[7] === 0x00
    && raw[8] === 0x00
    && raw[9] === 0x00
    && raw[10] === 0xff
    && raw[11] === 0xff;
};

/**
 * Test whether the address is IPv6.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isIPv6 = function isIPv6(raw) {
  return !binet.isIPv4(raw) && !binet.isOnion(raw);
};

/**
 * Test whether the address is IPv4 or IPv6.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isIP = function isIP(raw) {
  if (binet.isIPv4(raw))
    return 4;

  if (binet.isIPv6(raw))
    return 6;

  return 0;
};

/**
 * Test whether the ip has a tor onion prefix.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isOnion = function isOnion(raw) {
  return binet.hasPrefix(raw, TOR_ONION);
};

/**
 * Test whether the host is null.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isNull = function isNull(raw) {
  if (binet.isIPv4(raw)) {
    // 0.0.0.0
    return raw[12] === 0
      && raw[13] === 0
      && raw[14] === 0
      && raw[15] === 0;
  }
  // ::
  return binet.isEqual(raw, ZERO_IP);
};

/**
 * Test whether the host is a broadcast address.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isBroadcast = function isBroadcast(raw) {
  if (!binet.isIPv4(raw))
    return false;

  // 255.255.255.255
  return raw[12] === 255
    && raw[13] === 255
    && raw[14] === 255
    && raw[15] === 255;
};

/**
 * Test whether the ip is RFC 1918.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isRFC1918 = function isRFC1918(raw) {
  if (!binet.isIPv4(raw))
    return false;

  if (raw[12] === 10)
    return true;

  if (raw[12] === 192 && raw[13] === 168)
    return true;

  if (raw[12] === 172 && (raw[13] >= 16 && raw[13] <= 31))
    return true;

  return false;
};

/**
 * Test whether the ip is RFC 2544.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isRFC2544 = function isRFC2544(raw) {
  if (!binet.isIPv4(raw))
    return false;

  if (raw[12] === 198 && (raw[13] === 18 || raw[13] === 19))
    return true;

  if (raw[12] === 169 && raw[13] === 254)
    return true;

  return false;
};

/**
 * Test whether the ip is RFC 3927.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isRFC3927 = function isRFC3927(raw) {
  if (!binet.isIPv4(raw))
    return false;

  if (raw[12] === 169 && raw[13] === 254)
    return true;

  return false;
};

/**
 * Test whether the ip is RFC 6598.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isRFC6598 = function isRFC6598(raw) {
  if (!binet.isIPv4(raw))
    return false;

  if (raw[12] === 100
      && (raw[13] >= 64 && raw[13] <= 127)) {
    return true;
  }

  return false;
};

/**
 * Test whether the ip is RFC 5737.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isRFC5737 = function isRFC5737(raw) {
  if (!binet.isIPv4(raw))
    return false;

  if (raw[12] === 192
      && (raw[13] === 0 && raw[14] === 2)) {
    return true;
  }

  if (raw[12] === 198 && raw[13] === 51 && raw[14] === 100)
    return true;

  if (raw[12] === 203 && raw[13] === 0 && raw[14] === 113)
    return true;

  return false;
};

/**
 * Test whether the ip is RFC 3849.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isRFC3849 = function isRFC3849(raw) {
  if (raw[0] === 0x20 && raw[1] === 0x01
      && raw[2] === 0x0d && raw[3] === 0xb8) {
    return true;
  }

  return false;
};

/**
 * Test whether the ip is RFC 3964.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isRFC3964 = function isRFC3964(raw) {
  if (raw[0] === 0x20 && raw[1] === 0x02)
    return true;

  return false;
};

/**
 * Test whether the ip is RFC 6052.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isRFC6052 = function isRFC6052(raw) {
  return binet.hasPrefix(raw, RFC6052);
};

/**
 * Test whether the ip is RFC 4380.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isRFC4380 = function isRFC4380(raw) {
  if (raw[0] === 0x20 && raw[1] === 0x01
      && raw[2] === 0x00 && raw[3] === 0x00) {
    return true;
  }

  return false;
};

/**
 * Test whether the ip is RFC 4862.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isRFC4862 = function isRFC4862(raw) {
  return binet.hasPrefix(raw, RFC4862);
};

/**
 * Test whether the ip is RFC 4193.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isRFC4193 = function isRFC4193(raw) {
  if ((raw[0] & 0xfe) === 0xfc)
    return true;

  return false;
};

/**
 * Test whether the ip is RFC 6145.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isRFC6145 = function isRFC6145(raw) {
  return binet.hasPrefix(raw, RFC6145);
};

/**
 * Test whether the ip is RFC 4843.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isRFC4843 = function isRFC4843(raw) {
  if (raw[0] === 0x20 && raw[1] === 0x01
      && raw[2] === 0x00 && (raw[3] & 0xf0) === 0x10) {
    return true;
  }

  return false;
};

/**
 * Test whether the ip is local.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isLocal = function isLocal(raw) {
  if (binet.isIPv4(raw)) {
    if (raw[12] === 127 && raw[13] === 0)
      return true;
    return false;
  }

  if (binet.isEqual(raw, LOCAL_IP))
    return true;

  return false;
};

/**
 * Test whether the ip is a multicast address.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isMulticast = function isMulticast(raw) {
  if (binet.isIPv4(raw)) {
    if ((raw[12] & 0xf0) === 0xe0)
      return true;
    return false;
  }
  return raw[0] === 0xff;
};

/**
 * Test whether the ip is valid.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isValid = function isValid(raw) {
  if (binet.hasPrefix(raw, SHIFTED))
    return false;

  if (binet.isNull(raw))
    return false;

  if (binet.isBroadcast(raw))
    return false;

  if (binet.isRFC3849(raw))
    return false;

  return true;
};

/**
 * Test whether the ip is routable.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

binet.isRoutable = function isRoutable(raw) {
  if (!binet.isValid(raw))
    return false;

  if (binet.isRFC1918(raw))
    return false;

  if (binet.isRFC2544(raw))
    return false;

  if (binet.isRFC3927(raw))
    return false;

  if (binet.isRFC4862(raw))
    return false;

  if (binet.isRFC6598(raw))
    return false;

  if (binet.isRFC5737(raw))
    return false;

  if (binet.isRFC4193(raw) && !binet.isOnion(raw))
    return false;

  if (binet.isRFC4843(raw))
    return false;

  if (binet.isLocal(raw))
    return false;

  return true;
};

/**
 * Get addr network. Similar to
 * type, but includes teredo.
 * @param {Buffer} raw
 * @returns {Number}
 */

binet.getNetwork = function getNetwork(raw) {
  if (binet.isIPv4(raw))
    return networks.INET4;

  if (binet.isRFC4380(raw))
    return networks.TEREDO;

  if (binet.isIPv6(raw))
    return networks.INET6;

  if (binet.isOnion(raw))
    return networks.ONION;

  throw new Error('Unknown type.');
};

/**
 * Calculate reachable score from source to destination.
 * @param {Buffer} src
 * @param {Buffer} dest
 * @returns {Number} Ranges from 0-6.
 */

binet.getReachability = function getReachability(src, dest) {
  const UNREACHABLE = 0;
  const DEFAULT = 1;
  const TEREDO = 2;
  const IPV6_WEAK = 3;
  const IPV4 = 4;
  const IPV6_STRONG = 5;
  const PRIVATE = 6;

  if (!binet.isRoutable(src))
    return UNREACHABLE;

  const srcNet = binet.getNetwork(src);
  const destNet = binet.getNetwork(dest);

  switch (destNet) {
    case networks.IPV4:
      switch (srcNet) {
        case networks.IPV4:
          return IPV4;
        default:
          return DEFAULT;
      }
      break;
    case networks.INET6:
      switch (srcNet) {
        case networks.TEREDO:
          return TEREDO;
        case networks.IPV4:
          return IPV4;
        case networks.INET6:
          if (binet.isRFC3964(src)
              || binet.isRFC6052(src)
              || binet.isRFC6145(src)) {
            // tunnel
            return IPV6_WEAK;
          }
          return IPV6_STRONG;
        default:
          return DEFAULT;
      }
      break;
    case networks.ONION:
      switch (srcNet) {
        case networks.IPV4:
          return IPV4;
        case networks.ONION:
          return PRIVATE;
        default:
          return DEFAULT;
      }
      break;
    case networks.TEREDO:
      switch (srcNet) {
        case networks.TEREDO:
          return TEREDO;
        case networks.INET6:
          return IPV6_WEAK;
        case networks.IPV4:
          return IPV4;
        default:
          return DEFAULT;
      }
      break;
    default:
      switch (srcNet) {
        case networks.TEREDO:
          return TEREDO;
        case networks.INET6:
          return IPV6_WEAK;
        case networks.IPV4:
          return IPV4;
        case networks.ONION:
          return PRIVATE;
        default:
          return DEFAULT;
      }
      break;
  }
};

/**
 * Test whether an inet has a prefix.
 * @param {Buffer} raw
 * @param {Buffer} prefix
 * @returns {Boolean}
 */

binet.hasPrefix = function hasPrefix(raw, prefix) {
  assert(Buffer.isBuffer(raw));
  assert(Buffer.isBuffer(prefix));
  assert(raw.length >= prefix.length);

  for (let i = 0; i < prefix.length; i++) {
    if (raw[i] !== prefix[i])
      return false;
  }

  return true;
};

/**
 * Test whether two IPs are equal.
 * @param {Buffer} a
 * @param {Buffer} b
 * @returns {Boolean}
 */

binet.isEqual = function isEqual(a, b) {
  assert(Buffer.isBuffer(a));
  assert(Buffer.isBuffer(b));
  assert(a.length === 16);
  assert(b.length === 16);
  return a.equals(b);
};

/**
 * Get IP address from network interfaces.
 * @private
 * @param {String} name - `public` or `private`.
 * @param {String?} family - IP family name.
 * @returns {String}
 */

binet._interfaces = function _interfaces(name, family) {
  assert(typeof name === 'string');

  if (family == null)
    family = 'all';

  assert(typeof family === 'string');
  assert(family.length <= 4);

  family = family.toLowerCase();

  assert(family === 'all'
    || family === 'ipv4'
    || family === 'ipv6');

  const interfaces = os.networkInterfaces();
  const result = [];

  for (const key of Object.keys(interfaces)) {
    const items = interfaces[key];

    for (const details of items) {
      const type = details.family.toLowerCase();

      if (family !== 'all' && type !== family)
        continue;

      let raw;
      try {
        raw = binet.toBuffer(details.address);
      } catch (e) {
        continue;
      }

      if (!binet.isValid(raw))
        continue;

      switch (family) {
        case 'all': {
          break;
        }
        case 'ipv4': {
          if (!binet.isIPv4(raw))
            continue;
          break;
        }
        case 'ipv6': {
          if (binet.isIPv4(raw))
            continue;
          break;
        }
      }

      switch (name) {
        case 'all': {
          break;
        }
        case 'local': {
          if (!binet.isLocal(raw))
            continue;
          break;
        }
        case 'nonlocal': {
          if (binet.isLocal(raw))
            continue;
          break;
        }
        case 'private': {
          if (binet.isLocal(raw))
            continue;

          if (binet.isRoutable(raw))
            continue;

          break;
        }
        case 'public': {
          if (binet.isLocal(raw))
            continue;

          if (!binet.isRoutable(raw))
            continue;

          break;
        }
      }

      result.push(binet.toString(raw));
    }
  }

  return result;
};

/**
 * Get local IP from network interfaces.
 * @param {String?} family - IP family name.
 * @returns {String}
 */

binet.getInterfaces = function getInterfaces(family) {
  return binet._interfaces('all', family);
};

/**
 * Get local IP from network interfaces.
 * @param {String?} family - IP family name.
 * @returns {String}
 */

binet.getLocal = function getLocal(family) {
  return binet._interfaces('local', family);
};

/**
 * Get non-local IP from network interfaces.
 * @param {String?} family - IP family name.
 * @returns {String}
 */

binet.getNonlocal = function getNonlocal(family) {
  return binet._interfaces('nonlocal', family);
};

/**
 * Get private IP from network interfaces.
 * @param {String?} family - IP family name.
 * @returns {String}
 */

binet.getPrivate = function getPrivate(family) {
  return binet._interfaces('private', family);
};

/**
 * Get public IP from network interfaces.
 * @param {String?} family - IP family name.
 * @returns {String}
 */

binet.getPublic = function getPublic(family) {
  return binet._interfaces('public', family);
};

/**
 * Concatenate a host and port.
 * @param {String} host
 * @param {Number} port
 * @param {Buffer|null} key
 * @returns {String}
 */

binet.toHost = function toHost(host, port, key) {
  if (key == null)
    key = null;

  assert(typeof host === 'string');
  assert(host.length > 0);
  assert(host.length <= 255 + 1 + 5);
  assert((port & 0xffff) === port);
  assert(key === null || Buffer.isBuffer(key));
  assert(!key || key.length === 33);

  let colon = false;

  for (let i = 0; i < host.length; i++) {
    const ch = host.charCodeAt(i);

    switch (ch) {
      case 0x3a /*:*/:
        colon = true;
        break;
      case 0x40 /*@*/:
      case 0x5b /*[*/:
      case 0x5d /*]*/:
        throw new Error('Bad host.');
      default:
        if (ch < 0x20 || ch > 0x7e)
          throw new Error('Bad host.');
        break;
    }
  }

  let type = binet.getStringType(host);

  if (colon)
    assert(type === types.INET6, 'Bad host.');

  if (type !== types.NAME) {
    const raw = binet.toBuffer(host);
    type = binet.getType(raw);
    host = binet.toString(raw);
  }

  let prefix = '';

  if (key && !key.equals(ZERO_KEY))
    prefix = `${base32.encode(key)}@`;

  if (type === types.INET6)
    return `${prefix}[${host}]:${port}`;

  return `${prefix}${host}:${port}`;
};

/**
 * Parse a hostname.
 * @param {String} addr
 * @param {Number?} fport - Fallback port.
 * @param {Buffer?} fkey - Fallback key.
 * @returns {Object} Contains `host`, `port`, and `type`.
 */

binet.fromHost = function fromHost(addr, fport, fkey) {
  if (fport == null)
    fport = 0;

  if (fkey == null)
    fkey = null;

  assert(typeof addr === 'string');
  assert(addr.length > 0, 'Bad address.');
  assert(addr.length <= 53 + 1 + 255 + 1 + 5);
  assert((fport & 0xffff) === fport);
  assert(fkey === null || Buffer.isBuffer(fkey));
  assert(!fkey || fkey.length === 33);

  let key = fkey;
  let host = '';
  let port = null;

  const at = addr.indexOf('@');

  if (at !== -1) {
    const front = addr.substring(0, at);
    const back = addr.substring(at + 1);

    assert(front.length <= 53, 'Bad key.');

    key = base32.decode(front);
    assert(key.length === 33, 'Bad key.');

    addr = back;
  }

  if (addr[0] === '[') {
    if (addr[addr.length - 1] === ']') {
      // Case:
      // [::1]
      host = addr.slice(1, -1);
      port = null;
    } else {
      // Case:
      // [::1]:80
      const colon = addr.indexOf(']:');
      assert(colon !== -1, 'Bad IPv6 address.');
      host = addr.substring(1, colon);
      port = addr.substring(colon + 2);
    }
  } else {
    const colon = addr.indexOf(':');

    if (colon !== -1) {
      const front = addr.substring(0, colon);
      const back = addr.substring(colon + 1);

      if (back.indexOf(':') !== -1) {
        // Case:
        // ::1
        assert(binet.isIPv6String(addr), 'Bad IPv6 address.');
        host = addr;
        port = null;
      } else {
        // Cases:
        // 127.0.0.1:80
        // localhost:80
        host = front;
        port = back;
      }
    } else {
      // Cases:
      // 127.0.0.1
      // localhost
      host = addr;
      port = null;
    }
  }

  assert(host.length > 0, 'Bad host.');

  if (port != null) {
    let word = 0;
    let total = 0;

    for (let i = 0; i < port.length; i++) {
      const ch = port.charCodeAt(i);

      if (ch < 0x30 || ch > 0x39)
        throw new Error('Invalid port.');

      if (total > 0 && word === 0)
        throw new Error('Invalid port.');

      word *= 10;
      word += ch - 0x30;
      total += 1;

      if (total > 5 || word > 0xffff)
        throw new Error('Invalid port.');
    }

    if (total === 0)
      throw new Error('Invalid port.');

    port = word;
  } else {
    port = fport;
  }

  let type = binet.getStringType(host);
  let raw = ZERO_IP;

  if (type !== types.NAME) {
    raw = binet.toBuffer(host);
    type = binet.getType(raw);
    host = binet.toString(raw);
  }

  let hostname = null;

  if (type === types.INET6)
    hostname = `[${host}]:${port}`;
  else
    hostname = `${host}:${port}`;

  return {
    host,
    port,
    type,
    hostname,
    raw,
    key
  };
};

/*
 * Compat
 */

types.DNS = -1;
types.IPV4 = 4;
types.IPV6 = 6;

binet.isMapped = binet.isIPv4;
binet.isV4String = binet.isIPv4String;
binet.isV6String = binet.isIPv6String;
binet.isDNSString = binet.isNameString;
binet.fromHostname = binet.fromHost;
binet.toHostname = binet.toHost;
binet.IP = binet;
binet.ip = binet;

/*
 * Expose
 */

binet.types = types;
binet.networks = networks;
binet.ZERO_IP = ZERO_IP;
binet.onion = onion;

binet.pton4 = inet.pton4;
binet.pton6 = inet.pton6;
binet.pton = inet.pton;

binet.ntop4 = inet.ntop4;
binet.ntop6 = inet.ntop6;
binet.ntop = inet.ntop;
