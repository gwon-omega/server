import { Request, Response } from "express";
import User from "../database/models/userModel";
import bcrypt from "bcryptjs";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { password, ...rest } = req.body;
    if (!password) return res.status(400).json({ message: "password required" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ ...rest, password: hashed });
    // hide password
    const u = user.toJSON();
    delete u.password;
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
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }
    const [, [updated]] = await User.update(req.body, { where: { id: req.params.id }, returning: true });
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
    const count = await User.destroy({ where: { id: req.params.id } });
    if (!count) return res.status(404).json({ message: "not found" });
    return res.json({ message: "deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export default { createUser, getUser, getUserById, updateUser, deleteUser };
