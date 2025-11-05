import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { sign } from "../../lib/jwt.js";

export async function signup(req, res, next) {
    try {
        const { name, email, password } = req.body;
        
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) {
            return res.status(400).json({ error: "Email already registered" });
        }
        
        const hash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { name, email, password: hash },
        });
        
        const token = sign({ userId: user.id, email: user.email });
        res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        next(error);
    }
}

export async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        
        const token = sign({ userId: user.id, email: user.email });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        next(error);
    }
}
