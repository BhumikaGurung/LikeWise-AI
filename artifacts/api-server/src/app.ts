import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

// ─── Clerk key validation ─────────────────────────────────────────────────────
// Clerk publishable keys must start with pk_test_ or pk_live_ followed by a
// non-trivial base64 payload. A missing or short/invalid value means Clerk is
// not configured. In production this is fatal; in development a bypass is used.
const clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY ?? "";
const hasValidClerkKey =
  (clerkPublishableKey.startsWith("pk_test_") ||
    clerkPublishableKey.startsWith("pk_live_")) &&
  // The base64 suffix must be long enough to encode a real domain (~30+ chars)
  clerkPublishableKey.length > 30;

const isDevMode = process.env.NODE_ENV !== "production";

if (!hasValidClerkKey && !isDevMode) {
  // Fail fast in production rather than silently bypassing authentication.
  throw new Error(
    "CLERK_PUBLISHABLE_KEY is required in production. " +
      "Set it via the Replit Auth pane or as a CLERK_PUBLISHABLE_KEY environment secret.",
  );
}

// Brand symbol that @clerk/express uses to verify req.auth was set by Clerk.
// Using Symbol.for ensures the same symbol instance across module copies.
const CLERK_AUTH_BRAND = Symbol.for("@clerk/express.auth");

// Dev user injected when Clerk is not configured (development only).
const DEV_USER_ID = "dev-user-001";

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

// Clerk proxy must be mounted before body parsers (streams raw bytes)
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (hasValidClerkKey) {
  // Production / real Clerk dev instance: use Clerk middleware normally.
  app.use(
    clerkMiddleware((req) => ({
      publishableKey: publishableKeyFromHost(
        getClerkProxyHost(req) ?? "",
        clerkPublishableKey,
      ),
    })),
  );
} else {
  // Dev fallback: Clerk is not configured. Inject a branded req.auth function
  // so that getAuth(req) returns a signed-in dev user instead of throwing.
  logger.warn(
    "CLERK_PUBLISHABLE_KEY is missing or invalid — using dev auth bypass (userId: dev-user-001). " +
      "Configure real Clerk keys to enable authentication.",
  );
  app.use((req: express.Request & { auth?: unknown }, _res, next) => {
    // Build a minimal auth object that satisfies @clerk/backend's
    // getAuthObjectForAcceptedToken (tokenType must be "session_token").
    const mockAuthObject = {
      tokenType: "session_token" as const,
      userId: DEV_USER_ID,
      sessionId: "dev-session-001",
      sessionClaims: { userId: DEV_USER_ID, sub: DEV_USER_ID },
      actor: null,
      orgId: null,
      orgRole: null,
      orgSlug: null,
      orgPermissions: null,
      factorVerificationAge: null,
      debug: () => ({}),
    };
    const authFn = (_opts?: unknown) => mockAuthObject;
    // The brand is required so requestHasAuthObject(req) returns true,
    // which allows getAuth(req) to proceed without throwing.
    // Object.defineProperty avoids any unsafe TS cast.
    Object.defineProperty(authFn, CLERK_AUTH_BRAND, {
      value: true,
      configurable: true,
    });
    (req as express.Request & { auth: unknown }).auth = authFn;
    next();
  });
}

app.use("/api", router);

export default app;
