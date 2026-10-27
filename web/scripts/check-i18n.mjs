#!/usr/bin/env node
/**
 * Validates the translation dictionaries without needing a TypeScript runtime.
 *
 * Checks:
 *  1. en / ar / fr define exactly the same message keys.
 *  2. Every statically referenced `dict.<key>` in the app actually exists.
 *  3. Reports duplicate keys inside a dictionary.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const i18nPath = join(root, 'lib', 'i18n.ts');

function fail(message) {
  console.error(`i18n: ${message}`);
  process.exitCode = 1;
}

function extractDictionary(source, name) {
  const start = source.indexOf(`const ${name}`);
  if (start === -1) {
    fail(`dictionary "${name}" was not found in lib/i18n.ts`);
    return [];
  }
  const open = source.indexOf('{', start);
  const closing = /\n}(?: as const)?;/g;
  closing.lastIndex = open;
  const endMatch = closing.exec(source);
  if (open === -1 || !endMatch) {
    fail(`dictionary "${name}" has an unexpected shape`);
    return [];
  }
  const end = endMatch.index;

  const body = source.slice(open + 1, end);
  const keys = [];
  const duplicates = new Set();
  const keyPattern = /^ {2}(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$]*))\s*:/gm;
  let match;
  while ((match = keyPattern.exec(body)) !== null) {
    const key = match[1] ?? match[2] ?? match[3];
    if (keys.includes(key)) duplicates.add(key);
    keys.push(key);
  }

  for (const key of duplicates) fail(`duplicate key "${key}" in "${name}"`);
  return keys;
}

const source = readFileSync(i18nPath, 'utf8');
const dictionaries = Object.fromEntries(
  ['en', 'ar', 'fr'].map((locale) => [locale, extractDictionary(source, locale)]),
);

const baseline = new Set(dictionaries.en);
for (const [locale, keys] of Object.entries(dictionaries)) {
  const set = new Set(keys);
  for (const key of baseline) {
    if (!set.has(key)) fail(`"${locale}" is missing "${key}"`);
  }
  for (const key of set) {
    if (!baseline.has(key)) fail(`"${locale}" has extra key "${key}"`);
  }
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) return [];
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const appFiles = [
  ...walk(join(root, 'app')),
  ...walk(join(root, 'components')),
  ...walk(join(root, 'lib')),
].filter((file) => /\.(ts|tsx)$/.test(file) && file !== i18nPath);

const used = new Map();
const usagePatterns = [
  /\bdict\.([A-Za-z_$][\w$]*)/g,
  /\bdictionary\.([A-Za-z_$][\w$]*)/g,
  /\bgetDictionary\([^)]*\)\.([A-Za-z_$][\w$]*)/g,
];
for (const file of appFiles) {
  const text = readFileSync(file, 'utf8');
  for (const pattern of usagePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const key = match[1];
      if (!used.has(key)) used.set(key, relative(root, file));
    }
  }
}

for (const [key, file] of used) {
  if (!baseline.has(key)) fail(`"${key}" is used in ${file} but is not defined`);
}

const unused = [...baseline].filter((key) => !used.has(key));
console.log(
  `i18n: ${dictionaries.en.length} keys x 3 locales, ` +
    `${used.size} referenced, ${unused.length} unused.`,
);
if (unused.length > 0 && process.env.I18N_SHOW_UNUSED === '1') {
  console.log(`i18n: unused keys: ${unused.join(', ')}`);
}

if (process.exitCode) {
  console.error('i18n: FAILED');
} else {
  console.log('i18n: OK');
}
