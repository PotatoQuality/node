'use strict';

const { Object } = primordials;

const {
  ERR_BUFFER_OUT_OF_BOUNDS,
  ERR_INVALID_ARG_TYPE,
  ERR_OUT_OF_RANGE
} = require('internal/errors').codes;
const { validateNumber } = require('internal/validators');
const {
  asciiSlice,
  base64Slice,
  latin1Slice,
  hexSlice,
  ucs2Slice,
  utf8Slice,
  asciiWrite,
  base64Write,
  latin1Write,
  hexWrite,
  ucs2Write,
  utf8Write
} = internalBinding('buffer');

const kDataView = Symbol('kDataView');
function ensureDataView(buf) {
  if (buf[kDataView] === undefined) {
    Object.defineProperty(buf, kDataView, {
      value: new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
    });
  }
}

function checkBounds(buf, offset, byteLength) {
  validateNumber(offset, 'offset');
  if (buf[offset] === undefined || buf[offset + byteLength] === undefined)
    boundsError(offset, buf.length - (byteLength + 1));
}

function checkInt(value, min, max, buf, offset, byteLength) {
  if (value > max || value < min) {
    throw new ERR_OUT_OF_RANGE('value', `>= ${min} and <= ${max}`, value);
  }
  checkBounds(buf, offset, byteLength);
}

function boundsError(value, length, type) {
  if (Math.floor(value) !== value) {
    validateNumber(value, type);
    throw new ERR_OUT_OF_RANGE(type || 'offset', 'an integer', value);
  }

  if (length < 0)
    throw new ERR_BUFFER_OUT_OF_BOUNDS();

  throw new ERR_OUT_OF_RANGE(type || 'offset',
                             `>= ${type ? 1 : 0} and <= ${length}`,
                             value);
}

// Read integers.
function readUIntLE(offset, byteLength) {
  if (offset === undefined)
    throw new ERR_INVALID_ARG_TYPE('offset', 'number', offset);
  if (byteLength === 6)
    return readUInt48LE(this, offset);
  if (byteLength === 5)
    return readUInt40LE(this, offset);
  if (byteLength === 3)
    return readUInt24LE(this, offset);
  if (byteLength === 4)
    return this.readUInt32LE(offset);
  if (byteLength === 2)
    return this.readUInt16LE(offset);
  if (byteLength === 1)
    return this.readUInt8(offset);

  boundsError(byteLength, 6, 'byteLength');
}

function readUInt48LE(buf, offset = 0) {
  validateNumber(offset, 'offset');
  const first = buf[offset];
  const last = buf[offset + 5];
  if (first === undefined || last === undefined)
    boundsError(offset, buf.length - 6);

  return first +
    buf[++offset] * 2 ** 8 +
    buf[++offset] * 2 ** 16 +
    buf[++offset] * 2 ** 24 +
    (buf[++offset] + last * 2 ** 8) * 2 ** 32;
}

function readUInt40LE(buf, offset = 0) {
  validateNumber(offset, 'offset');
  const first = buf[offset];
  const last = buf[offset + 4];
  if (first === undefined || last === undefined)
    boundsError(offset, buf.length - 5);

  return first +
    buf[++offset] * 2 ** 8 +
    buf[++offset] * 2 ** 16 +
    buf[++offset] * 2 ** 24 +
    last * 2 ** 32;
}

function readUInt32LE(offset = 0) {
  checkBounds(this, offset, 3);
  ensureDataView(this);
  return this[kDataView].getUint32(offset, true);
}

function readUInt24LE(buf, offset = 0) {
  validateNumber(offset, 'offset');
  const first = buf[offset];
  const last = buf[offset + 2];
  if (first === undefined || last === undefined)
    boundsError(offset, buf.length - 3);

  return first + buf[++offset] * 2 ** 8 + last * 2 ** 16;
}

function readUInt16LE(offset = 0) {
  checkBounds(this, offset, 1);
  ensureDataView(this);
  return this[kDataView].getUint16(offset, true);
}

function readUInt8(offset = 0) {
  validateNumber(offset, 'offset');
  const val = this[offset];
  if (val === undefined)
    boundsError(offset, this.length - 1);

  return val;
}

function readUIntBE(offset, byteLength) {
  if (offset === undefined)
    throw new ERR_INVALID_ARG_TYPE('offset', 'number', offset);
  if (byteLength === 6)
    return readUInt48BE(this, offset);
  if (byteLength === 5)
    return readUInt40BE(this, offset);
  if (byteLength === 3)
    return readUInt24BE(this, offset);
  if (byteLength === 4)
    return this.readUInt32BE(offset);
  if (byteLength === 2)
    return this.readUInt16BE(offset);
  if (byteLength === 1)
    return this.readUInt8(offset);

  boundsError(byteLength, 6, 'byteLength');
}

function readUInt48BE(buf, offset = 0) {
  validateNumber(offset, 'offset');
  const first = buf[offset];
  const last = buf[offset + 5];
  if (first === undefined || last === undefined)
    boundsError(offset, buf.length - 6);

  return (first * 2 ** 8 + buf[++offset]) * 2 ** 32 +
    buf[++offset] * 2 ** 24 +
    buf[++offset] * 2 ** 16 +
    buf[++offset] * 2 ** 8 +
    last;
}

function readUInt40BE(buf, offset = 0) {
  validateNumber(offset, 'offset');
  const first = buf[offset];
  const last = buf[offset + 4];
  if (first === undefined || last === undefined)
    boundsError(offset, buf.length - 5);

  return first * 2 ** 32 +
    buf[++offset] * 2 ** 24 +
    buf[++offset] * 2 ** 16 +
    buf[++offset] * 2 ** 8 +
    last;
}

function readUInt32BE(offset = 0) {
  checkBounds(this, offset, 3);
  ensureDataView(this);
  return this[kDataView].getUint32(offset, false);
}

function readUInt24BE(buf, offset = 0) {
  validateNumber(offset, 'offset');
  const first = buf[offset];
  const last = buf[offset + 2];
  if (first === undefined || last === undefined)
    boundsError(offset, buf.length - 3);

  return first * 2 ** 16 + buf[++offset] * 2 ** 8 + last;
}

function readUInt16BE(offset = 0) {
  checkBounds(this, offset, 1);
  ensureDataView(this);
  return this[kDataView].getUint16(offset, false);
}

function readIntLE(offset, byteLength) {
  if (offset === undefined)
    throw new ERR_INVALID_ARG_TYPE('offset', 'number', offset);
  if (byteLength === 6)
    return readInt48LE(this, offset);
  if (byteLength === 5)
    return readInt40LE(this, offset);
  if (byteLength === 3)
    return readInt24LE(this, offset);
  if (byteLength === 4)
    return this.readInt32LE(offset);
  if (byteLength === 2)
    return this.readInt16LE(offset);
  if (byteLength === 1)
    return this.readInt8(offset);

  boundsError(byteLength, 6, 'byteLength');
}

function readInt48LE(buf, offset = 0) {
  validateNumber(offset, 'offset');
  const first = buf[offset];
  const last = buf[offset + 5];
  if (first === undefined || last === undefined)
    boundsError(offset, buf.length - 6);

  const val = buf[offset + 4] + last * 2 ** 8;
  return (val | (val & 2 ** 15) * 0x1fffe) * 2 ** 32 +
    first +
    buf[++offset] * 2 ** 8 +
    buf[++offset] * 2 ** 16 +
    buf[++offset] * 2 ** 24;
}

function readInt40LE(buf, offset = 0) {
  validateNumber(offset, 'offset');
  const first = buf[offset];
  const last = buf[offset + 4];
  if (first === undefined || last === undefined)
    boundsError(offset, buf.length - 5);

  return (last | (last & 2 ** 7) * 0x1fffffe) * 2 ** 32 +
    first +
    buf[++offset] * 2 ** 8 +
    buf[++offset] * 2 ** 16 +
    buf[++offset] * 2 ** 24;
}

function readInt32LE(offset = 0) {
  checkBounds(this, offset, 3);
  ensureDataView(this);
  return this[kDataView].getInt32(offset, true);
}

function readInt24LE(buf, offset = 0) {
  validateNumber(offset, 'offset');
  const first = buf[offset];
  const last = buf[offset + 2];
  if (first === undefined || last === undefined)
    boundsError(offset, buf.length - 3);

  const val = first + buf[++offset] * 2 ** 8 + last * 2 ** 16;
  return val | (val & 2 ** 23) * 0x1fe;
}

function readInt16LE(offset = 0) {
  checkBounds(this, offset, 1);
  ensureDataView(this);
  return this[kDataView].getInt16(offset, true);
}

function readInt8(offset = 0) {
  validateNumber(offset, 'offset');
  const val = this[offset];
  if (val === undefined)
    boundsError(offset, this.length - 1);

  return val | (val & 2 ** 7) * 0x1fffffe;
}

function readIntBE(offset, byteLength) {
  if (offset === undefined)
    throw new ERR_INVALID_ARG_TYPE('offset', 'number', offset);
  if (byteLength === 6)
    return readInt48BE(this, offset);
  if (byteLength === 5)
    return readInt40BE(this, offset);
  if (byteLength === 3)
    return readInt24BE(this, offset);
  if (byteLength === 4)
    return this.readInt32BE(offset);
  if (byteLength === 2)
    return this.readInt16BE(offset);
  if (byteLength === 1)
    return this.readInt8(offset);

  boundsError(byteLength, 6, 'byteLength');
}

function readInt48BE(buf, offset = 0) {
  validateNumber(offset, 'offset');
  const first = buf[offset];
  const last = buf[offset + 5];
  if (first === undefined || last === undefined)
    boundsError(offset, buf.length - 6);

  const val = buf[++offset] + first * 2 ** 8;
  return (val | (val & 2 ** 15) * 0x1fffe) * 2 ** 32 +
    buf[++offset] * 2 ** 24 +
    buf[++offset] * 2 ** 16 +
    buf[++offset] * 2 ** 8 +
    last;
}

function readInt40BE(buf, offset = 0) {
  validateNumber(offset, 'offset');
  const first = buf[offset];
  const last = buf[offset + 4];
  if (first === undefined || last === undefined)
    boundsError(offset, buf.length - 5);

  return (first | (first & 2 ** 7) * 0x1fffffe) * 2 ** 32 +
    buf[++offset] * 2 ** 24 +
    buf[++offset] * 2 ** 16 +
    buf[++offset] * 2 ** 8 +
    last;
}

function readInt32BE(offset = 0) {
  checkBounds(this, offset, 3);
  ensureDataView(this);
  return this[kDataView].getInt32(offset, false);
}

function readInt24BE(buf, offset = 0) {
  validateNumber(offset, 'offset');
  const first = buf[offset];
  const last = buf[offset + 2];
  if (first === undefined || last === undefined)
    boundsError(offset, buf.length - 3);

  const val = first * 2 ** 16 + buf[++offset] * 2 ** 8 + last;
  return val | (val & 2 ** 23) * 0x1fe;
}

function readInt16BE(offset = 0) {
  checkBounds(this, offset, 1);
  ensureDataView(this);
  return this[kDataView].getInt16(offset, false);
}

// Read floats
function readFloatLE(offset = 0) {
  checkBounds(this, offset, 3);
  ensureDataView(this);
  return this[kDataView].getFloat32(offset, true);
}

function readFloatBE(offset = 0) {
  checkBounds(this, offset, 3);
  ensureDataView(this);
  return this[kDataView].getFloat32(offset, false);
}

function readDoubleLE(offset = 0) {
  checkBounds(this, offset, 7);
  ensureDataView(this);
  return this[kDataView].getFloat64(offset, true);
}

function readDoubleBE(offset = 0) {
  checkBounds(this, offset, 7);
  ensureDataView(this);
  return this[kDataView].getFloat64(offset, false);
}

// Write integers.
function writeUIntLE(value, offset, byteLength) {
  if (byteLength === 6)
    return writeU_Int48LE(this, value, offset, 0, 0xffffffffffff);
  if (byteLength === 5)
    return writeU_Int40LE(this, value, offset, 0, 0xffffffffff);
  if (byteLength === 3)
    return writeU_Int24LE(this, value, offset, 0, 0xffffff);
  if (byteLength === 4)
    return writeU_Int32LE(this, value, offset, 0, 0xffffffff);
  if (byteLength === 2)
    return writeU_Int16LE(this, value, offset, 0, 0xffff);
  if (byteLength === 1)
    return writeU_Int8(this, value, offset, 0, 0xff);

  boundsError(byteLength, 6, 'byteLength');
}

function writeU_Int48LE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 5);

  const newVal = Math.floor(value * 2 ** -32);
  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  buf[offset++] = newVal;
  buf[offset++] = (newVal >>> 8);
  return offset;
}

function writeU_Int40LE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 4);

  const newVal = value;
  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  buf[offset++] = Math.floor(newVal * 2 ** -32);
  return offset;
}

function writeU_Int32LE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 3);

  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  return offset;
}

function writeUInt32LE(value, offset = 0) {
  return writeU_Int32LE(this, value, offset, 0, 0xffffffff);
}

function writeU_Int24LE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 2);

  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  return offset;
}

function writeU_Int16LE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 1);

  buf[offset++] = value;
  buf[offset++] = (value >>> 8);
  return offset;
}

function writeUInt16LE(value, offset = 0) {
  return writeU_Int16LE(this, value, offset, 0, 0xffff);
}

function writeU_Int8(buf, value, offset, min, max) {
  value = +value;
  // `checkInt()` can not be used here because it checks two entries.
  validateNumber(offset, 'offset');
  if (value > max || value < min) {
    throw new ERR_OUT_OF_RANGE('value', `>= ${min} and <= ${max}`, value);
  }
  if (buf[offset] === undefined)
    boundsError(offset, buf.length - 1);

  buf[offset] = value;
  return offset + 1;
}

function writeUInt8(value, offset = 0) {
  return writeU_Int8(this, value, offset, 0, 0xff);
}

function writeUIntBE(value, offset, byteLength) {
  if (byteLength === 6)
    return writeU_Int48BE(this, value, offset, 0, 0xffffffffffffff);
  if (byteLength === 5)
    return writeU_Int40BE(this, value, offset, 0, 0xffffffffff);
  if (byteLength === 3)
    return writeU_Int24BE(this, value, offset, 0, 0xffffff);
  if (byteLength === 4)
    return writeU_Int32BE(this, value, offset, 0, 0xffffffff);
  if (byteLength === 2)
    return writeU_Int16BE(this, value, offset, 0, 0xffff);
  if (byteLength === 1)
    return writeU_Int8(this, value, offset, 0, 0xff);

  boundsError(byteLength, 6, 'byteLength');
}

function writeU_Int48BE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 5);

  const newVal = Math.floor(value * 2 ** -32);
  buf[offset++] = (newVal >>> 8);
  buf[offset++] = newVal;
  buf[offset + 3] = value;
  value = value >>> 8;
  buf[offset + 2] = value;
  value = value >>> 8;
  buf[offset + 1] = value;
  value = value >>> 8;
  buf[offset] = value;
  return offset + 4;
}

function writeU_Int40BE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 4);

  buf[offset++] = Math.floor(value * 2 ** -32);
  buf[offset + 3] = value;
  value = value >>> 8;
  buf[offset + 2] = value;
  value = value >>> 8;
  buf[offset + 1] = value;
  value = value >>> 8;
  buf[offset] = value;
  return offset + 4;
}

function writeU_Int32BE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 3);

  buf[offset + 3] = value;
  value = value >>> 8;
  buf[offset + 2] = value;
  value = value >>> 8;
  buf[offset + 1] = value;
  value = value >>> 8;
  buf[offset] = value;
  return offset + 4;
}

function writeUInt32BE(value, offset = 0) {
  return writeU_Int32BE(this, value, offset, 0, 0xffffffff);
}

function writeU_Int24BE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 2);

  buf[offset + 2] = value;
  value = value >>> 8;
  buf[offset + 1] = value;
  value = value >>> 8;
  buf[offset] = value;
  return offset + 3;
}

function writeU_Int16BE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 1);

  buf[offset++] = (value >>> 8);
  buf[offset++] = value;
  return offset;
}

function writeUInt16BE(value, offset = 0) {
  return writeU_Int16BE(this, value, offset, 0, 0xffff);
}

function writeIntLE(value, offset, byteLength) {
  if (byteLength === 6)
    return writeU_Int48LE(this, value, offset, -0x800000000000, 0x7fffffffffff);
  if (byteLength === 5)
    return writeU_Int40LE(this, value, offset, -0x8000000000, 0x7fffffffff);
  if (byteLength === 3)
    return writeU_Int24LE(this, value, offset, -0x800000, 0x7fffff);
  if (byteLength === 4)
    return writeU_Int32LE(this, value, offset, -0x80000000, 0x7fffffff);
  if (byteLength === 2)
    return writeU_Int16LE(this, value, offset, -0x8000, 0x7fff);
  if (byteLength === 1)
    return writeU_Int8(this, value, offset, -0x80, 0x7f);

  boundsError(byteLength, 6, 'byteLength');
}

function writeInt32LE(value, offset = 0) {
  return writeU_Int32LE(this, value, offset, -0x80000000, 0x7fffffff);
}

function writeInt16LE(value, offset = 0) {
  return writeU_Int16LE(this, value, offset, -0x8000, 0x7fff);
}

function writeInt8(value, offset = 0) {
  return writeU_Int8(this, value, offset, -0x80, 0x7f);
}

function writeIntBE(value, offset, byteLength) {
  if (byteLength === 6)
    return writeU_Int48BE(this, value, offset, -0x800000000000, 0x7fffffffffff);
  if (byteLength === 5)
    return writeU_Int40BE(this, value, offset, -0x8000000000, 0x7fffffffff);
  if (byteLength === 3)
    return writeU_Int24BE(this, value, offset, -0x800000, 0x7fffff);
  if (byteLength === 4)
    return writeU_Int32BE(this, value, offset, -0x80000000, 0x7fffffff);
  if (byteLength === 2)
    return writeU_Int16BE(this, value, offset, -0x8000, 0x7fff);
  if (byteLength === 1)
    return writeU_Int8(this, value, offset, -0x80, 0x7f);

  boundsError(byteLength, 6, 'byteLength');
}

function writeInt32BE(value, offset = 0) {
  return writeU_Int32BE(this, value, offset, -0x80000000, 0x7fffffff);
}

function writeInt16BE(value, offset = 0) {
  return writeU_Int16BE(this, value, offset, -0x8000, 0x7fff);
}

// Write floats.
function writeDoubleLE(val, offset = 0) {
  val = +val;
  checkBounds(this, offset, 7);
  ensureDataView(this);
  this[kDataView].setFloat64(offset, val, true);
  return offset + 8;
}

function writeDoubleBE(val, offset = 0) {
  val = +val;
  checkBounds(this, offset, 7);
  ensureDataView(this);
  this[kDataView].setFloat64(offset, val, false);
  return offset + 8;
}

function writeFloatLE(val, offset = 0) {
  val = +val;
  checkBounds(this, offset, 3);
  ensureDataView(this);
  this[kDataView].setFloat32(offset, val, true);
  return offset + 4;
}

function writeFloatBE(val, offset = 0) {
  val = +val;
  checkBounds(this, offset, 3);
  ensureDataView(this);
  this[kDataView].setFloat32(offset, val, false);
  return offset + 4;
}

class FastBuffer extends Uint8Array {}

function addBufferPrototypeMethods(proto) {
  proto.readUIntLE = readUIntLE;
  proto.readUInt32LE = readUInt32LE;
  proto.readUInt16LE = readUInt16LE;
  proto.readUInt8 = readUInt8;
  proto.readUIntBE = readUIntBE;
  proto.readUInt32BE = readUInt32BE;
  proto.readUInt16BE = readUInt16BE;
  proto.readIntLE = readIntLE;
  proto.readInt32LE = readInt32LE;
  proto.readInt16LE = readInt16LE;
  proto.readInt8 = readInt8;
  proto.readIntBE = readIntBE;
  proto.readInt32BE = readInt32BE;
  proto.readInt16BE = readInt16BE;

  proto.writeUIntLE = writeUIntLE;
  proto.writeUInt32LE = writeUInt32LE;
  proto.writeUInt16LE = writeUInt16LE;
  proto.writeUInt8 = writeUInt8;
  proto.writeUIntBE = writeUIntBE;
  proto.writeUInt32BE = writeUInt32BE;
  proto.writeUInt16BE = writeUInt16BE;
  proto.writeIntLE = writeIntLE;
  proto.writeInt32LE = writeInt32LE;
  proto.writeInt16LE = writeInt16LE;
  proto.writeInt8 = writeInt8;
  proto.writeIntBE = writeIntBE;
  proto.writeInt32BE = writeInt32BE;
  proto.writeInt16BE = writeInt16BE;

  proto.readFloatLE = readFloatLE;
  proto.readFloatBE = readFloatBE;
  proto.readDoubleLE = readDoubleLE;
  proto.readDoubleBE = readDoubleBE;
  proto.writeFloatLE = writeFloatLE;
  proto.writeFloatBE = writeFloatBE;
  proto.writeDoubleLE = writeDoubleLE;
  proto.writeDoubleBE = writeDoubleBE;

  proto.asciiSlice = asciiSlice;
  proto.base64Slice = base64Slice;
  proto.latin1Slice = latin1Slice;
  proto.hexSlice = hexSlice;
  proto.ucs2Slice = ucs2Slice;
  proto.utf8Slice = utf8Slice;
  proto.asciiWrite = asciiWrite;
  proto.base64Write = base64Write;
  proto.latin1Write = latin1Write;
  proto.hexWrite = hexWrite;
  proto.ucs2Write = ucs2Write;
  proto.utf8Write = utf8Write;
}

module.exports = {
  FastBuffer,
  addBufferPrototypeMethods
};
