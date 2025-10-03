"use strict"
var Buffer = require("safer-buffer").Buffer

// Compatibility: Buffer.allocUnsafe is not available in Node < 4.5.0
var bufferAllocUnsafe = typeof Buffer.allocUnsafe === "function" ? Buffer.allocUnsafe : Buffer.alloc

// Single-byte codec. Needs a 'chars' string parameter that contains 256 or 128 chars that
// correspond to encoded bytes (if 128 - then lower half is ASCII).

exports._sbcs = SBCSCodec
function SBCSCodec (codecOptions, iconv) {
  if (!codecOptions) {
    throw new Error("SBCS codec is called without the data.")
  }

  // Prepare char buffer for decoding.
  if (!codecOptions.chars || (codecOptions.chars.length !== 128 && codecOptions.chars.length !== 256)) {
    throw new Error("Encoding '" + codecOptions.type + "' has incorrect 'chars' (must be of len 128 or 256)")
  }

  if (codecOptions.chars.length === 128) {
    var asciiString = ""
    for (var i = 0; i < 128; i++) {
      asciiString += String.fromCharCode(i)
    }
    codecOptions.chars = asciiString + codecOptions.chars
  }

  this.decodeBuf = Buffer.from(codecOptions.chars, "ucs2")

  // Encoding buffer.
  var encodeBuf = Buffer.alloc(65536, iconv.defaultCharSingleByte.charCodeAt(0))

  for (var i = 0; i < codecOptions.chars.length; i++) {
    encodeBuf[codecOptions.chars.charCodeAt(i)] = i
  }

  this.encodeBuf = encodeBuf
}

SBCSCodec.prototype.encoder = SBCSEncoder
SBCSCodec.prototype.decoder = SBCSDecoder

function SBCSEncoder (options, codec) {
  this.encodeBuf = codec.encodeBuf
}

SBCSEncoder.prototype.write = function (str) {
  var buf = bufferAllocUnsafe(str.length)
  var encodeBuf = this.encodeBuf

  // Unroll loop for better performance
  var i = 0
  var len = str.length
  var remainder = len % 4

  // Process 4 characters at a time
  for (; i < len - remainder; i += 4) {
    buf[i] = encodeBuf[str.charCodeAt(i)]
    buf[i + 1] = encodeBuf[str.charCodeAt(i + 1)]
    buf[i + 2] = encodeBuf[str.charCodeAt(i + 2)]
    buf[i + 3] = encodeBuf[str.charCodeAt(i + 3)]
  }

  // Process remaining characters
  for (; i < len; i++) {
    buf[i] = encodeBuf[str.charCodeAt(i)]
  }

  return buf
}

SBCSEncoder.prototype.end = function () {
}

function SBCSDecoder (options, codec) {
  this.decodeBuf = codec.decodeBuf
}

SBCSDecoder.prototype.write = function (buf) {
  // Strings are immutable in JS -> we use ucs2 buffer to speed up computations.
  var decodeBuf = this.decodeBuf
  var len = buf.length
  var newBuf = bufferAllocUnsafe(len * 2)

  // Unroll loop for better performance
  var i = 0
  var idx1 = 0
  var idx2 = 0
  var remainder = len % 4

  // Process 4 bytes at a time
  for (; i < len - remainder; i += 4) {
    idx1 = buf[i] * 2
    idx2 = i * 2
    newBuf[idx2] = decodeBuf[idx1]
    newBuf[idx2 + 1] = decodeBuf[idx1 + 1]

    idx1 = buf[i + 1] * 2
    idx2 = (i + 1) * 2
    newBuf[idx2] = decodeBuf[idx1]
    newBuf[idx2 + 1] = decodeBuf[idx1 + 1]

    idx1 = buf[i + 2] * 2
    idx2 = (i + 2) * 2
    newBuf[idx2] = decodeBuf[idx1]
    newBuf[idx2 + 1] = decodeBuf[idx1 + 1]

    idx1 = buf[i + 3] * 2
    idx2 = (i + 3) * 2
    newBuf[idx2] = decodeBuf[idx1]
    newBuf[idx2 + 1] = decodeBuf[idx1 + 1]
  }

  // Process remaining bytes
  for (; i < len; i++) {
    idx1 = buf[i] * 2
    idx2 = i * 2
    newBuf[idx2] = decodeBuf[idx1]
    newBuf[idx2 + 1] = decodeBuf[idx1 + 1]
  }

  return newBuf.toString("ucs2")
}

SBCSDecoder.prototype.end = function () {
}
