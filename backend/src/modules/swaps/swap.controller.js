import { prisma } from "../../lib/prisma.js";

export async function listOthersSwappable(req, res, next) {
  try {
    const slots = await prisma.event.findMany({
      where: {
        status: "SWAPPABLE",
        NOT: { userId: req.user.userId },
      },
      include: { owner: { select: { id: true, name: true, email: true } } },
      orderBy: { startTime: "asc" },
    });
    res.json(slots);
  } catch (error) {
    next(error);
  }
}

export async function requestSwap(req, res, next) {
  try {
    const { mySlotId, theirSlotId } = req.body;
    
    const mySlot = await prisma.event.findFirst({
      where: { id: mySlotId, userId: req.user.userId, status: "SWAPPABLE" },
    });
    
    const theirSlot = await prisma.event.findFirst({
      where: { id: theirSlotId, status: "SWAPPABLE", NOT: { userId: req.user.userId } },
    });
    
    if (!mySlot || !theirSlot) {
      return res.status(400).json({ error: "Both slots must be swappable" });
    }
    
    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.swapRequest.create({
        data: {
          mySlotId,
          theirSlotId,
          requesterId: req.user.userId,
          recipientId: theirSlot.userId,
        },
      });
      
      await tx.event.update({ where: { id: mySlotId }, data: { status: "SWAP_PENDING" } });
      await tx.event.update({ where: { id: theirSlotId }, data: { status: "SWAP_PENDING" } });
      
      return request;
    });
    
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function respondSwap(req, res, next) {
  try {
    const { requestId } = req.params;
    const { accepted } = req.body;
    
    const request = await prisma.swapRequest.findUnique({
      where: { id: requestId },
      include: { mySlot: true, theirSlot: true },
    });
    
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    
    if (request.recipientId !== req.user.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    if (request.status !== "PENDING") {
      return res.status(400).json({ error: "Request already handled" });
    }
    
    if (!accepted) {
      const result = await prisma.$transaction(async (tx) => {
        await tx.swapRequest.update({ where: { id: requestId }, data: { status: "REJECTED" } });
        await tx.event.update({ where: { id: request.mySlotId }, data: { status: "SWAPPABLE" } });
        await tx.event.update({ where: { id: request.theirSlotId }, data: { status: "SWAPPABLE" } });
      });
      return res.json({ message: "Swap rejected" });
    }
    
    const result = await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id: request.mySlotId },
        data: { userId: request.recipientId, status: "BUSY" },
      });
      await tx.event.update({
        where: { id: request.theirSlotId },
        data: { userId: request.requesterId, status: "BUSY" },
      });
      await tx.swapRequest.update({ where: { id: requestId }, data: { status: "ACCEPTED" } });
    });
    
    res.json({ message: "Swap accepted" });
  } catch (error) {
    next(error);
  }
}

export async function getRequests(req, res, next) {
  try {
    const incoming = await prisma.swapRequest.findMany({
      where: { recipientId: req.user.userId },
      include: {
        mySlot: true,
        theirSlot: true,
        requester: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    
    const outgoing = await prisma.swapRequest.findMany({
      where: { requesterId: req.user.userId },
      include: {
        mySlot: true,
        theirSlot: true,
        recipient: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    
    res.json({ incoming, outgoing });
  } catch (error) {
    next(error);
  }
}
