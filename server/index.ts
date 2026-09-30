import * as Sentry from "@sentry/node";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcrypt";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { storage } from "./storage";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { startPriceCron } from "./cron";
import { logger, logError } from "./logger";
import { createServer } from "http";
import type { User } from "@shared/schema";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: 0.2,
  });
  logger.info("Sentry initialized");
}

const PgSession = ConnectPgSimple(session);

const app = express();
const httpServer = createServer(app);

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      name: string | null;
      homeAirport: string | null;
      homeAirportLabel: string | null;
      googleId: string | null;
      createdAt: string;
    }
  }
}

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Trust the first proxy (Replit's HTTPS edge) so secure cookies work correctly in production
app.set("trust proxy", 1);

// Session middleware
app.use(
  session({
    store: new PgSession({ pool, tableName: "user_sessions", createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || "himal-to-horizon-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Local strategy (email + password)
passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) return done(null, false, { message: "No account found with that email." });
      if (!user.passwordHash) return done(null, false, { message: "This account uses Google login." });
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return done(null, false, { message: "Incorrect password." });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// Google OAuth strategy (only if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  let callbackURL: string;
  if (process.env.OAUTH_CALLBACK_URL) {
    // Explicit override — works on any host (Vercel, Railway, Render, Replit, etc.)
    callbackURL = process.env.OAUTH_CALLBACK_URL;
  } else if (process.env.NODE_ENV === "production") {
    callbackURL = `${process.env.APP_URL || "https://himaltohorizon.com"}/api/auth/google/callback`;
  } else if (process.env.REPLIT_DOMAINS) {
    // In Replit dev environment use the public dev domain (HTTPS required by Google)
    callbackURL = `https://${process.env.REPLIT_DOMAINS}/api/auth/google/callback`;
  } else {
    callbackURL = `http://localhost:${process.env.PORT || 5000}/api/auth/google/callback`;
  }
  console.log(`[google-oauth] Callback URL: ${callbackURL}`);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("No email in Google profile"));

          let user = await storage.getUserByGoogleId(profile.id);
          if (!user) {
            user = await storage.getUserByEmail(email);
            if (user) {
              await storage.updateUser(user.id, { googleId: profile.id } as any);
              user = await storage.getUserById(user.id) as User;
            } else {
              user = await storage.createUser({
                email,
                name: profile.displayName || null,
                googleId: profile.id,
              });
            }
          }
          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
}

passport.serializeUser((user, done) => {
  done(null, (user as User).id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUserById(id);
    done(null, user ?? false);
  } catch (err) {
    done(err);
  }
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse).slice(0, 200)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  const { initCoreTables } = await import("./core-tables");
  await initCoreTables().catch((e) => logger.warn("Core table init failed: " + e.message));
  const { initBlogTable } = await import("./blog");
  const { storage } = await import("./storage");
  await storage.initCommunityTables().catch((e) => logger.warn("Community table init failed: " + e.message));
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    logError("Unhandled server error", err, { status });
    if (process.env.SENTRY_DSN) Sentry.captureException(err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  // reusePort is not supported on Windows (throws ENOTSUP), so only enable it elsewhere.
  const listenOptions: { port: number; host: string; reusePort?: boolean } = { port, host: "0.0.0.0" };
  if (process.platform !== "win32") listenOptions.reusePort = true;
  httpServer.listen(listenOptions, () => {
    log(`serving on port ${port}`);
    startPriceCron();
  });
})();