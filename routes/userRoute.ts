import { Router } from "express";
import { securityChecker } from "../middleware/middleware";
import {
	createUser,
	getUser,
	getUserById,
	updateUser,
	deleteUser,
	updateUserImage,
} from "../controllers/userController";
import upload from "../middleware/multerUpload";

const router = Router();

router.post("/", createUser);
router.get("/", getUser);
router.get("/:id", getUserById);
router.put("/:id", securityChecker, updateUser);
router.patch("/:id", securityChecker, updateUser);
router.delete("/:id", deleteUser);
router.put("/:id/image", securityChecker, upload.single("image"), updateUserImage);

export default router;
