import test from "node:test";
import assert from "node:assert/strict";
import { parseRateToCents, summarizeMonth } from "../billingMath.js";

const session = (id, start, end, extra = {}) => ({
  id, date: "2026-11-02", start_time: start, end_time: end, type: "class", ...extra,
});

test("hourly rates use exact cents, including zero, and reject invalid input", () => {
  for (const [value, expected] of [["", null], [null, null], ["0", 0], ["25.50", 2550], ["25,5", 2550], ["-1", null], ["1e2", null], ["20.001", null], ["99999999.99", 9999999999], ["100000000", null]]) {
    assert.equal(parseRateToCents(value), expected, String(value));
  }
});

test("monthly charges include future classes and exclude blocks, other months and years", () => {
  const sessions = [session("a", "16:00:00", "16:30:00"), session("b", "17:00", "18:30"), session("c", "19:00:00.000000", "19:45:00.000000"),
    session("block", "20:00", "21:00", { type: "unavailable" }),
    session("other-month", "16:00", "17:00", { date: "2026-10-02" }),
    session("other-year", "16:00", "17:00", { date: "2025-11-02" })];
  const summary = summarizeMonth(sessions, 2026, 10, 2550);
  assert.equal(summary.rows.length, 3);
  assert.equal(summary.seconds, 9900);
  assert.equal(summary.amountCents, 7013);
  assert.equal(summary.invalid, false);
  assert.equal(summarizeMonth(sessions, 2026, 10, null).amountCents, null);
  assert.equal(summarizeMonth(sessions, 2026, 10, 0).amountCents, 0);
  assert.equal(summarizeMonth([], 2026, 10, 2550).amountCents, 0);
});

test("invalid times suppress totals instead of silently undercharging", () => {
  for (const [start, end] of [["18:00", "17:00"], ["16:99", "17:00"], ["16:00", "16:00"], ["invalid", "17:00"]]) {
    const summary = summarizeMonth([session("bad", start, end)], 2026, 10, 2550);
    assert.equal(summary.invalid, true);
    assert.equal(summary.seconds, null);
    assert.equal(summary.amountCents, null);
  }
  assert.equal(summarizeMonth([session("midnight", "23:00", "24:00")], 2026, 10, 2550).amountCents, 2550);
  assert.equal(summarizeMonth([session("seconds", "16:00:30", "16:01:30")], 2026, 10, 6000).amountCents, 100);
});

test("the total equals the sum of individually rounded class charges", () => {
  const summary = summarizeMonth(Array.from({ length: 3 }, (_, i) => session(String(i), "16:00", "16:10")), 2026, 10, 1999);
  assert.equal(summary.amountCents, 999);
  assert.equal(summary.rows.reduce((sum, row) => sum + row.amountCents, 0), summary.amountCents);
});
