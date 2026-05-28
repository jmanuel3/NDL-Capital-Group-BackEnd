import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: "v3", auth: oauth2Client });
const calendarId = process.env.GOOGLE_CALENDAR_ID as string;

const ALL_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
];

const SLOT_DURATION_MINUTES = 30;

export async function getAvailableSlots(dateString: string): Promise<string[]> {
  const date = new Date(dateString);
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const response = await calendar.events.list({
    calendarId,
    timeMin: dayStart.toISOString(),
    timeMax: dayEnd.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  const busySlots = new Set<string>();

  response.data.items?.forEach((event) => {
    if (!event.start?.dateTime) return;
    const eventStart = new Date(event.start.dateTime);
    const hours = String(eventStart.getHours()).padStart(2, "0");
    const minutes = String(eventStart.getMinutes()).padStart(2, "0");
    busySlots.add(`${hours}:${minutes}`);
  });

  const now = new Date();
  const madridNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Madrid" }),
  );
  const todayMadrid = `${madridNow.getFullYear()}-${String(madridNow.getMonth() + 1).padStart(2, "0")}-${String(madridNow.getDate()).padStart(2, "0")}`;
  const isToday = dateString === todayMadrid;

  return ALL_SLOTS.filter((slot) => {
    if (busySlots.has(slot)) return false;
    if (isToday) {
      const [slotHours, slotMinutes] = slot.split(":").map(Number);
      const slotTime = slotHours * 60 + slotMinutes;
      const nowTime = madridNow.getHours() * 60 + madridNow.getMinutes();
      return slotTime > nowTime;
    }
    return true;
  });
}

interface CreateEventParams {
  firstName: string;
  lastName: string;
  email: string;
  date: string;
  time: string;
  topic?: string;
  message?: string;
}

function addMinutes(time: string, minutesToAdd: number): string {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`;
}

export async function createReservationEvent(
  params: CreateEventParams,
): Promise<string> {
  const { firstName, lastName, email, date, time, topic, message } = params;

  const endTime = addMinutes(time, SLOT_DURATION_MINUTES);
  const startDateTimeStr = `${date}T${time}:00`;
  const endDateTimeStr = `${date}T${endTime}:00`;

  const response = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: 1,
    requestBody: {
      summary: `NDL Capital Call — ${firstName} ${lastName}`,
      description: `Topic: ${topic || "Not specified"}\n\nMessage: ${message || "None"}\n\nClient email: ${email}`,
      start: {
        dateTime: startDateTimeStr,
        timeZone: "Europe/Madrid",
      },
      end: {
        dateTime: endDateTimeStr,
        timeZone: "Europe/Madrid",
      },
      attendees: [{ email }],
      conferenceData: {
        createRequest: {
          requestId: `ndl-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });

  return response.data.hangoutLink || "";
}
