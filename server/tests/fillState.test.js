import { describe, it, expect } from "vitest";
import { deriveFillState } from "../src/services/fillState.service.js";

describe("deriveFillState", () => {
  it("returns Open when there are zero signups", () => {
    expect(deriveFillState(0, 5)).toBe("Open");
  });

  it("returns Partially Filled when signups are below the required headcount", () => {
    expect(deriveFillState(2, 5)).toBe("Partially Filled");
  });

  it("returns Filled when signups exactly equal the required headcount", () => {
    expect(deriveFillState(5, 5)).toBe("Filled");
  });

  it("returns Filled when signups exceed the required headcount (defensive case)", () => {
    expect(deriveFillState(6, 5)).toBe("Filled");
  });

  it("returns Open at the exact boundary of headcount 1 with zero signups", () => {
    expect(deriveFillState(0, 1)).toBe("Open");
  });

  it("returns Filled at the exact boundary of headcount 1 with one signup", () => {
    expect(deriveFillState(1, 1)).toBe("Filled");
  });

  it("throws on a negative signup count", () => {
    expect(() => deriveFillState(-1, 5)).toThrow();
  });

  it("throws on a headcount less than 1", () => {
    expect(() => deriveFillState(0, 0)).toThrow();
  });
});