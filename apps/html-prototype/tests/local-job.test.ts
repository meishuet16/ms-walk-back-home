import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceLocalJob,
  beginLocalJob,
  createLocalJobState,
  localJobIsCurrent,
  runAbortableStage,
  settleLocalJob
} from "../src/systems/LocalJob.js";

test("local jobs reject stale updates and settle terminal states", () => {
  const started = beginLocalJob(createLocalJobState(), "validating", "Checking files");
  assert.equal(started.id, 1);
  assert.equal(advanceLocalJob(started, 0, "processing", "Old").message, "Checking files");
  const done = settleLocalJob(started, 1, "success", "Ready");
  assert.equal(done.phase, "success");
  assert.equal(done.progress, 1);
  assert.equal(localJobIsCurrent(done, 1), true);
});

test("abortable stages abort work and name the timed out stage", async () => {
  let aborted = false;
  await assert.rejects(
    runAbortableStage({
      label: "Media engine",
      timeoutMs: 5,
      run: (signal) => new Promise<void>((_resolve, reject) => {
        signal.addEventListener("abort", () => {
          aborted = true;
          reject(signal.reason);
        }, { once: true });
      })
    }),
    /Media engine timed out/
  );
  assert.equal(aborted, true);
});

test("abortable stages relay parent cancellation", async () => {
  const parent = new AbortController();
  const pending = runAbortableStage({
    label: "PDF processing",
    timeoutMs: 1000,
    parentSignal: parent.signal,
    run: (signal) => new Promise<void>((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    })
  });
  parent.abort(new DOMException("Cancelled", "AbortError"));
  await assert.rejects(pending, /Cancelled/);
});
test("abortable stages settle even when work ignores cancellation", async () => {
  const guarded = Promise.race([
    runAbortableStage({
      label: "Uncooperative stage",
      timeoutMs: 5,
      run: async () => new Promise<void>(() => undefined)
    }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("stage did not settle")), 50))
  ]);
  await assert.rejects(guarded, /Uncooperative stage timed out/);
});
