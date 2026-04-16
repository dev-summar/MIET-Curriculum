const courseModel = require("../models/courseModel");
const poModel = require("../models/poModel");
const programModel = require("../models/programModel");

function parseJsonField(value, fallback = []) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
}

function getCourses(req, res) {
  const courses = courseModel.getAllCourses();
  const pos = poModel.getAllPOs();
  const programs = programModel.getAllPrograms();
  res.json({ courses, pos, programs });
}

function getCourseById(req, res) {
  const courseId = Number(req.params.id);
  if (!Number.isInteger(courseId)) {
    return res.status(400).json({ error: "Invalid course id" });
  }
  const course = courseModel.getCourseById(courseId);
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }
  return res.json(course);
}

function getUnitsByCourseId(req, res) {
  const courseId = Number(req.params.id);
  if (!Number.isInteger(courseId)) {
    return res.status(400).json({ error: "Invalid course id" });
  }
  const course = courseModel.getCourseById(courseId);
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }
  const units = courseModel.getUnitsByCourseId(courseId).map((unit) => ({
    ...unit,
    topics: parseJsonField(unit.topics),
    teaching_methods: parseJsonField(unit.teaching_methods),
    assessments: parseJsonField(unit.assessments),
    references: parseJsonField(unit.references_json),
  }));
  return res.json(units);
}

function getCoPoMapByCourseId(req, res) {
  const courseId = Number(req.params.id);
  if (!Number.isInteger(courseId)) {
    return res.status(400).json({ error: "Invalid course id" });
  }
  const course = courseModel.getCourseById(courseId);
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }
  return res.json(courseModel.getCoPoMapByCourseId(courseId));
}

function getCOsByCourseId(req, res) {
  const courseId = Number(req.params.id);
  if (!Number.isInteger(courseId)) {
    return res.status(400).json({ error: "Invalid course id" });
  }
  const course = courseModel.getCourseById(courseId);
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }
  return res.json(courseModel.getCOsByCourseId(courseId));
}

function getResourcesByCourseId(req, res) {
  const courseId = Number(req.params.id);
  if (!Number.isInteger(courseId)) {
    return res.status(400).json({ error: "Invalid course id" });
  }
  const course = courseModel.getCourseById(courseId);
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }
  return res.json(courseModel.getResourcesByCourseId(courseId));
}

module.exports = {
  getCourses,
  getCourseById,
  getUnitsByCourseId,
  getCoPoMapByCourseId,
  getCOsByCourseId,
  getResourcesByCourseId,
};
