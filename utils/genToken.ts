import jwt from "jsonwebtoken";

export const genToken = (payload: object, expiresIn = "7d") => {
  const secret = process.env.JWT_SECRET || "secret";
  return jwt.sign(payload, secret, { expiresIn });
};

export default genToken;
