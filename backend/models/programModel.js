const { db } = require("../config/db");

function getAllPrograms() {
  return db.prepare("SELECT id, name, code, total_credits FROM programs ORDER BY name").all();
}

function getProgramById(programId) {
  return db
    .prepare("SELECT id, name, code, total_credits FROM programs WHERE id = ?")
    .get(programId);
}

function getCoursesByProgramId(programId) {
  return db
    .prepare(
      `SELECT id, code, name, credits, ltp, semester, type, description, program_id
       FROM courses
       WHERE program_id = ?
       ORDER BY semester, code`
    )
    .all(programId);
}

function getPOsByProgramId(programId) {
  return db
    .prepare(
      `SELECT id, po_number, name, description, program_id
       FROM pos
       WHERE program_id = ?
       ORDER BY po_number`
    )
    .all(programId);
}

module.exports = {
  getAllPrograms,
  getProgramById,
  getCoursesByProgramId,
  getPOsByProgramId,
};
