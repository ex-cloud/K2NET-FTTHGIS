#!/usr/bin/env node
/**
 * K2NET FTTH GIS — Comprehensive i18n Standardization & Localization Auditor
 * ==============================================================================
 * This script executes three core audits:
 * 1. Dictionary Parity: Validates 100% key symmetry between id/*.json and en/*.json.
 * 2. Key Validity: Scans code for t("namespace.key") and ensures all referenced keys exist.
 * 3. Hardcoded Text Scanner: Detects unlocalized Indonesian/English strings in TSX files.
 * ==============================================================================
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "../../..");
const LOCALES_ID_DIR = path.join(ROOT_DIR, "packages/i18n/src/locales/id");
const LOCALES_EN_DIR = path.join(ROOT_DIR, "packages/i18n/src/locales/en");

const APPS_TO_SCAN = [
  path.join(ROOT_DIR, "apps/studio-admin/src"),
  path.join(ROOT_DIR, "apps/studio-tenant/src")
];

// ANSI colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  dim: "\x1b[2m"
};

let fatalErrors = 0;
let warnings = 0;

console.log(`${colors.blue}${colors.bold}================================================================${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}   🌐 K2NET Comprehensive i18n & Localization Auditor           ${colors.reset}`);
console.log(`${colors.blue}${colors.bold}================================================================${colors.reset}\n`);

// ------------------------------------------------------------------------------
// Step 1: Dictionary Parity Audit (id vs en)
// ------------------------------------------------------------------------------
console.log(`${colors.yellow}━━━ [1/3] DICTIONARY PARITY & INTEGRITY AUDIT ━━━${colors.reset}`);

const idFiles = fs.readdirSync(LOCALES_ID_DIR).filter(f => f.endsWith(".json"));
const enFiles = fs.readdirSync(LOCALES_EN_DIR).filter(f => f.endsWith(".json"));

const dictionaries = { id: {}, en: {} };

// Check file parity
const allFiles = Array.from(new Set([...idFiles, ...enFiles])).sort();

allFiles.forEach(file => {
  const hasId = idFiles.includes(file);
  const hasEn = enFiles.includes(file);

  if (!hasId) {
    console.log(`  ${colors.red}❌ File missing in ID locale: ${file}${colors.reset}`);
    fatalErrors++;
    return;
  }
  if (!hasEn) {
    console.log(`  ${colors.red}❌ File missing in EN locale: ${file}${colors.reset}`);
    fatalErrors++;
    return;
  }

  const idContent = JSON.parse(fs.readFileSync(path.join(LOCALES_ID_DIR, file), "utf8"));
  const enContent = JSON.parse(fs.readFileSync(path.join(LOCALES_EN_DIR, file), "utf8"));

  const namespace = file.replace(".json", "");
  dictionaries.id[namespace] = idContent;
  dictionaries.en[namespace] = enContent;

  const idKeys = Object.keys(idContent);
  const enKeys = Object.keys(enContent);

  const missingInEn = idKeys.filter(k => !enKeys.includes(k));
  const missingInId = enKeys.filter(k => !idKeys.includes(k));

  if (missingInEn.length > 0) {
    console.log(`  ${colors.red}❌ [${namespace}] Keys present in ID but missing in EN (${missingInEn.length}):${colors.reset} ${missingInEn.join(", ")}`);
    fatalErrors += missingInEn.length;
  }
  if (missingInId.length > 0) {
    console.log(`  ${colors.red}❌ [${namespace}] Keys present in EN but missing in ID (${missingInId.length}):${colors.reset} ${missingInId.join(", ")}`);
    fatalErrors += missingInId.length;
  }

  if (missingInEn.length === 0 && missingInId.length === 0) {
    console.log(`  ${colors.green}✓ [${namespace}] Parity OK (${idKeys.length} keys synchronized)${colors.reset}`);
  }
});

// ------------------------------------------------------------------------------
// Step 2: Codebase Translation Key Validity Audit
// ------------------------------------------------------------------------------
console.log(`\n${colors.yellow}━━━ [2/3] CODEBASE TRANSLATION KEYS VALIDITY AUDIT ━━━${colors.reset}`);

function getFilesRecursive(dir, ext = [".tsx", ".ts"]) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    if (item.isDirectory()) {
      if (item.name !== "node_modules" && item.name !== ".git" && item.name !== "dist") {
        results.push(...getFilesRecursive(path.join(dir, item.name), ext));
      }
    } else if (ext.some(e => item.name.endsWith(e))) {
      results.push(path.join(dir, item.name));
    }
  }
  return results;
}

let totalKeyRefs = 0;
let invalidKeyRefs = 0;

APPS_TO_SCAN.forEach(appDir => {
  if (!fs.existsSync(appDir)) return;
  const appName = path.basename(path.dirname(appDir));
  console.log(`  🔹 Scanning translation key references in ${colors.cyan}${appName}${colors.reset}...`);

  const files = getFilesRecursive(appDir);
  files.forEach(filePath => {
    const content = fs.readFileSync(filePath, "utf8");
    // Match t("namespace.key", ...) or t('namespace.key', ...) or t(`namespace.key`, ...)
    const regex = /\bt\(\s*["'`]([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)["'`]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      totalKeyRefs++;
      const [_, ns, key] = match;
      if (!dictionaries.id[ns] || dictionaries.id[ns][key] === undefined) {
        console.log(`  ${colors.red}❌ Missing key referenced in code:${colors.reset} "${ns}.${key}" in ${path.relative(ROOT_DIR, filePath)}`);
        invalidKeyRefs++;
        fatalErrors++;
      }
    }
  });
});

if (invalidKeyRefs === 0) {
  console.log(`  ${colors.green}✓ All ${totalKeyRefs} translation key references are valid in dictionaries.${colors.reset}`);
}

// ------------------------------------------------------------------------------
// Step 3: Hardcoded Text Scanner in TSX Files
// ------------------------------------------------------------------------------
console.log(`\n${colors.yellow}━━━ [3/3] UNLOCALIZED STRING SCANNER ━━━${colors.reset}`);

const indonesianPatterns = [
  /\b(tambah|hapus|simpan|batal|ubah|ekspor|impor|pilih|selesai|konfirmasi|tutup|kirim)\b/i,
  /\b(aktifkan|tangguhkan|peringatan|memuat|tidak ada|berhasil|gagal|pengaturan|kembali)\b/i,
  /\b(tindakan ini|terpilih|semua data|disalin ke clipboard)\b/i
];

let hardcodedViolations = 0;

APPS_TO_SCAN.forEach(appDir => {
  if (!fs.existsSync(appDir)) return;
  const appName = path.basename(path.dirname(appDir));
  console.log(`  🔹 Scanning unlocalized strings in ${colors.cyan}${appName}${colors.reset}...`);

  const files = getFilesRecursive(appDir, [".tsx"]);
  files.forEach(filePath => {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      // Skip imports, comments, className, test logs, SVG paths
      if (
        trimmed.startsWith("import ") ||
        trimmed.startsWith("//") ||
        trimmed.startsWith("/*") ||
        trimmed.startsWith("*") ||
        trimmed.includes("useTranslation") ||
        trimmed.includes("console.") ||
        trimmed.includes("d=\"") ||
        trimmed.includes("className=") ||
        trimmed.includes("id=")
      ) {
        return;
      }

      for (const pattern of indonesianPatterns) {
        if (pattern.test(trimmed)) {
          // If it's already inside t("...") skip
          if (!trimmed.includes("t(\"") && !trimmed.includes("t('") && !trimmed.includes("t(`")) {
            const relPath = path.relative(ROOT_DIR, filePath);
            console.log(`  ${colors.yellow}⚠️  Unlocalized pattern in ${colors.reset}${relPath}:${idx + 1}\n     ${colors.dim}${trimmed}${colors.reset}`);
            hardcodedViolations++;
            break;
          }
        }
      }
    });
  });
});

console.log(`\n${colors.blue}================================================================${colors.reset}`);
if (fatalErrors > 0) {
  console.log(`${colors.red}${colors.bold}❌ AUDIT GAGAL: Ditemukan ${fatalErrors} kesalahan fatal i18n.${colors.reset}`);
  process.exit(1);
} else if (hardcodedViolations > 0) {
  console.log(`${colors.yellow}${colors.bold}⚠️  AUDIT SELESAI DENGAN CATATAN: ${hardcodedViolations} unlocalized strings terdeteksi (0 fatal errors).${colors.reset}`);
  process.exit(0);
} else {
  console.log(`${colors.green}${colors.bold}🎉 AUDIT SUKSES 100%: Seluruh kamus sinkron & 0 pelanggaran lokalisasi!${colors.reset}`);
  process.exit(0);
}
