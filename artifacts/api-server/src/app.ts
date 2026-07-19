import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, "../uploads");

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded CVs/files
app.use("/uploads", express.static(UPLOADS_DIR));

// API routes always take priority.
app.use("/api", router);

// In production, serve the built React frontend and handle SPA routing.
if (process.env.NODE_ENV === "production") {
  const staticDir =
    process.env.STATIC_DIR ??
    path.resolve(process.cwd(), "artifacts/bluestar/dist/public");

  app.use(express.static(staticDir));

  // Explicit JSON 404 for any unmatched /api/* path — prevents the SPA
  // catch-all below from returning index.html for unknown API routes.
  app.use("/api", (_req: Request, res: Response) => {
    res.status(404).json({ error: "Not found" });
  });

  // SPA catch-all: every other path returns index.html so the React
  // router can handle client-side navigation.
  // app.use() without a path is the Express 5–compatible wildcard.
  app.use((_req: Request, res: Response) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;
