import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";
import resend from "../lib/resend";
import { escapeHtml } from "../lib/escapeHtml";
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

    const firstName = escapeHtml(result.data.firstName);
    const lastName = escapeHtml(result.data.lastName);
    const email = escapeHtml(result.data.email);
    const phone = escapeHtml(result.data.phone);
    const topic = escapeHtml(result.data.topic);
    const message = escapeHtml(result.data.message);
    const time = escapeHtml(result.data.time);
    const formattedDate = new Date(result.data.date).toLocaleDateString(
      "en-GB",
    );

    const { error: userEmailError } = await resend.emails.send({
      from: '"NDL Capital Group" <info@ndlcapitalgroup.com>',
      to: result.data.email,
      subject: "Your call is booked — NDL Capital Group",
      html: `
        <h2>Hi ${firstName},</h2>
        <p>Your call has been scheduled for ${formattedDate} at ${time}.</p>
        <p><strong>Google Meet link:</strong> <a href="${meetLink}">${meetLink}</a></p>
        <p>Best regards,<br/>NDL Capital Group</p>
      `,
    });
    if (userEmailError) {
      console.error("Resend reservation user email error:", userEmailError);
    }

    const { error: internalEmailError } = await resend.emails.send({
      from: '"NDL Capital Group" <info@ndlcapitalgroup.com>',
      to: "ndlcapitalgroup@gmail.com",
      replyTo: result.data.email,
      subject: "New reservation — NDL Capital Group",
      html: `
        <h2>New reservation from ${firstName} ${lastName}</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Topic:</strong> ${topic}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Message:</strong> ${message || "—"}</p>
        <p><strong>Google Meet link:</strong> <a href="${meetLink}">${meetLink}</a></p>
      `,
    });
    if (internalEmailError) {
      console.error(
        "Resend reservation internal email error:",
        internalEmailError,
      );
    }

    res.status(201).json({ success: true, id: reservation.id, meetLink });
  } catch (error) {
    console.error("ERROR in createReservation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
