import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

const reservationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  phone: z.string().optional(),
  topic: z.string().optional(),
  message: z.string().optional(),
  date: z.iso.datetime(),
  time: z.string().min(1),
  consent: z.boolean(),
});

export const createReservation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = reservationSchema.safeParse(req.body);

  if (!result.success) {
    res
      .status(400)
      .json({ error: "Invalid data", details: result.error.issues });
    return;
  }

  try {
    const reservation = await prisma.reservation.create({
      data: {
        ...result.data,
        date: new Date(result.data.date),
      },
    });
    res.status(201).json({ success: true, id: reservation.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
