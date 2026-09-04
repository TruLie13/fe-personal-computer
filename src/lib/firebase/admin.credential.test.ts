/**
 * @jest-environment node
 */
import { parseServiceAccountFromEnv } from "@/lib/firebase/admin";

describe("parseServiceAccountFromEnv", () => {
  const originalJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const originalB64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  afterEach(() => {
    if (originalJson === undefined) {
      delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    } else {
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON = originalJson;
    }
    if (originalB64 === undefined) {
      delete process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    } else {
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = originalB64;
    }
  });

  it("parses FIREBASE_SERVICE_ACCOUNT_JSON", () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      client_email: "demo@demo.iam.gserviceaccount.com",
      project_id: "demo",
    });
    delete process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    expect(parseServiceAccountFromEnv()).toEqual({
      client_email: "demo@demo.iam.gserviceaccount.com",
      project_id: "demo",
    });
  });

  it("parses FIREBASE_SERVICE_ACCOUNT_BASE64", () => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = Buffer.from(
      JSON.stringify({ project_id: "from-b64" }),
      "utf8",
    ).toString("base64");
    expect(parseServiceAccountFromEnv()?.project_id).toBe("from-b64");
  });

  it("returns null when unset", () => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    delete process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    expect(parseServiceAccountFromEnv()).toBeNull();
  });
});
