import { Request, Response } from "express";
import User from "../database/models/userModel";
import bcrypt from "bcryptjs";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { password, ...rest } = req.body;
    if (!password) return res.status(400).json({ message: "password required" });
    const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ ...rest, password: hashed });
  const u = user.toJSON();
  delete (u as any).password;
  return res.status(201).json({ user: u });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ["password"] } });
    return res.json({ users });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ["password"] } });
    if (!user) return res.status(404).json({ message: "not found" });
    return res.json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user || {};
    const isAdmin = auth?.role === "admin" || auth?.role === "superadmin";
    const isSelf = auth?.id === req.params.id || auth?.userId === req.params.id;
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: "forbidden" });
    }
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }
  const [, [updated]] = await User.update(req.body, { where: { userId: req.params.id }, returning: true });
    if (!updated) return res.status(404).json({ message: "not found" });
    const u = updated.toJSON();
    delete u.password;
    return res.json({ user: u });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
  const count = await User.destroy({ where: { userId: req.params.id } });
    if (!count) return res.status(404).json({ message: "not found" });
    return res.json({ message: "deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export const updateUserImage = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user || {};
    const isAdmin = auth?.role === "admin" || auth?.role === "superadmin";
    const isSelf = auth?.id === req.params.id || auth?.userId === req.params.id;
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: "forbidden" });
    }
    const file: any = (req as any).file;
    if (!file || !file.path) {
      return res.status(400).json({ message: "image file required" });
    }
    const imageUrl: string = file.path;
    const [, [updated]] = await User.update(
      { imageUrl },
      { where: { userId: req.params.id }, returning: true }
    );
    if (!updated) return res.status(404).json({ message: "not found" });
    const u = updated.toJSON();
    delete (u as any).password;
    return res.json({ user: u });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export default { createUser, getUser, getUserById, updateUser, deleteUser };
