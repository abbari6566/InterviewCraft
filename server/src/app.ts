import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { env } from "./config/env";

const app = express();
const allowedOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
  }),
);
app.use(express.json());
app.use("/api", routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
