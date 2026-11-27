import { test } from "node:test";
import assert from "node:assert/strict";
import { testRoutesEnabled } from "../src/lib/test-routes";

test("test routes are off by default", () => {
  assert.equal(testRoutesEnabled({ NODE_ENV: "development" }), false);
  assert.equal(testRoutesEnabled({}), false);
});

test("test routes need explicit opt-in AND non-production", () => {
  assert.equal(testRoutesEnabled({ NODE_ENV: "development", ENABLE_TEST_ROUTES: "true" }), true);
  assert.equal(testRoutesEnabled({ NODE_ENV: "production", ENABLE_TEST_ROUTES: "true" }), false);
  assert.equal(testRoutesEnabled({ NODE_ENV: "development", ENABLE_TEST_ROUTES: "1" }), false);
});
