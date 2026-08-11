import assert from "node:assert/strict";
import test from "node:test";
import { privateCloudSchemaSql, privateStoragePolicySql } from "../src/systems/CloudSchema.js";

test("cloud schema stores only private user state and never duplicates public chapter definitions", () => {
  assert.match(privateCloudSchemaSql, /diary_entries/);
  assert.match(privateCloudSchemaSql, /reflection_notes/);
  assert.match(privateCloudSchemaSql, /chapter_progress/);
  assert.match(privateCloudSchemaSql, /music_tracks/);
  assert.doesNotMatch(privateCloudSchemaSql, /chapter_definitions/i);
});

test("RLS policies require authenticated ownership for private rows and media", () => {
  assert.match(privateCloudSchemaSql, /enable row level security/i);
  assert.match(privateCloudSchemaSql, /user_id = auth\.uid\(\)/i);
  assert.match(privateStoragePolicySql, /bucket_id = 'walk-private-media'/);
  assert.match(privateStoragePolicySql, /auth\.uid\(\)::text/);
});
