import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "devsecret";

export const sign = (payload) => jwt.sign(payload, SECRET, { expiresIn: "7d" });

export const verify = (token) => {
    try {
        return jwt.verify(token, SECRET);
    } catch {
        return null;
    }
};
