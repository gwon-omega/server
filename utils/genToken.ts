import jwt from "jsonwebtoken";

export const genToken = (payload: object, expiresIn = process.env.JWT_EXPIRES_IN || "15d") => {
  const secret = process.env.JWT_SECRET || "secret";
  return jwt.sign(payload, secret, { expiresIn });
};

export default genToken;
