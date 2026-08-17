import { act, renderHook } from "@testing-library/react";
import { useDesktopUrlSync } from "@/hooks/useDesktopUrlSync";
import { resetDesktopStore } from "@/test/resetDesktopStore";
import { useDesktopStore } from "@/store/desktopStore";

describe("useDesktopUrlSync", () => {
  const replaceState = jest.spyOn(window.history, "replaceState");

  beforeEach(() => {
    resetDesktopStore();
    replaceState.mockClear();
  });

  afterAll(() => {
    replaceState.mockRestore();
  });

  it("updates the address bar when a remote text file is focused", () => {
    const { rerender } = renderHook(() => useDesktopUrlSync());

    act(() => {
      useDesktopStore.getState().visitRemotePc("maya");
      useDesktopStore.getState().openWindow("maya-file-welcome");
    });
    rerender();

    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/C/users/maya/welcome",
    );
  });

  it("returns to the profile path when a non-file window is focused", () => {
    const { rerender } = renderHook(() => useDesktopUrlSync());

    act(() => {
      useDesktopStore.getState().visitRemotePc("maya");
      useDesktopStore.getState().openWindow("maya-file-welcome");
    });
    rerender();
    replaceState.mockClear();

    act(() => {
      useDesktopStore.getState().openProfile();
    });
    rerender();

    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/C/users/maya",
    );
  });

  it("syncs the local desktop to /C/users/local", () => {
    const { rerender } = renderHook(() => useDesktopUrlSync());
    rerender();

    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/C/users/local",
    );
  });

  it("syncs a focused local text file under /C/users/local", () => {
    const { rerender } = renderHook(() => useDesktopUrlSync());

    act(() => {
      useDesktopStore.getState().createTextFile(null, "local-notes");
      const icon = useDesktopStore
        .getState()
        .icons.find((item) => item.label === "local-notes");
      if (icon) {
        useDesktopStore.getState().openWindow(icon.id);
      }
    });
    rerender();

    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/C/users/local/local-notes",
    );
  });
});
