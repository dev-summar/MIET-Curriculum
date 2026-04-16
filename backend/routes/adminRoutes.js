const express = require("express");
const controller = require("../controllers/adminController");
const { isAuthenticated, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(isAuthenticated, isAdmin);

router.post("/courses", controller.createCourse);
router.put("/courses/:id", controller.updateCourse);
router.delete("/courses/:id", controller.deleteCourse);

router.post("/units", controller.createUnit);
router.put("/units/:id", controller.updateUnit);
router.delete("/units/:id", controller.deleteUnit);

router.post("/cos", controller.createCO);
router.put("/cos/:id", controller.updateCO);
router.delete("/cos/:id", controller.deleteCO);

router.post("/copomap", controller.createCoPoMap);
router.put("/copomap/:id", controller.updateCoPoMap);
router.delete("/copomap/:id", controller.deleteCoPoMap);

router.post("/resources", controller.createResource);
router.put("/resources/:id", controller.updateResource);
router.delete("/resources/:id", controller.deleteResource);

router.post("/pos", controller.createPO);
router.put("/pos/:id", controller.updatePO);
router.delete("/pos/:id", controller.deletePO);
router.post("/programs", controller.createProgram);
router.put("/programs/:id", controller.updateProgram);
router.delete("/programs/:id", controller.deleteProgram);
router.post("/programs/:id/clone", controller.cloneProgram);

module.exports = router;
