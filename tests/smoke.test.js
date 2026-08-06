const test = require("node:test");
const assert = require("node:assert/strict");

const packageJson = require("../package.json");

test("package has a project test entrypoint", () => {
  assert.equal(typeof packageJson.scripts.test, "string");
});

test("package exposes a typecheck script", () => {
  assert.equal(typeof packageJson.scripts.typecheck, "string");
});

test("package exposes a lint script", () => {
  assert.equal(typeof packageJson.scripts.lint, "string");
});
