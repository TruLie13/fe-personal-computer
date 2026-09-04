import {
  getFirebaseWebConfig,
  useFirebaseEmulators,
} from "@/lib/firebase/config";

describe("firebase config", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it("reads web config from NEXT_PUBLIC_* env", () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "test-key";
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "demo.firebaseapp.com";
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "teal95-176f5";
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "demo.appspot.com";
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "123";
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = "1:123:web:abc";

    expect(getFirebaseWebConfig()).toEqual({
      apiKey: "test-key",
      authDomain: "demo.firebaseapp.com",
      projectId: "teal95-176f5",
      storageBucket: "demo.appspot.com",
      messagingSenderId: "123",
      appId: "1:123:web:abc",
    });
  });

  it("throws when a required env var is missing", () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "demo.firebaseapp.com";
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "teal95-176f5";
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "demo.appspot.com";
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "123";
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = "1:123:web:abc";

    expect(() => getFirebaseWebConfig()).toThrow(/NEXT_PUBLIC_FIREBASE_API_KEY/);
  });

  it("detects emulator flag", () => {
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS = "true";
    expect(useFirebaseEmulators()).toBe(true);
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS = "false";
    expect(useFirebaseEmulators()).toBe(false);
  });
});
