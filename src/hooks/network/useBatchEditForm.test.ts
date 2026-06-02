import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBatchEditForm } from "./useBatchEditForm";
import { networkApi } from "@/lib/api/network";
import { toast } from "sonner";

// Mock dependencies
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { accessToken: "mock-token" },
  }),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({
    projectId: "123e4567-e89b-12d3-a456-426614174000",
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("@/lib/api/network", () => ({
  networkApi: {
    batchUpdate: vi.fn(),
  },
}));

describe("useBatchEditForm", () => {
  const selectedIds = ["123e4567-e89b-12d3-a456-426614174001", "123e4567-e89b-12d3-a456-426614174002"];
  const assetType = "ODP";
  const onSuccess = vi.fn();
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should initialize with default form data", () => {
    const { result } = renderHook(() =>
      useBatchEditForm({
        selectedIds,
        assetType,
        onSuccess,
        onOpenChange,
        mode: "STATUS_UPDATE",
      })
    );

    expect(result.current.formData.status).toBe("");
    expect(result.current.formData.healthStatus).toBe("");
    expect(result.current.formData.reason).toBe("");
    expect(result.current.formData.notes).toBe("");
    expect(result.current.formData.newParentId).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  test("should validate form and show error toast if status and health status are empty in status update mode", async () => {
    const { result } = renderHook(() =>
      useBatchEditForm({
        selectedIds,
        assetType,
        onSuccess,
        onOpenChange,
        mode: "STATUS_UPDATE",
      })
    );

    await act(async () => {
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(event);
    });

    expect(toast.error).toHaveBeenCalledWith("Pilih minimal satu status untuk diperbarui");
    expect(networkApi.batchUpdate).not.toHaveBeenCalled();
  });

  test("should validate form and show error toast if reason is empty in status update mode", async () => {
    const { result } = renderHook(() =>
      useBatchEditForm({
        selectedIds,
        assetType,
        onSuccess,
        onOpenChange,
        mode: "STATUS_UPDATE",
      })
    );

    // Set status
    act(() => {
      result.current.setFormData(prev => ({ ...prev, status: "ACTIVE" }));
    });

    await act(async () => {
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(event);
    });

    expect(toast.error).toHaveBeenCalledWith("Alasan wajib diisi");
    expect(networkApi.batchUpdate).not.toHaveBeenCalled();
  });

  test("should call networkApi.batchUpdate on valid submission in status update mode", async () => {
    vi.mocked(networkApi.batchUpdate).mockResolvedValueOnce({ count: 2, failed: [] });

    const { result } = renderHook(() =>
      useBatchEditForm({
        selectedIds,
        assetType,
        onSuccess,
        onOpenChange,
        mode: "STATUS_UPDATE",
      })
    );

    // Set valid form data
    act(() => {
      result.current.setFormData({
        status: "ACTIVE",
        healthStatus: "UP",
        reason: "Scheduled maintenance validation",
        notes: "No issues",
        newParentId: null,
        newParentCode: "",
      });
    });

    await act(async () => {
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(event);
    });

    expect(networkApi.batchUpdate).toHaveBeenCalledWith(
      {
        ids: selectedIds,
        type: assetType,
        status: "ACTIVE",
        healthStatus: "UP",
        reason: "Scheduled maintenance validation",
        notes: "No issues",
        newParentId: undefined,
      },
      "mock-token",
      "123e4567-e89b-12d3-a456-426614174000"
    );
    expect(toast.success).toHaveBeenCalledWith("Berhasil memperbarui 2 aset");
    expect(onSuccess).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
