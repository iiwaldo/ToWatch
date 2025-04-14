import express from "express";
import userController from "../controllers/userController.js";

const router = express.Router();

router.post("/watch-later", userController.addWatchLater);
router.get("/watch-later", userController.getWatchLater);
router.delete("/watch-later", userController.deleteWatchLater);

router.post("/watched", userController.addWatched);
router.get("/watched", userController.getWatched);
router.delete("/watched", userController.deleteWatched);
router.get("/status", userController.getStatus);

export default router;
