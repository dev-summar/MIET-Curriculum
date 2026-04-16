const { db, initDb } = require("./config/db");
const { loadSourceData } = require("./config/sourceData");
const bcrypt = require("bcryptjs");

function clearTables() {
  db.exec(`
    DELETE FROM co_po_map;
    DELETE FROM course_outcomes;
    DELETE FROM units;
    DELETE FROM courses;
    DELETE FROM resources;
    DELETE FROM pos;
    DELETE FROM programs;
    DELETE FROM users;
    DELETE FROM sqlite_sequence;
  `);
}

function seedProgram() {
  const info = db
    .prepare(`INSERT INTO programs (name, code, total_credits) VALUES (?, ?, ?)`)
    .run("B.Tech Computer Science & Engineering", "CSE", 164);
  return Number(info.lastInsertRowid);
}

function seedPOs(pos, programId) {
  const stmt = db.prepare(
    `INSERT INTO pos (po_number, name, description, program_id)
     VALUES (?, ?, ?, ?)`
  );
  for (const po of pos) {
    stmt.run(po.id, po.name, po.desc, programId);
  }
}

function seedCoursesAndRelations(semesters, courseDetail, programId) {
  const insertResource = db.prepare(
    `INSERT INTO resources (course_id, type, title, link)
     VALUES (?, ?, ?, ?)`
  );
  const insertCourse = db.prepare(
    `INSERT INTO courses (code, name, credits, ltp, semester, type, description, program_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertUnit = db.prepare(
    `INSERT INTO units (course_id, unit_number, title, hours, bloom_level, topics, teaching_methods, assessments, references_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertCO = db.prepare(
    `INSERT INTO course_outcomes (course_id, co_number, description)
     VALUES (?, ?, ?)`
  );
  const getPoIdByNumber = db.prepare(`SELECT id FROM pos WHERE po_number = ?`);
  const insertMap = db.prepare(
    `INSERT INTO co_po_map (co_id, po_id, level)
     VALUES (?, ?, ?)`
  );

  for (const sem of semesters) {
    for (const c of sem.courses) {
      const detail = courseDetail[c.code];
      const ltp = detail?.ltp || "3-1-0";
      const description = detail?.description || "";
      const info = insertCourse.run(
        c.code,
        c.name,
        c.credits,
        ltp,
        sem.id,
        c.type,
        description,
        programId
      );
      const courseId = Number(info.lastInsertRowid);

      if (!detail || !Array.isArray(detail.units)) continue;

      if (Array.isArray(detail.resources)) {
        for (const r of detail.resources) {
          insertResource.run(courseId, r.type || "notes", r.title || "", r.link || "#");
        }
      }

      for (const unit of detail.units) {
        insertUnit.run(
          courseId,
          unit.num,
          unit.title,
          unit.hours || 0,
          unit.bloom || "",
          JSON.stringify(unit.topics || []),
          JSON.stringify(unit.teaching || []),
          JSON.stringify(unit.assessment || []),
          JSON.stringify(unit.refs || [])
        );

        const coInfo = insertCO.run(courseId, unit.num, unit.co || "");
        const coId = Number(coInfo.lastInsertRowid);
        const poMappings = Array.isArray(unit.pos) ? unit.pos : [];
        for (const mapping of poMappings) {
          const po = getPoIdByNumber.get(mapping.id);
          if (!po) continue;
          insertMap.run(coId, po.id, mapping.l || "low");
        }
      }
    }
  }
}

function seedDefaultAdmin() {
  const email = "admin@miet.ac.in";
  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (exists) return;
  const passwordHash = bcrypt.hashSync("admin123", 10);
  db.prepare(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES (?, ?, ?, ?)`
  ).run("Admin User", email, passwordHash, "admin");
}

function runSeed() {
  initDb();
  const { POs, SEMESTERS, COURSE_DETAIL } = loadSourceData();
  clearTables();
  const tx = db.transaction(() => {
    const programId = seedProgram();
    seedPOs(POs, programId);
    seedCoursesAndRelations(SEMESTERS, COURSE_DETAIL, programId);
    seedDefaultAdmin();
  });
  tx();
  console.log("Seed completed.");
}

runSeed();
