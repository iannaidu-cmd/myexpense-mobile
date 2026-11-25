import fs from "fs";
import path from "path";

const { addFirebaseConfigure } = require("../../plugins/withFirebaseSceneConfigure");

// Verbatim AppDelegate.swift from expo-template-bare-minimum@58.0.35.
const template = fs.readFileSync(
  path.join(__dirname, "AppDelegate.sdk58.swift.txt"),
  "utf8",
);

describe("withFirebaseSceneConfigure", () => {
  it("adds FirebaseApp.configure() right before super.application in the SDK 58 AppDelegate", () => {
    const out: string = addFirebaseConfigure(template);
    expect(out).toMatch(/^import FirebaseCore$/m);
    expect(out).toMatch(
      /\n    FirebaseApp\.configure\(\)\n    return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\)/,
    );
  });

  it("does not add a second import when RNFB's plugin already added one", () => {
    const withImport = template.replace("internal import Expo", "internal import Expo\nimport FirebaseCore");
    const out: string = addFirebaseConfigure(withImport);
    expect(out.match(/import FirebaseCore/g)).toHaveLength(1);
    expect(out.match(/FirebaseApp\.configure\(\)/g)).toHaveLength(1);
  });

  it("is idempotent", () => {
    const once: string = addFirebaseConfigure(template);
    expect(addFirebaseConfigure(once)).toBe(once);
  });
});
