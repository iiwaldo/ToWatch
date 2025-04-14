import express from "express";
import authController from "../controllers/authController.js";
const router = express.Router();

router.post("/verify-token", authController.verifyToken);
router.post("/signup", authController.signUp);
router.post("/login", authController.logIn);
export default router;
