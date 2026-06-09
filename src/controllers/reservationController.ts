import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";
import transporter from "../lib/nodemailer";
import { createReservationEvent } from "../lib/googleCalendar";

const reservationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  phone: z.string().min(1),
  topic: z.string().min(1),
  message: z.string().optional(),
  date: z.iso.date(),
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

    const meetLink = await createReservationEvent({
      firstName: result.data.firstName,
      lastName: result.data.lastName,
      email: result.data.email,
      date: result.data.date,
      time: result.data.time,
      topic: result.data.topic,
      message: result.data.message,
    });

    await transporter.sendMail({
      from: '"NDL Capital Group" <info@ndlcapitalgroup.com>',
      to: result.data.email,
      subject: "Your call is booked — NDL Capital Group",
      html: `
        <h2>Hi ${result.data.firstName},</h2>
        <p>Your call has been scheduled for ${new Date(result.data.date).toLocaleDateString("en-GB")} at ${result.data.time}.</p>
        <p><strong>Google Meet link:</strong> <a href="${meetLink}">${meetLink}</a></p>
        <p>Best regards,<br/>NDL Capital Group</p>
      `,
    });

    await transporter.sendMail({
      from: '"NDL Capital Group" <info@ndlcapitalgroup.com>',
      to: "info@ndlcapitalgroup.com",
      subject: "New reservation — NDL Capital Group",
      html: `
        <h2>New reservation from ${result.data.firstName} ${result.data.lastName}</h2>
        <p><strong>Email:</strong> ${result.data.email}</p>
        <p><strong>Phone:</strong> ${result.data.phone}</p>
        <p><strong>Topic:</strong> ${result.data.topic}</p>
        <p><strong>Date:</strong> ${new Date(result.data.date).toLocaleDateString("en-GB")}</p>
        <p><strong>Time:</strong> ${result.data.time}</p>
        <p><strong>Message:</strong> ${result.data.message || "—"}</p>
        <p><strong>Google Meet link:</strong> <a href="${meetLink}">${meetLink}</a></p>
      `,
    });

    res.status(201).json({ success: true, id: reservation.id, meetLink });
  } catch (error) {
    console.error("ERROR in createReservation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
