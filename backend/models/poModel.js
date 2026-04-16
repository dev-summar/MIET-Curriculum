const { db } = require("../config/db");

function getAllPOs() {
  return db
    .prepare(
      `SELECT id, po_number, name, description, program_id
       FROM pos
       ORDER BY po_number`
    )
    .all();
}

module.exports = { getAllPOs };
