#!/usr/bin/env node
/*
 * Android string-resource audit.
 *
 * Compares the keys referenced from Kotlin/XML against the keys defined in
 * res/values (English), res/values-ar and res/values-fr, then reports missing
 * translations. Run from anywhere:  node check-strings.cjs
 */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const androidRoot = path.join(root, 'android', 'app', 'src', 'main');
const resRoot = path.join(androidRoot, 'res');
const javaRoot = path.join(androidRoot, 'java');

const locales = [
  { code: 'EN', dir: 'values' },
  { code: 'AR', dir: 'values-ar' },
  { code: 'FR', dir: 'values-fr' },
];

function readKeys(file) {
  if (!fs.existsSync(file)) return new Set();
  const xml = fs.readFileSync(file, 'utf8');
  const keys = new Set();
  const re = /<string\s+name="([A-Za-z0-9_]+)"/g;
  let match;
  while ((match = re.exec(xml))) keys.add(match[1]);
  return keys;
}

function walk(dir, out) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = [
  ...walk(javaRoot, []).filter((f) => f.endsWith('.kt') || f.endsWith('.java')),
  ...walk(resRoot, []).filter((f) => f.endsWith('.xml') && !/[\\/]values/.test(f)),
];

const used = new Set();
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  let match;
  const kotlinRe = /\bR\.string\.([A-Za-z0-9_]+)/g;
  while ((match = kotlinRe.exec(source))) used.add(match[1]);
  const xmlRe = /@string\/([A-Za-z0-9_]+)/g;
  while ((match = xmlRe.exec(source))) used.add(match[1]);
}

const defined = new Map(locales.map((l) => [l.code, readKeys(path.join(resRoot, l.dir, 'strings.xml'))]));

console.log(`USED ${used.size} HAVE ${defined.get('EN').size}`);

let failures = 0;
for (const locale of locales) {
  const keys = defined.get(locale.code);
  const missing = [...used].filter((key) => !keys.has(key)).sort();
  if (missing.length === 0) {
    console.log(`MISSING ${locale.code}: (none)`);
  } else {
    failures += missing.length;
    console.log(`MISSING ${locale.code}: ${missing.join(', ')}`);
  }
  const extra = [...keys].filter((key) => !used.has(key)).sort();
  console.log(`UNUSED ${locale.code}: ${extra.length}`);
}

process.exitCode = failures === 0 ? 0 : 1;
