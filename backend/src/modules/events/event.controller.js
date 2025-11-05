import { prisma } from "../../lib/prisma.js";

export async function listMine(req, res, next) {
    try {
        const events = await prisma.event.findMany({
            where: { userId: req.user.userId },
            orderBy: { startTime: "asc" },
        });
        res.json(events);
    } catch (error) {
        next(error);
    }
}

export async function create(req, res, next) {
    try {
        const { title, startTime, endTime, status = "BUSY" } = req.body;
        const event = await prisma.event.create({
            data: {
                title,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                status,
                userId: req.user.userId,
            },
        });
        res.status(201).json(event);
    } catch (error) {
        next(error);
    }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const own = await prisma.event.findFirst({
      where: { id, userId: req.user.userId },
    });
    
    if (!own) {
      return res.status(404).json({ error: "Event not found or not authorized" });
    }
    
    const event = await prisma.event.update({
      where: { id },
      data: req.body,
    });
    res.json(event);
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const own = await prisma.event.findFirst({
      where: { id, userId: req.user.userId },
    });
    
    if (!own) {
      return res.status(404).json({ error: "Event not found or not authorized" });
    }
    
    await prisma.event.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
