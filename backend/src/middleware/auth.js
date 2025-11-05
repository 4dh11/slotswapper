import { verify } from "../lib/jwt.js";

export function auth(req, res, next) {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    
    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }
    
    const decoded = verify(token);
    if (!decoded) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
    
    req.user = decoded;
    next();
}
