import test from "node:test";
import assert from "node:assert/strict";
import { createMarketSummary } from "../src/market-summary.mjs";

test("summary retains source context and marks sample data", () => {
  const summary = createMarketSummary({
    asset: "ACME",
    price: 42.5,
    sourceTimestamp: "2026-09-29T06:00:00Z",
  });

  assert.equal(summary.asset, "ACME");
  assert.equal(summary.price, 42.5);
  assert.equal(summary.sourceTimestamp, "2026-09-29T06:00:00Z");
  assert.match(summary.disclosure, /not a live quote/);
});

test("invalid input fails rather than producing a misleading summary", () => {
  assert.throws(() => createMarketSummary({ asset: "ACME", price: NaN, sourceTimestamp: "now" }), TypeError);
});
