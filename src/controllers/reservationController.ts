import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";
import resend from "../lib/resend";

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

    await resend.emails.send({
      from: "NDL Capital <onboarding@resend.dev>",
      to: result.data.email,
      subject: "Your call is booked — NDL Capital Group",
      html: `
        <h2>Hi ${result.data.firstName},</h2>
        <p>Your call has been scheduled for ${result.data.date} at ${result.data.time}.</p>
        <p>We will send you a Google Meet link shortly.</p>
        <p>Best regards,<br/>NDL Capital Group</p>
      `,
    });

    res.status(201).json({ success: true, id: reservation.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
