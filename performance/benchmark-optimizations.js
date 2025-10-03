#!/usr/bin/env node
"use strict"

const iconv = require("../lib")

// Benchmark configuration
const ITERATIONS = 100000
const TEST_STRINGS = {
  ascii: "Hello, World! This is a simple ASCII test string with numbers 1234567890.",
  utf8: "Hello 世界! This is UTF-8 with emoji 🚀 and special chars: café, naïve, Zürich.",
  mixed: "Mixed content: Hello мир 世界 שלום مرحبا with numbers 42 and symbols @#$%",
  long: "This is a much longer string to test performance on larger inputs. ".repeat(10)
}

const ENCODINGS = ["utf8", "ascii", "windows-1251", "gbk", "utf-16le"]

console.log("=".repeat(80))
console.log("iconv-lite Performance Benchmark - Optimizations")
console.log("=".repeat(80))
console.log(`Iterations per test: ${ITERATIONS.toLocaleString()}`)
console.log("")

function benchmark(name, fn) {
  const start = process.hrtime.bigint()
  for (let i = 0; i < ITERATIONS; i++) {
    fn()
  }
  const end = process.hrtime.bigint()
  const duration = Number(end - start) / 1000000 // Convert to milliseconds
  const opsPerSec = (ITERATIONS / duration) * 1000
  return {
    duration: duration.toFixed(2),
    opsPerSec: opsPerSec.toFixed(0)
  }
}

// Test encoding performance
console.log("ENCODING PERFORMANCE")
console.log("-".repeat(80))

for (const encoding of ENCODINGS) {
  console.log(`\n${encoding.toUpperCase()} Encoding:`)

  for (const [name, str] of Object.entries(TEST_STRINGS)) {
    // Skip ASCII encoding for non-ASCII strings
    if (encoding === "ascii" && name !== "ascii") continue

    const result = benchmark(`encode-${encoding}-${name}`, () => {
      iconv.encode(str, encoding)
    })

    console.log(`  ${name.padEnd(10)} - ${result.duration}ms (${result.opsPerSec} ops/sec)`)
  }
}

// Test decoding performance
console.log("\n" + "=".repeat(80))
console.log("DECODING PERFORMANCE")
console.log("-".repeat(80))

for (const encoding of ENCODINGS) {
  console.log(`\n${encoding.toUpperCase()} Decoding:`)

  for (const [name, str] of Object.entries(TEST_STRINGS)) {
    // Skip ASCII encoding for non-ASCII strings
    if (encoding === "ascii" && name !== "ascii") continue

    const encoded = iconv.encode(str, encoding)
    const result = benchmark(`decode-${encoding}-${name}`, () => {
      iconv.decode(encoded, encoding)
    })

    console.log(`  ${name.padEnd(10)} - ${result.duration}ms (${result.opsPerSec} ops/sec)`)
  }
}

// Test round-trip performance
console.log("\n" + "=".repeat(80))
console.log("ROUND-TRIP PERFORMANCE")
console.log("-".repeat(80))

for (const encoding of ENCODINGS) {
  console.log(`\n${encoding.toUpperCase()} Round-trip:`)

  for (const [name, str] of Object.entries(TEST_STRINGS)) {
    // Skip ASCII encoding for non-ASCII strings
    if (encoding === "ascii" && name !== "ascii") continue

    const result = benchmark(`roundtrip-${encoding}-${name}`, () => {
      const encoded = iconv.encode(str, encoding)
      iconv.decode(encoded, encoding)
    })

    console.log(`  ${name.padEnd(10)} - ${result.duration}ms (${result.opsPerSec} ops/sec)`)
  }
}

console.log("\n" + "=".repeat(80))
console.log("Benchmark complete!")
console.log("=".repeat(80))
