const { db } = require("../config/db");

function parseJson(value, fallback = []) {
  if (value == null || value === "") return fallback;
  if (Array.isArray(value) || typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
}

function createCourse(req, res) {
  const { code, name, credits, ltp, semester, type, description, program_id } = req.body || {};
  if (!code || !name || credits == null || semester == null || !type || program_id == null) {
    return res.status(400).json({ error: "code, name, credits, semester, type, and program_id are required" });
  }
  const info = db
    .prepare(
      `INSERT INTO courses (code, name, credits, ltp, semester, type, description, program_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(code, name, Number(credits), ltp || "3-1-0", Number(semester), type, description || "", Number(program_id));
  return res.status(201).json({ id: Number(info.lastInsertRowid) });
}

function updateCourse(req, res) {
  const courseId = Number(req.params.id);
  const { code, name, credits, ltp, semester, type, description, program_id } = req.body || {};
  db.prepare(
    `UPDATE courses
     SET code = ?, name = ?, credits = ?, ltp = ?, semester = ?, type = ?, description = ?, program_id = ?
     WHERE id = ?`
  ).run(code, name, Number(credits), ltp || "3-1-0", Number(semester), type, description || "", Number(program_id), courseId);
  return res.json({ success: true });
}

function deleteCourse(req, res) {
  const courseId = Number(req.params.id);
  db.prepare("DELETE FROM courses WHERE id = ?").run(courseId);
  return res.json({ success: true });
}

function createUnit(req, res) {
  const { course_id, unit_number, title, hours, bloom_level, topics, teaching_methods, assessments, references } = req.body || {};
  const info = db.prepare(
    `INSERT INTO units (course_id, unit_number, title, hours, bloom_level, topics, teaching_methods, assessments, references_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    Number(course_id),
    Number(unit_number),
    title,
    Number(hours || 0),
    bloom_level || "",
    JSON.stringify(parseJson(topics)),
    JSON.stringify(parseJson(teaching_methods)),
    JSON.stringify(parseJson(assessments)),
    JSON.stringify(parseJson(references))
  );
  return res.status(201).json({ id: Number(info.lastInsertRowid) });
}

function updateUnit(req, res) {
  const unitId = Number(req.params.id);
  const { course_id, unit_number, title, hours, bloom_level, topics, teaching_methods, assessments, references } = req.body || {};
  db.prepare(
    `UPDATE units
     SET course_id = ?, unit_number = ?, title = ?, hours = ?, bloom_level = ?, topics = ?, teaching_methods = ?, assessments = ?, references_json = ?
     WHERE id = ?`
  ).run(
    Number(course_id),
    Number(unit_number),
    title,
    Number(hours || 0),
    bloom_level || "",
    JSON.stringify(parseJson(topics)),
    JSON.stringify(parseJson(teaching_methods)),
    JSON.stringify(parseJson(assessments)),
    JSON.stringify(parseJson(references)),
    unitId
  );
  return res.json({ success: true });
}

function deleteUnit(req, res) {
  db.prepare("DELETE FROM units WHERE id = ?").run(Number(req.params.id));
  return res.json({ success: true });
}

function createCO(req, res) {
  const { course_id, co_number, description } = req.body || {};
  const info = db
    .prepare("INSERT INTO course_outcomes (course_id, co_number, description) VALUES (?, ?, ?)")
    .run(Number(course_id), Number(co_number), description || "");
  return res.status(201).json({ id: Number(info.lastInsertRowid) });
}

function updateCO(req, res) {
  const { course_id, co_number, description } = req.body || {};
  db.prepare(
    `UPDATE course_outcomes
     SET course_id = ?, co_number = ?, description = ?
     WHERE id = ?`
  ).run(Number(course_id), Number(co_number), description || "", Number(req.params.id));
  return res.json({ success: true });
}

function deleteCO(req, res) {
  db.prepare("DELETE FROM course_outcomes WHERE id = ?").run(Number(req.params.id));
  return res.json({ success: true });
}

function createCoPoMap(req, res) {
  const { co_id, po_id, level } = req.body || {};
  const info = db
    .prepare("INSERT INTO co_po_map (co_id, po_id, level) VALUES (?, ?, ?)")
    .run(Number(co_id), Number(po_id), level || "low");
  return res.status(201).json({ id: Number(info.lastInsertRowid) });
}

function updateCoPoMap(req, res) {
  const { level } = req.body || {};
  db.prepare("UPDATE co_po_map SET level = ? WHERE id = ?").run(level || "low", Number(req.params.id));
  return res.json({ success: true });
}

function deleteCoPoMap(req, res) {
  db.prepare("DELETE FROM co_po_map WHERE id = ?").run(Number(req.params.id));
  return res.json({ success: true });
}

function createResource(req, res) {
  const { course_id, type, title, link } = req.body || {};
  const info = db
    .prepare("INSERT INTO resources (course_id, type, title, link) VALUES (?, ?, ?, ?)")
    .run(Number(course_id), type || "notes", title || "", link || "#");
  return res.status(201).json({ id: Number(info.lastInsertRowid) });
}

function updateResource(req, res) {
  const id = Number(req.params.id);
  const { course_id, type, title, link } = req.body || {};
  db.prepare(
    "UPDATE resources SET course_id = ?, type = ?, title = ?, link = ? WHERE id = ?"
  ).run(Number(course_id), type || "notes", title || "", link || "#", id);
  return res.json({ success: true });
}

function deleteResource(req, res) {
  db.prepare("DELETE FROM resources WHERE id = ?").run(Number(req.params.id));
  return res.json({ success: true });
}

function createPO(req, res) {
  const { program_id, po_number, name, description } = req.body || {};
  if (!program_id || !po_number || !name || !description) {
    return res.status(400).json({ error: "program_id, po_number, name, description are required" });
  }
  const info = db
    .prepare("INSERT INTO pos (program_id, po_number, name, description) VALUES (?, ?, ?, ?)")
    .run(Number(program_id), po_number, name, description);
  return res.status(201).json({ id: Number(info.lastInsertRowid) });
}

function updatePO(req, res) {
  const id = Number(req.params.id);
  const { program_id, po_number, name, description } = req.body || {};
  if (!program_id || !po_number || !name || !description) {
    return res.status(400).json({ error: "program_id, po_number, name, description are required" });
  }
  db.prepare(
    "UPDATE pos SET program_id = ?, po_number = ?, name = ?, description = ? WHERE id = ?"
  ).run(Number(program_id), po_number, name, description, id);
  return res.json({ success: true });
}

function deletePO(req, res) {
  db.prepare("DELETE FROM pos WHERE id = ?").run(Number(req.params.id));
  return res.json({ success: true });
}

function createProgram(req, res) {
  const { name, code, total_credits } = req.body || {};
  if (!name || !code || total_credits == null) {
    return res.status(400).json({ error: "name, code and total_credits are required" });
  }
  const info = db
    .prepare("INSERT INTO programs (name, code, total_credits) VALUES (?, ?, ?)")
    .run(name, code, Number(total_credits));
  return res.status(201).json({ id: Number(info.lastInsertRowid) });
}

function updateProgram(req, res) {
  const programId = Number(req.params.id);
  const { name, code, total_credits } = req.body || {};
  if (!Number.isInteger(programId)) return res.status(400).json({ error: "Invalid program id" });
  if (!name || !code || total_credits == null) {
    return res.status(400).json({ error: "name, code and total_credits are required" });
  }
  const existing = db.prepare("SELECT id FROM programs WHERE id = ?").get(programId);
  if (!existing) return res.status(404).json({ error: "Program not found" });
  db.prepare("UPDATE programs SET name = ?, code = ?, total_credits = ? WHERE id = ?").run(
    name,
    code,
    Number(total_credits),
    programId
  );
  return res.json({ success: true });
}

function deleteProgram(req, res) {
  const programId = Number(req.params.id);
  if (!Number.isInteger(programId)) return res.status(400).json({ error: "Invalid program id" });
  const existing = db.prepare("SELECT id FROM programs WHERE id = ?").get(programId);
  if (!existing) return res.status(404).json({ error: "Program not found" });
  db.prepare("DELETE FROM courses WHERE program_id = ?").run(programId);
  db.prepare("DELETE FROM pos WHERE program_id = ?").run(programId);
  db.prepare("DELETE FROM programs WHERE id = ?").run(programId);
  return res.json({ success: true });
}

function cloneProgram(req, res) {
  const sourceId = Number(req.params.id);
  const { name, code, total_credits } = req.body || {};
  if (!Number.isInteger(sourceId)) return res.status(400).json({ error: "Invalid program id" });
  if (!name || !code || total_credits == null) {
    return res.status(400).json({ error: "name, code and total_credits are required for the new program" });
  }
  const source = db.prepare("SELECT id FROM programs WHERE id = ?").get(sourceId);
  if (!source) return res.status(404).json({ error: "Source program not found" });

  const dupCode = db.prepare("SELECT id FROM programs WHERE code = ?").get(code);
  if (dupCode) return res.status(409).json({ error: "Program code already exists" });

  const newProgramId = db.transaction(() => {
    const info = db
      .prepare("INSERT INTO programs (name, code, total_credits) VALUES (?, ?, ?)")
      .run(name, code, Number(total_credits));
    const destId = Number(info.lastInsertRowid);

    const poMap = new Map();
    const posRows = db.prepare("SELECT id, po_number, name, description FROM pos WHERE program_id = ?").all(sourceId);
    const insertPo = db.prepare(
      "INSERT INTO pos (program_id, po_number, name, description) VALUES (?, ?, ?, ?)"
    );
    for (const p of posRows) {
      const r = insertPo.run(destId, p.po_number, p.name, p.description);
      poMap.set(p.id, Number(r.lastInsertRowid));
    }

    const courseMap = new Map();
    const courseRows = db
      .prepare(
        `SELECT id, code, name, credits, ltp, semester, type, description
         FROM courses WHERE program_id = ? ORDER BY semester, code`
      )
      .all(sourceId);
    const insertCourse = db.prepare(
      `INSERT INTO courses (code, name, credits, ltp, semester, type, description, program_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const c of courseRows) {
      const r = insertCourse.run(
        c.code,
        c.name,
        c.credits,
        c.ltp,
        c.semester,
        c.type,
        c.description || "",
        destId
      );
      courseMap.set(c.id, Number(r.lastInsertRowid));
    }

    const insertUnit = db.prepare(
      `INSERT INTO units (course_id, unit_number, title, hours, bloom_level, topics, teaching_methods, assessments, references_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const unitRows = db
      .prepare(
        `SELECT u.course_id, u.unit_number, u.title, u.hours, u.bloom_level, u.topics, u.teaching_methods, u.assessments, u.references_json
         FROM units u
         INNER JOIN courses c ON c.id = u.course_id
         WHERE c.program_id = ?`
      )
      .all(sourceId);
    for (const u of unitRows) {
      const newCid = courseMap.get(u.course_id);
      if (!newCid) continue;
      insertUnit.run(
        newCid,
        u.unit_number,
        u.title,
        u.hours,
        u.bloom_level,
        u.topics,
        u.teaching_methods,
        u.assessments,
        u.references_json
      );
    }

    const insertRes = db.prepare("INSERT INTO resources (course_id, type, title, link) VALUES (?, ?, ?, ?)");
    const resRows = db
      .prepare(
        `SELECT r.course_id, r.type, r.title, r.link
         FROM resources r
         INNER JOIN courses c ON c.id = r.course_id
         WHERE c.program_id = ?`
      )
      .all(sourceId);
    for (const r of resRows) {
      const newCid = courseMap.get(r.course_id);
      if (!newCid) continue;
      insertRes.run(newCid, r.type, r.title, r.link);
    }

    const coMap = new Map();
    const coRows = db
      .prepare(
        `SELECT co.id, co.course_id, co.co_number, co.description
         FROM course_outcomes co
         INNER JOIN courses c ON c.id = co.course_id
         WHERE c.program_id = ?
         ORDER BY co.id`
      )
      .all(sourceId);
    const insertCo = db.prepare("INSERT INTO course_outcomes (course_id, co_number, description) VALUES (?, ?, ?)");
    for (const co of coRows) {
      const newCid = courseMap.get(co.course_id);
      if (!newCid) continue;
      const r = insertCo.run(newCid, co.co_number, co.description);
      coMap.set(co.id, Number(r.lastInsertRowid));
    }

    const mapRows = db
      .prepare(
        `SELECT com.co_id, com.po_id, com.level
         FROM co_po_map com
         INNER JOIN course_outcomes co ON co.id = com.co_id
         INNER JOIN courses c ON c.id = co.course_id
         WHERE c.program_id = ?`
      )
      .all(sourceId);
    const insertMap = db.prepare("INSERT INTO co_po_map (co_id, po_id, level) VALUES (?, ?, ?)");
    for (const m of mapRows) {
      const newCo = coMap.get(m.co_id);
      const newPo = poMap.get(m.po_id);
      if (newCo && newPo) insertMap.run(newCo, newPo, m.level);
    }

    return destId;
  })();

  return res.status(201).json({ id: newProgramId });
}

module.exports = {
  createCourse,
  updateCourse,
  deleteCourse,
  createUnit,
  updateUnit,
  deleteUnit,
  createCO,
  updateCO,
  deleteCO,
  createCoPoMap,
  updateCoPoMap,
  deleteCoPoMap,
  createResource,
  updateResource,
  deleteResource,
  createPO,
  updatePO,
  deletePO,
  createProgram,
  updateProgram,
  deleteProgram,
  cloneProgram,
};
