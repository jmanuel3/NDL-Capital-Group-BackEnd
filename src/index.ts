import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import contactRouter from "./routes/contact";
import reservationRouter from "./routes/reservation";

const app = express();
const PORT = parseInt(process.env.PORT || "10000", 10);

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:4321",
    methods: ["GET", "POST"],
  }),
);
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

app.use("/api/contact", contactRouter);
app.use("/api/reservation", reservationRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const server = app.listen(PORT, "0.0.0.0", () => {
  });

server.on("error", (err) => {

});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

process.on("exit", (code) => {
});
