/**
 * Confirms SQLite matches curriculum.seed.json (via loadSourceData).
 * Run: npm run verify   (from backend folder)
 */
const path = require("path");
const Database = require("better-sqlite3");
const { loadSourceData } = require("./config/sourceData");

function main() {
  const { SEMESTERS, COURSE_DETAIL } = loadSourceData();
  const codesFromSem = new Set();
  SEMESTERS.forEach((s) => s.courses.forEach((c) => codesFromSem.add(c.code)));

  const detailKeys = Object.keys(COURSE_DETAIL);
  const missingDetail = [...codesFromSem].filter((c) => !COURSE_DETAIL[c]);
  const extraDetail = detailKeys.filter((k) => !codesFromSem.has(k));

  const db = new Database(path.join(__dirname, "data/curriculum.db"));
  const dbCount = db.prepare("SELECT COUNT(*) c FROM courses WHERE program_id = 1").get().c;
  const dbCodes = new Set(db.prepare("SELECT code FROM courses WHERE program_id = 1").all().map((r) => r.code));

  const missingInDb = [...codesFromSem].filter((c) => !dbCodes.has(c));

  let expectedUnits = 0;
  let expectedResources = 0;
  for (const d of Object.values(COURSE_DETAIL)) {
    if (Array.isArray(d.units)) expectedUnits += d.units.length;
    if (Array.isArray(d.resources)) expectedResources += d.resources.length;
  }
  const dbUnits = db.prepare("SELECT COUNT(*) c FROM units u JOIN courses c ON c.id = u.course_id WHERE c.program_id = 1").get().c;
  const dbRes = db.prepare("SELECT COUNT(*) c FROM resources r JOIN courses c ON c.id = r.course_id WHERE c.program_id = 1").get().c;

  const lines = [
    `curriculum.seed.json → SEMESTERS course codes: ${codesFromSem.size}`,
    `curriculum.seed.json → COURSE_DETAIL keys: ${detailKeys.length}`,
    `SQLite courses (program 1): ${dbCount}`,
    `SQLite units (program 1): ${dbUnits} (expected from seed: ${expectedUnits})`,
    `SQLite resources (program 1): ${dbRes} (expected from seed: ${expectedResources})`,
  ];

  const ok =
    missingDetail.length === 0 &&
    extraDetail.length === 0 &&
    missingInDb.length === 0 &&
    codesFromSem.size === dbCount &&
    dbUnits === expectedUnits &&
    dbRes === expectedResources;

  if (!ok) {
    console.error("Mismatch detected:\n");
    if (missingDetail.length) console.error("  SEMESTERS codes without COURSE_DETAIL:", missingDetail.join(", "));
    if (extraDetail.length) console.error("  COURSE_DETAIL keys not in SEMESTERS:", extraDetail.join(", "));
    if (missingInDb.length) console.error("  Codes in seed JSON but not in DB (run npm run seed):", missingInDb.join(", "));
    console.error("\n" + lines.join("\n"));
    process.exit(1);
  }

  console.log("Curriculum sync OK — curriculum.seed.json and database match.\n");
  console.log(lines.join("\n"));
  process.exit(0);
}

main();
