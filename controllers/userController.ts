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
    // Password semantics:
    // - If password is explicitly null or undefined or empty string => do NOT change existing password.
    // - If provided as a non-empty string => hash and update.
    if (Object.prototype.hasOwnProperty.call(req.body, "password")) {
      const pw = req.body.password;
      if (pw === null || pw === undefined || (typeof pw === "string" && pw.trim() === "")) {
        delete req.body.password; // preserve existing password
      } else if (typeof pw === "string") {
        req.body.password = await bcrypt.hash(pw, 10);
      } else {
        // Non-string password types are invalid
        return res.status(400).json({ message: "Invalid email or password" });
      }
    }
    // Defensive: if mapAddress sneaks through very long, trim to a reasonable cap (e.g., 2048)
    if (typeof req.body.mapAddress === "string" && req.body.mapAddress.length > 2048) {
      req.body.mapAddress = req.body.mapAddress.slice(0, 2048);
    }
    let updated: any;
    try {
      const [, [row]] = await User.update(req.body, {
        where: { userId: req.params.id },
        returning: true,
      });
      updated = row;
    } catch (e: any) {
      const code = e?.parent?.code || e?.code;
      // If DB column is still VARCHAR(255), gracefully truncate and retry once
      if (code === "22001" && typeof req.body.mapAddress === "string") {
        req.body.mapAddress = req.body.mapAddress.slice(0, 255);
        const [, [row2]] = await User.update(req.body, {
          where: { userId: req.params.id },
          returning: true,
        });
        updated = row2;
      } else {
        throw e;
      }
    }
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

export default { createUser, getUser, getUserById, updateUser, deleteUser, updateUserImage };
