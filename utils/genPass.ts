import bcrypt from "bcrypt";

export const generatePassword = async (plain: string) => {
  const saltRounds = parseInt(process.env.BCRYPT_SALT || "10", 10) || 10;
  const hash = await bcrypt.hash(plain, saltRounds);
  return hash;
};

export const comparePassword = async (plain: string, hash: string) => {
  return bcrypt.compare(plain, hash);
};

export default generatePassword;
