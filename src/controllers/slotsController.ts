import { Request, Response } from "express";
import { getAvailableSlots } from "../lib/googleCalendar";
import { z } from "zod";

const querySchema = z.object({
  date: z.iso.date(),
});

export const getSlots = async (req: Request, res: Response): Promise<void> => {
  const result = querySchema.safeParse(req.query);

  if (!result.success) {
    res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    return;
  }

  try {
    const slots = await getAvailableSlots(result.data.date);
    res.json({ slots });
  } catch (error) {
    console.error("ERROR in getSlots:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
