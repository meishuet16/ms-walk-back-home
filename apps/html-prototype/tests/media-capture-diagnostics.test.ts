import assert from "node:assert/strict";
import test from "node:test";
import { describeMediaCaptureError, mediaCaptureFailureMessage, reportMediaCaptureError } from "../src/systems/MediaCaptureDiagnostics.js";

test("media capture diagnostics preserve the DOMException name and message", () => {
  const error = { name: "NotAllowedError", message: "Permission denied by system" };

  assert.equal(describeMediaCaptureError(error), "NotAllowedError: Permission denied by system");
  assert.match(mediaCaptureFailureMessage(error), /NotAllowedError: Permission denied by system/);
});

test("media capture diagnostics provide a graceful fallback for unknown failures", () => {
  assert.equal(mediaCaptureFailureMessage(new Error("device busy")), "Microphone recording failed (Error: device busy).");
  assert.equal(mediaCaptureFailureMessage(undefined), "Microphone recording failed (UnknownError).");
});

test("media capture failures are logged with structured DOMException details", () => {
  const originalError = console.error;
  let logged: unknown[] = [];
  console.error = (...args: unknown[]) => { logged = args; };
  try {
    const details = reportMediaCaptureError("test getUserMedia", { name: "NotReadableError", message: "Track start failed" });
    assert.deepEqual(details, { name: "NotReadableError", message: "Track start failed" });
    assert.match(String(logged[0]), /test getUserMedia: NotReadableError: Track start failed/);
    assert.deepEqual(logged[1], details);
  } finally {
    console.error = originalError;
  }
});
