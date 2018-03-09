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

'use strict';

const assert = require('assert');
const os = require('os');
const base32 = require('./base32');
const onion = require('./onion');
const inet = exports;

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

const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_REGEX =
  /^(::)?(((\d{1,3}\.){3}(\d{1,3}){1})?([0-9a-f]){0,4}:{0,2}){1,8}(::)?$/i;

/**
 * Address types.
 * @enum {Number}
 */

const types = {
  NAME: -1,
  INET4: 4,
  INET6: 6,
  ONION: 10,

  // Compat
  DNS: -1,
  IPV4: 4,
  IPV6: 6
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

inet.toString = function toString(raw) {
  assert(Buffer.isBuffer(raw));

  if (raw.length === 16 && inet.isOnion(raw))
    return inet.encodeOnion(raw);

  return inet.encode(raw);
};

/**
 * Convert a buffer to an ip string.
 * @param {Buffer} raw
 * @returns {String}
 */

inet.encode = function encode(raw) {
  assert(Buffer.isBuffer(raw));

  if (raw.length === 4)
    return `${raw[0]}.${raw[1]}.${raw[2]}.${raw[3]}`;

  if (raw.length === 16) {
    if (inet.isIPv4(raw))
      return inet.encodeIPv4(raw);
    return inet.encodeIPv6(raw);
  }

  throw new Error('Invalid IP address.');
};

/**
 * Convert a buffer to an ip string.
 * @param {Buffer} raw
 * @returns {String}
 */

inet.encodeIPv4 = function encodeIPv4(raw) {
  assert(Buffer.isBuffer(raw));
  assert(raw.length === 16);
  return `${raw[12]}.${raw[13]}.${raw[14]}.${raw[15]}`;
};

/**
 * Convert a buffer to an ip string.
 * @param {Buffer} raw
 * @returns {String}
 */

inet.encodeIPv6 = function encodeIPv6(raw) {
  assert(Buffer.isBuffer(raw));
  assert(raw.length === 16);

  let host = '';

  host += raw.readUInt16BE(0, true).toString(16);

  for (let i = 2; i < 16; i += 2) {
    host += ':';
    host += raw.readUInt16BE(i, true).toString(16);
  }

  host = host.replace(/(^|:)0(:0)*:0(:|$)/, '$1::$3');
  host = host.replace(/:{3,4}/, '::');

  return host;
};

/**
 * Convert a buffer to an ip string.
 * @param {Buffer} raw
 * @returns {String}
 */

inet.encodeOnion = function encodeOnion(raw) {
  assert(inet.isOnion(raw));
  return onion.encodeLegacy(raw.slice(6));
};

/**
 * Get address type (-1=dns, 4=ipv4, 6=ipv6, 10=tor).
 * @param {String?} str
 * @returns {Number}
 */

inet.getStringType = function getStringType(str) {
  if (inet.isIPv4String(str))
    return types.INET4;

  if (inet.isIPv6String(str))
    return types.INET6;

  if (inet.isOnionString(str))
    return types.ONION;

  return types.NAME;
};

/**
 * Test whether a string is IPv4.
 * @param {String?} str
 * @returns {Boolean}
 */

inet.isIPv4String = function isIPv4String(str) {
  assert(typeof str === 'string');

  if (str.length < 7)
    return false;

  if (str.length > 15)
    return false;

  return IPV4_REGEX.test(str);
};

/**
 * Test whether a string is IPv6.
 * @param {String?} str
 * @returns {Boolean}
 */

inet.isIPv6String = function isIPv6String(str) {
  assert(typeof str === 'string');

  if (str.length < 2)
    return false;

  if (str.length > 39)
    return false;

  return IPV6_REGEX.test(str);
};

/**
 * Test whether a string is an onion address.
 * @param {String?} str
 * @returns {Boolean}
 */

inet.isOnionString = function isOnionString(str) {
  return onion.isLegacyString(str);
};

/**
 * Test whether a string is a domain name.
 * @param {String?} str
 * @returns {Boolean}
 */

inet.isNameString = function isNameString(str) {
  assert(typeof str === 'string');

  if (str.length === 0)
    return false;

  if (str.length > 320)
    return false;

  if (inet.isIPv4String(str))
    return false;

  if (inet.isIPv6String(str))
    return false;

  if (inet.isOnionString(str))
    return false;

  return true;
};

/**
 * Parse an IP string and return a buffer.
 * @param {String} str
 * @returns {Buffer}
 */

inet.toBuffer = function toBuffer(str) {
  assert(typeof str === 'string');

  if (inet.isOnionString(str))
    return inet.decodeOnion(str);

  return inet.decode(str);
};

/**
 * Parse an IP string and return a buffer.
 * @param {String} str
 * @returns {Buffer}
 */

inet.decode = function decode(str) {
  assert(typeof str === 'string');

  if (inet.isIPv4String(str))
    return inet.decodeIPv4(str);

  return inet.decodeIPv6(str);
};

/**
 * Convert an IPv4 string to a buffer.
 * @param {String} str
 * @returns {Buffer}
 */

inet.decodeIPv4 = function decodeIPv4(str) {
  assert(typeof str === 'string');
  assert(str.length <= 15);
  const raw = Buffer.allocUnsafe(16);
  raw.fill(0, 0, 10);
  raw[10] = 0xff;
  raw[11] = 0xff;
  return inet._decodeIPv4(str, raw, 12);
};

/**
 * Convert an IPv4 string to a buffer.
 * @private
 * @param {String} str
 * @param {Buffer} raw
 * @param {Number} offset
 * @returns {Buffer}
 */

inet._decodeIPv4 = function _decodeIPv4(str, raw, offset) {
  assert(typeof str === 'string');
  assert(str.length <= 15);
  assert(offset + 4 <= raw.length);

  let word = 0;
  let size = 0;
  let dots = 0;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);

    if (ch === 0x2e) {
      assert(dots < 3);
      assert(size !== 0);
      assert(word <= 0xff);
      raw[offset] = word;
      offset += 1;
      dots += 1;
      word = 0;
      size = 0;
      continue;
    }

    if (ch >= 0x30 && ch <= 0x39) {
      assert(size < 3);
      word *= 10;
      word += ch - 0x30;
      size += 1;
      continue;
    }

    throw new Error('Unexpected character.');
  }

  assert(dots === 3);
  assert(size !== 0);
  assert(word <= 0xff);
  raw[offset] = word;

  return raw;
};

/**
 * Convert an IPv6 string to a buffer.
 * @param {String} str
 * @returns {Buffer}
 */

inet.decodeIPv6 = function decodeIPv6(str) {
  assert(typeof str === 'string');
  assert(str.length <= 320);

  const raw = Buffer.allocUnsafe(16);
  const parts = str.split(':');

  let offset = 0;
  let missing = 8 - parts.length;

  assert(parts.length >= 2, 'Not an IPv6 address.');

  for (const word of parts) {
    if (inet.isIPv4String(word))
      missing -= 1;
  }

  const start = offset;

  let colon = false;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part.length === 0) {
      assert(!colon, 'Overuse of double colon in IPv6 address.');

      colon = true;
      missing += 1;

      // Eat extra colons.
      // e.g. :::0
      while (i + 1 < parts.length) {
        const next = parts[i + 1];
        if (next.length !== 0)
          break;
        missing += 1;
        i += 1;
      }

      while (missing > 0) {
        assert(offset + 2 <= raw.length);
        raw[offset++] = 0;
        raw[offset++] = 0;
        missing -= 1;
      }

      continue;
    }

    if (inet.isIPv4String(part)) {
      assert(offset + 4 <= raw.length);
      inet._decodeIPv4(part, raw, offset);
      offset += 4;
      continue;
    }

    assert(part.length <= 4);

    const word = parseHex(part);
    assert(word <= 0xffff);

    assert(offset + 2 <= raw.length);
    raw[offset++] = (word >> 8) & 0xff;
    raw[offset++] = word & 0xff;
  }

  assert(missing === 0, 'IPv6 address has missing sections.');
  assert(offset === start + 16);

  return raw;
};

/**
 * Convert an onion string to a buffer.
 * @param {String} str
 * @returns {Buffer}
 */

inet.decodeOnion = function decodeOnion(str) {
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

inet.toMapped = function toMapped(raw) {
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

inet.normalize = function normalize(str) {
  return inet.toString(inet.toBuffer(str));
};

/**
 * Get address type.
 * @param {Buffer} raw
 * @returns {Number}
 */

inet.getType = function getType(raw) {
  if (inet.isIPv4(raw))
    return types.INET4;

  if (inet.isIPv6(raw))
    return types.INET6;

  if (inet.isOnion(raw))
    return types.ONION;

  throw new Error('Unknown type.');
};

/**
 * Test whether the address is IPv4.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

inet.isIPv4 = function isIPv4(raw) {
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
 * Test whether the ip has a tor onion prefix.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

inet.isOnion = function isOnion(raw) {
  return inet.hasPrefix(raw, TOR_ONION);
};

/**
 * Test whether the address is IPv6.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

inet.isIPv6 = function isIPv6(raw) {
  return !inet.isIPv4(raw) && !inet.isOnion(raw);
};

/**
 * Test whether the host is null.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

inet.isNull = function isNull(raw) {
  if (inet.isIPv4(raw)) {
    // 0.0.0.0
    return raw[12] === 0
      && raw[13] === 0
      && raw[14] === 0
      && raw[15] === 0;
  }
  // ::
  return inet.isEqual(raw, ZERO_IP);
};

/**
 * Test whether the host is a broadcast address.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

inet.isBroadcast = function isBroadcast(raw) {
  if (!inet.isIPv4(raw))
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

inet.isRFC1918 = function isRFC1918(raw) {
  if (!inet.isIPv4(raw))
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

inet.isRFC2544 = function isRFC2544(raw) {
  if (!inet.isIPv4(raw))
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

inet.isRFC3927 = function isRFC3927(raw) {
  if (!inet.isIPv4(raw))
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

inet.isRFC6598 = function isRFC6598(raw) {
  if (!inet.isIPv4(raw))
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

inet.isRFC5737 = function isRFC5737(raw) {
  if (!inet.isIPv4(raw))
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

inet.isRFC3849 = function isRFC3849(raw) {
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

inet.isRFC3964 = function isRFC3964(raw) {
  if (raw[0] === 0x20 && raw[1] === 0x02)
    return true;

  return false;
};

/**
 * Test whether the ip is RFC 6052.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

inet.isRFC6052 = function isRFC6052(raw) {
  return inet.hasPrefix(raw, RFC6052);
};

/**
 * Test whether the ip is RFC 4380.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

inet.isRFC4380 = function isRFC4380(raw) {
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

inet.isRFC4862 = function isRFC4862(raw) {
  return inet.hasPrefix(raw, RFC4862);
};

/**
 * Test whether the ip is RFC 4193.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

inet.isRFC4193 = function isRFC4193(raw) {
  if ((raw[0] & 0xfe) === 0xfc)
    return true;

  return false;
};

/**
 * Test whether the ip is RFC 6145.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

inet.isRFC6145 = function isRFC6145(raw) {
  return inet.hasPrefix(raw, RFC6145);
};

/**
 * Test whether the ip is RFC 4843.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

inet.isRFC4843 = function isRFC4843(raw) {
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

inet.isLocal = function isLocal(raw) {
  if (inet.isIPv4(raw)) {
    if (raw[12] === 127 && raw[13] === 0)
      return true;
    return false;
  }

  if (inet.isEqual(raw, LOCAL_IP))
    return true;

  return false;
};

/**
 * Test whether the ip is a multicast address.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

inet.isMulticast = function isMulticast(raw) {
  if (inet.isIPv4(raw)) {
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

inet.isValid = function isValid(raw) {
  if (inet.hasPrefix(raw, SHIFTED))
    return false;

  if (inet.isNull(raw))
    return false;

  if (inet.isBroadcast(raw))
    return false;

  if (inet.isRFC3849(raw))
    return false;

  return true;
};

/**
 * Test whether the ip is routable.
 * @param {Buffer} raw
 * @returns {Boolean}
 */

inet.isRoutable = function isRoutable(raw) {
  if (!inet.isValid(raw))
    return false;

  if (inet.isRFC1918(raw))
    return false;

  if (inet.isRFC2544(raw))
    return false;

  if (inet.isRFC3927(raw))
    return false;

  if (inet.isRFC4862(raw))
    return false;

  if (inet.isRFC6598(raw))
    return false;

  if (inet.isRFC5737(raw))
    return false;

  if (inet.isRFC4193(raw) && !inet.isOnion(raw))
    return false;

  if (inet.isRFC4843(raw))
    return false;

  if (inet.isLocal(raw))
    return false;

  return true;
};

/**
 * Get addr network. Similar to
 * type, but includes teredo.
 * @param {Buffer} raw
 * @returns {Number}
 */

inet.getNetwork = function getNetwork(raw) {
  if (inet.isIPv4(raw))
    return networks.INET4;

  if (inet.isRFC4380(raw))
    return networks.TEREDO;

  if (inet.isIPv6(raw))
    return networks.INET6;

  if (inet.isOnion(raw))
    return networks.ONION;

  throw new Error('Unknown type.');
};

/**
 * Calculate reachable score from source to destination.
 * @param {Buffer} src
 * @param {Buffer} dest
 * @returns {Number} Ranges from 0-6.
 */

inet.getReachability = function getReachability(src, dest) {
  const UNREACHABLE = 0;
  const DEFAULT = 1;
  const TEREDO = 2;
  const IPV6_WEAK = 3;
  const IPV4 = 4;
  const IPV6_STRONG = 5;
  const PRIVATE = 6;

  if (!inet.isRoutable(src))
    return UNREACHABLE;

  const srcNet = inet.getNetwork(src);
  const destNet = inet.getNetwork(dest);

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
          if (inet.isRFC3964(src)
              || inet.isRFC6052(src)
              || inet.isRFC6145(src)) {
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

inet.hasPrefix = function hasPrefix(raw, prefix) {
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

inet.isEqual = function isEqual(a, b) {
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

inet._interfaces = function _interfaces(name, family) {
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
        raw = inet.toBuffer(details.address);
      } catch (e) {
        continue;
      }

      if (!inet.isValid(raw))
        continue;

      switch (family) {
        case 'all':
          break;
        case 'ipv4':
          if (!inet.isIPv4(raw))
            continue;
          break;
        case 'ipv6':
          if (inet.isIPv4(raw))
            continue;
          break;
      }

      switch (name) {
        case 'all':
          break;
        case 'local':
          if (!inet.isLocal(raw))
            continue;
          break;
        case 'nonlocal':
          if (inet.isLocal(raw))
            continue;
          break;
        case 'private':
          if (inet.isLocal(raw))
            continue;
          if (inet.isRoutable(raw))
            continue;
          break;
        case 'public':
          if (inet.isLocal(raw))
            continue;
          if (!inet.isRoutable(raw))
            continue;
          break;
      }

      result.push(inet.toString(raw));
    }
  }

  return result;
};

/**
 * Get local IP from network interfaces.
 * @param {String?} family - IP family name.
 * @returns {String}
 */

inet.getInterfaces = function getInterfaces(family) {
  return inet._interfaces('all', family);
};

/**
 * Get local IP from network interfaces.
 * @param {String?} family - IP family name.
 * @returns {String}
 */

inet.getLocal = function getLocal(family) {
  return inet._interfaces('local', family);
};

/**
 * Get non-local IP from network interfaces.
 * @param {String?} family - IP family name.
 * @returns {String}
 */

inet.getNonlocal = function getNonlocal(family) {
  return inet._interfaces('nonlocal', family);
};

/**
 * Get private IP from network interfaces.
 * @param {String?} family - IP family name.
 * @returns {String}
 */

inet.getPrivate = function getPrivate(family) {
  return inet._interfaces('private', family);
};

/**
 * Get public IP from network interfaces.
 * @param {String?} family - IP family name.
 * @returns {String}
 */

inet.getPublic = function getPublic(family) {
  return inet._interfaces('public', family);
};

/**
 * Concatenate a host and port.
 * @param {String} host
 * @param {Number} port
 * @param {Buffer|null} key
 * @returns {String}
 */

inet.toHost = function toHost(host, port, key) {
  assert(typeof host === 'string');
  assert(host.length > 0);
  assert(host.length <= 320);
  assert((port & 0xffff) === port);
  assert(key == null || Buffer.isBuffer(key));
  assert(!key || key.length === 33);

  assert(!/[\[\]@,]/.test(host), 'Bad host.');

  let type = inet.getStringType(host);

  if (host.indexOf(':') !== -1)
    assert(type === types.INET6, 'Bad host.');

  if (type !== types.NAME) {
    const raw = inet.toBuffer(host);
    type = inet.getType(raw);
    host = inet.toString(raw);
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

inet.fromHost = function fromHost(addr, fport, fkey) {
  if (fport == null)
    fport = 0;

  if (fkey == null)
    fkey = null;

  assert(typeof addr === 'string');
  assert(addr.length > 0, 'Bad address.');
  assert(addr.length <= 320 + 8 + 53);
  assert((fport & 0xffff) === fport);
  assert(fkey == null || Buffer.isBuffer(fkey));
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
      addr = addr.slice(1);
      const parts = addr.split(']:');
      assert(parts.length === 2, 'Bad IPv6 address.');
      host = parts[0];
      port = parts[1];
    }
  } else {
    const parts = addr.split(':');
    switch (parts.length) {
      case 2:
        // Cases:
        // 127.0.0.1:80
        // localhost:80
        host = parts[0];
        port = parts[1];
        break;
      case 1:
        // Cases:
        // 127.0.0.1
        // localhost
        host = parts[0];
        port = null;
        break;
      default:
        // Case:
        // ::1
        assert(inet.isIPv6String(addr), 'Bad IPv6 address.');
        host = addr;
        port = null;
        break;
    }
  }

  assert(host.length > 0, 'Bad host.');

  if (port != null) {
    assert(port.length <= 5, 'Bad port.');
    port = parseInt(port, 10);
    assert((port & 0xffff) === port);
  } else {
    port = fport;
  }

  let type = inet.getStringType(host);
  let raw = ZERO_IP;

  if (type !== types.NAME) {
    raw = inet.toBuffer(host);
    type = inet.getType(raw);
    host = inet.toString(raw);
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
 * Helpers
 */

function parseHex(str) {
  assert(typeof str === 'string');
  assert(str.length <= 8);

  let word = 0;

  for (let j = 0; j < str.length; j++) {
    const ch = str.charCodeAt(j);

    // 0 - 9
    if (ch >= 0x30 && ch <= 0x39) {
      word <<= 4;
      word |= ch - 0x30;
      continue;
    }

    // A - F
    if (ch >= 0x41 && ch <= 0x46) {
      word <<= 4;
      word |= ch - (0x41 - 0x0a);
      continue;
    }

    // a - f
    if (ch >= 0x61 && ch <= 0x66) {
      word <<= 4;
      word |= ch - (0x61 - 0x0a);
      continue;
    }

    throw new Error('Unexpected character.');
  }

  return word >>> 0;
}

/*
 * Compat
 */

inet.isMapped = inet.isIPv4;
inet.isV4String = inet.isIPv4String;
inet.isV6String = inet.isIPv6String;
inet.isDNSString = inet.isNameString;
inet.fromHostname = inet.fromHost;
inet.toHostname = inet.toHost;
inet.IP = inet;
inet.ip = inet;

/*
 * Expose
 */

inet.types = types;
inet.networks = networks;
inet.ZERO_IP = ZERO_IP;
inet.onion = onion;
inet.base32 = base32;
