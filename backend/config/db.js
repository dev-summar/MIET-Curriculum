const path = require("path");
const Database = require("better-sqlite3");

const configuredDbPath = process.env.DB_PATH;
const dbPath = configuredDbPath
  ? path.resolve(configuredDbPath)
  : path.resolve(__dirname, "../data/curriculum.db");
const db = new Database(dbPath);

function initDb() {
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      total_credits INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      credits INTEGER NOT NULL,
      ltp TEXT,
      semester INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      program_id INTEGER,
      FOREIGN KEY(program_id) REFERENCES programs(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      unit_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      hours INTEGER NOT NULL,
      bloom_level TEXT,
      topics TEXT,
      teaching_methods TEXT,
      assessments TEXT,
      references_json TEXT,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS course_outcomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      co_number INTEGER NOT NULL,
      description TEXT NOT NULL,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_number TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      program_id INTEGER NOT NULL,
      UNIQUE(program_id, po_number),
      FOREIGN KEY(program_id) REFERENCES programs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS co_po_map (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      co_id INTEGER NOT NULL,
      po_id INTEGER NOT NULL,
      level TEXT NOT NULL,
      FOREIGN KEY(co_id) REFERENCES course_outcomes(id) ON DELETE CASCADE,
      FOREIGN KEY(po_id) REFERENCES pos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      link TEXT NOT NULL,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'faculty', 'student'))
    );
  `);

  const courseCols = db.prepare("PRAGMA table_info(courses)").all().map((c) => c.name);
  if (!courseCols.includes("program_id")) {
    db.exec("ALTER TABLE courses ADD COLUMN program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL;");
  }
  const poCols = db.prepare("PRAGMA table_info(pos)").all().map((c) => c.name);
  if (!poCols.includes("program_id")) {
    db.exec("ALTER TABLE pos ADD COLUMN program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE;");
  }

  const poIndexes = db.prepare("PRAGMA index_list(pos)").all();
  const hasCompositePoUnique = poIndexes.some((idx) => {
    if (!idx.unique) return false;
    const cols = db.prepare(`PRAGMA index_info(${idx.name})`).all().map((c) => c.name).join(",");
    return cols === "program_id,po_number";
  });
  if (!hasCompositePoUnique) {
    db.exec(`
      PRAGMA foreign_keys=OFF;
      BEGIN TRANSACTION;
      ALTER TABLE pos RENAME TO pos_old;
      CREATE TABLE pos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        po_number TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        program_id INTEGER NOT NULL,
        UNIQUE(program_id, po_number),
        FOREIGN KEY(program_id) REFERENCES programs(id) ON DELETE CASCADE
      );
      INSERT INTO pos (id, po_number, name, description, program_id)
      SELECT id, po_number, name, description, COALESCE(program_id, 1) FROM pos_old;
      DROP TABLE pos_old;
      COMMIT;
      PRAGMA foreign_keys=ON;
    `);
  }

  const coPoFks = db.prepare("PRAGMA foreign_key_list(co_po_map)").all();
  const poFk = coPoFks.find((fk) => fk.from === "po_id");
  if (poFk && poFk.table !== "pos") {
    db.exec(`
      PRAGMA foreign_keys=OFF;
      BEGIN TRANSACTION;
      ALTER TABLE co_po_map RENAME TO co_po_map_old;
      CREATE TABLE co_po_map (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        co_id INTEGER NOT NULL,
        po_id INTEGER NOT NULL,
        level TEXT NOT NULL,
        FOREIGN KEY(co_id) REFERENCES course_outcomes(id) ON DELETE CASCADE,
        FOREIGN KEY(po_id) REFERENCES pos(id) ON DELETE CASCADE
      );
      INSERT INTO co_po_map (id, co_id, po_id, level)
      SELECT id, co_id, po_id, level FROM co_po_map_old;
      DROP TABLE co_po_map_old;
      COMMIT;
      PRAGMA foreign_keys=ON;
    `);
  }

  const coursesSqlRow = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='courses'").get();
  const coursesSql = coursesSqlRow?.sql || "";
  if (coursesSql && !coursesSql.includes("UNIQUE(program_id, code)")) {
    db.exec(`
      PRAGMA foreign_keys=OFF;
      BEGIN TRANSACTION;
      CREATE TABLE courses_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        credits INTEGER NOT NULL,
        ltp TEXT,
        semester INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        program_id INTEGER NOT NULL,
        UNIQUE(program_id, code),
        FOREIGN KEY(program_id) REFERENCES programs(id) ON DELETE CASCADE
      );
      INSERT INTO courses_new (id, code, name, credits, ltp, semester, type, description, program_id)
      SELECT id, code, name, credits, ltp, semester, type, description, COALESCE(program_id, 1)
      FROM courses;
      DROP TABLE courses;
      ALTER TABLE courses_new RENAME TO courses;
      CREATE INDEX IF NOT EXISTS idx_courses_program ON courses(program_id);
      COMMIT;
      PRAGMA foreign_keys=ON;
    `);
  }
}

module.exports = { db, initDb };
