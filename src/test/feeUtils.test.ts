import { describe, it, expect } from "vitest";
import {
  computePaymentStatus,
  computePendingAmount,
  computeCollectionRate,
  generateReceiptNumber,
  getNextClass,
  isGraduatingClass,
} from "@/lib/feeUtils";

describe("computePaymentStatus", () => {
  it("returns 'paid' when totalPaid >= totalFee", () => {
    expect(computePaymentStatus(1000, 1000)).toBe("paid");
    expect(computePaymentStatus(1000, 1200)).toBe("paid");
  });

  it("returns 'partial' when some amount is paid but not full", () => {
    expect(computePaymentStatus(1000, 500)).toBe("partial");
    expect(computePaymentStatus(1000, 1)).toBe("partial");
  });

  it("returns 'unpaid' when nothing is paid", () => {
    expect(computePaymentStatus(1000, 0)).toBe("unpaid");
  });

  it("returns 'unpaid' when totalFee is zero or negative", () => {
    expect(computePaymentStatus(0, 0)).toBe("unpaid");
    expect(computePaymentStatus(-100, 0)).toBe("unpaid");
  });
});

describe("computePendingAmount", () => {
  it("returns the difference when unpaid", () => {
    expect(computePendingAmount(1000, 600)).toBe(400);
  });

  it("returns 0 when fully paid or overpaid", () => {
    expect(computePendingAmount(1000, 1000)).toBe(0);
    expect(computePendingAmount(1000, 1500)).toBe(0);
  });
});

describe("computeCollectionRate", () => {
  it("returns percentage of collected vs due", () => {
    expect(computeCollectionRate(1000, 500)).toBe(50);
    expect(computeCollectionRate(1000, 1000)).toBe(100);
  });

  it("caps at 100%", () => {
    expect(computeCollectionRate(1000, 1500)).toBe(100);
  });

  it("returns 0 when totalDue is 0", () => {
    expect(computeCollectionRate(0, 500)).toBe(0);
  });
});

describe("generateReceiptNumber", () => {
  it("pads to 6 digits", () => {
    expect(generateReceiptNumber("REC", 0)).toBe("REC000001");
    expect(generateReceiptNumber("REC", 99)).toBe("REC000100");
    expect(generateReceiptNumber("SLP", 999999)).toBe("SLP1000000");
  });
});

describe("getNextClass", () => {
  it("returns next class in order", () => {
    expect(getNextClass("Nursery")).toBe("LKG");
    expect(getNextClass("LKG")).toBe("UKG");
    expect(getNextClass("UKG")).toBe("1st");
    expect(getNextClass("9th")).toBe("10th");
  });

  it("returns null for the last class", () => {
    expect(getNextClass("10th")).toBeNull();
  });

  it("returns null for unknown class", () => {
    expect(getNextClass("Unknown")).toBeNull();
  });
});

describe("isGraduatingClass", () => {
  it("returns true only for 10th", () => {
    expect(isGraduatingClass("10th")).toBe(true);
  });

  it("returns false for all other classes", () => {
    expect(isGraduatingClass("Nursery")).toBe(false);
    expect(isGraduatingClass("9th")).toBe(false);
    expect(isGraduatingClass("UKG")).toBe(false);
  });
});
