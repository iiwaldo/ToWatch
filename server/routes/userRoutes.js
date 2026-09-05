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

router.post("/watch-later/groups", userController.createWatchLaterGroup);

router.get("/watch-later/groups", userController.getWatchLaterGroups);

router.delete("/watch-later/groups", userController.deleteWatchLaterGroup);
router.put("/profile-picture", userController.updateProfilePicture);
export default router;
