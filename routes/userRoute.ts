import Route from "express";
import {
	createUser,
	getUser,
	getUserById,
	updateUser,
	deleteUser,
} from "../controllers/userController";

const router = Route.Router();

router.post("/", createUser);
router.get("/", getUser);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
