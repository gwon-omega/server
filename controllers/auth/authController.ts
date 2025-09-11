import { Request, Response } from "express";
import User from "../../database/models/userModel";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "yo_mero_secret_key_ho";

export const register = async (req: Request, res: Response) => {
	try {
		const { email, password, phoneNumber } = req.body;
		if (!email || !password || !phoneNumber) {
			return res.status(400).json({ message: "Missing required fields" });
		}

		const existing = await User.findOne({ where: { email } });
		if (existing) return res.status(409).json({ message: "Email already in use" });

		const hashed = await bcrypt.hash(password, 10);
		const user = await User.create({ email, password: hashed, phoneNumber });
		const u: any = user; // relaxed typing for sequelize model instance
		const token = jwt.sign({ id: u.userId, email: u.email }, JWT_SECRET, { expiresIn: "7d" });
		return res.status(201).json({ message: "registered", user: { id: u.userId, email: u.email }, token });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "server error" });
	}
};

export const login = async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) return res.status(400).json({ message: "Missing credentials" });

		const user = await User.findOne({ where: { email } });
		if (!user) return res.status(401).json({ message: "Invalid credentials" });

		const u: any = user;
		const ok = await bcrypt.compare(password, u.password);
		if (!ok) return res.status(401).json({ message: "Invalid credentials" });
		const token = jwt.sign({ id: u.userId, email: u.email }, JWT_SECRET, { expiresIn: "7d" });
		return res.json({ message: "ok", token, user: { id: u.userId, email: u.email } });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "server error" });
	}
};

export const logout = async (req: Request, res: Response) => {
	try {
		const auth = req.headers.authorization;
		if (!auth) return res.status(401).json({ message: "No token" });
		const token = auth.replace("Bearer ", "");
		jwt.verify(token, JWT_SECRET);
		return res.json({ message: "Logged out" });
	} catch (error) {
		console.error(error);
		return res.status(401).json({ message: "Invalid token" });
	}
};

export const profile = async (req: Request, res: Response) => {
	try {
		const auth = req.headers.authorization;
		if (!auth) return res.status(401).json({ message: "No token" });
		const token = auth.replace("Bearer ", "");
		const payload: any = jwt.verify(token, JWT_SECRET);
		const user = await User.findByPk(payload.id, { attributes: { exclude: ["password"] } });
		if (!user) return res.status(404).json({ message: "User not found" });
		return res.json({ user });
	} catch (error) {
		console.error(error);
		return res.status(401).json({ message: "Invalid token" });
	}
};

export default { register, login, profile, logout };

