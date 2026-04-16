const programModel = require("../models/programModel");

function getPrograms(req, res) {
  return res.json(programModel.getAllPrograms());
}

function getProgramById(req, res) {
  const programId = Number(req.params.id);
  if (!Number.isInteger(programId)) return res.status(400).json({ error: "Invalid program id" });
  const program = programModel.getProgramById(programId);
  if (!program) return res.status(404).json({ error: "Program not found" });
  return res.json(program);
}

function getProgramCourses(req, res) {
  const programId = Number(req.params.id);
  if (!Number.isInteger(programId)) return res.status(400).json({ error: "Invalid program id" });
  const program = programModel.getProgramById(programId);
  if (!program) return res.status(404).json({ error: "Program not found" });
  return res.json(programModel.getCoursesByProgramId(programId));
}

function getProgramPOs(req, res) {
  const programId = Number(req.params.id);
  if (!Number.isInteger(programId)) return res.status(400).json({ error: "Invalid program id" });
  const program = programModel.getProgramById(programId);
  if (!program) return res.status(404).json({ error: "Program not found" });
  return res.json(programModel.getPOsByProgramId(programId));
}

module.exports = { getPrograms, getProgramById, getProgramCourses, getProgramPOs };
