const { db } = require("../config/db");

function getAllCourses() {
  return db
    .prepare(
      `SELECT id, code, name, credits, ltp, semester, type, description, program_id
       FROM courses
       ORDER BY semester, code`
    )
    .all();
}

function getCourseById(courseId) {
  return db
    .prepare(
      `SELECT id, code, name, credits, ltp, semester, type, description
      , program_id
       FROM courses
       WHERE id = ?`
    )
    .get(courseId);
}

function getCourseByCode(code) {
  return db
    .prepare(
      `SELECT id, code, name, credits, ltp, semester, type, description
      , program_id
       FROM courses
       WHERE code = ?`
    )
    .get(code);
}

function getUnitsByCourseId(courseId) {
  return db
    .prepare(
      `SELECT
         id, course_id, unit_number, title, hours, bloom_level,
         topics, teaching_methods, assessments, references_json
       FROM units
       WHERE course_id = ?
       ORDER BY unit_number`
    )
    .all(courseId);
}

function getCoPoMapByCourseId(courseId) {
  return db
    .prepare(
      `SELECT
         com.id,
         co.id AS co_id,
         co.co_number,
         co.description AS co_description,
         po.id AS po_id,
         po.po_number,
         po.name AS po_name,
         com.level
       FROM co_po_map com
       INNER JOIN course_outcomes co ON co.id = com.co_id
       INNER JOIN pos po ON po.id = com.po_id
       WHERE co.course_id = ?
       ORDER BY co.co_number, po.po_number`
    )
    .all(courseId);
}

function getCOsByCourseId(courseId) {
  return db
    .prepare(
      `SELECT id, course_id, co_number, description
       FROM course_outcomes
       WHERE course_id = ?
       ORDER BY co_number`
    )
    .all(courseId);
}

function getResourcesByCourseId(courseId) {
  return db
    .prepare(
      `SELECT id, course_id, type, title, link
       FROM resources
       WHERE course_id = ?
       ORDER BY id`
    )
    .all(courseId);
}

module.exports = {
  getAllCourses,
  getCourseById,
  getCourseByCode,
  getUnitsByCourseId,
  getCoPoMapByCourseId,
  getCOsByCourseId,
  getResourcesByCourseId,
};
