const express = require("express");
const controller = require("../controllers/courseController");
const programController = require("../controllers/programController");

const router = express.Router();

router.get("/courses", controller.getCourses);
router.get("/courses/:id", controller.getCourseById);
router.get("/courses/:id/units", controller.getUnitsByCourseId);
router.get("/courses/:id/copomap", controller.getCoPoMapByCourseId);
router.get("/courses/:id/cos", controller.getCOsByCourseId);
router.get("/courses/:id/resources", controller.getResourcesByCourseId);
router.get("/programs", programController.getPrograms);
router.get("/programs/:id", programController.getProgramById);
router.get("/programs/:id/courses", programController.getProgramCourses);
router.get("/programs/:id/pos", programController.getProgramPOs);

module.exports = router;
