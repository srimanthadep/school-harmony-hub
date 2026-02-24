import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAttendance } from "@/hooks/useAttendance";

describe("useAttendance - submitAttendance", () => {
  beforeEach(() => {
    vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets saveSuccess on a successful server response", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, attendance: {} }),
    } as Response);

    const { result } = renderHook(() => useAttendance());

    // Mark all students so records are populated
    act(() => {
      result.current.markAttendance("present");
    });

    await act(async () => {
      await result.current.submitAttendance();
    });

    expect(result.current.saveSuccess).toBe(true);
    expect(result.current.saveError).toBeNull();
    expect(result.current.isSaving).toBe(false);
  });

  it("sets saveError when the server responds with an error", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, message: "Server error" }),
    } as Response);

    const { result } = renderHook(() => useAttendance());

    act(() => {
      result.current.markAttendance("absent");
    });

    await act(async () => {
      try {
        await result.current.submitAttendance();
      } catch {
        // expected
      }
    });

    expect(result.current.saveError).toBe("Server error");
    expect(result.current.saveSuccess).toBe(false);
    expect(result.current.isSaving).toBe(false);
  });

  it("sets saveError on a network failure", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network failure"));

    const { result } = renderHook(() => useAttendance());

    act(() => {
      result.current.markAttendance("present");
    });

    await act(async () => {
      try {
        await result.current.submitAttendance();
      } catch {
        // expected
      }
    });

    expect(result.current.saveError).toBe("Network failure");
    expect(result.current.saveSuccess).toBe(false);
    expect(result.current.isSaving).toBe(false);
  });
});
