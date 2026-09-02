import { act, renderHook } from "@testing-library/react";
import { useDesktopUrlSync } from "@/hooks/useDesktopUrlSync";
import { resetDesktopStore } from "@/test/resetDesktopStore";
import { useDesktopStore } from "@/store/desktopStore";

describe("useDesktopUrlSync", () => {
  const replaceState = jest.spyOn(window.history, "replaceState");

  function setDesktopPath(path: string) {
    window.history.replaceState(null, "", path);
    replaceState.mockClear();
  }

  beforeEach(() => {
    resetDesktopStore();
    replaceState.mockClear();
    setDesktopPath("/C/users/local");
  });

  afterAll(() => {
    replaceState.mockRestore();
  });

  it("updates the address bar when a remote text file is focused", () => {
    setDesktopPath("/C/users/maya");
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
    setDesktopPath("/C/users/maya");
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

  it("does not rewrite the address bar while disabled", () => {
    const { rerender } = renderHook(() =>
      useDesktopUrlSync({ enabled: false }),
    );

    act(() => {
      useDesktopStore.getState().visitRemotePc("maya");
    });
    rerender();

    expect(replaceState).not.toHaveBeenCalled();
  });

  it("does not rewrite the marketing home route", () => {
    window.history.replaceState(null, "", "/");
    replaceState.mockClear();
    const { rerender } = renderHook(() => useDesktopUrlSync());
    rerender();

    expect(replaceState).not.toHaveBeenCalled();
  });

  it("does not clobber a remote profile URL before visitRemotePc applies", () => {
    setDesktopPath("/C/users/local");
    const { rerender } = renderHook(
      ({ deepLinkUsername }: { deepLinkUsername?: string }) =>
        useDesktopUrlSync({ enabled: true, deepLinkUsername }),
      { initialProps: { deepLinkUsername: "local" } },
    );
    rerender({ deepLinkUsername: "local" });
    replaceState.mockClear();

    rerender({ deepLinkUsername: "maya" });

    expect(replaceState).not.toHaveBeenCalled();

    setDesktopPath("/C/users/maya");
    act(() => {
      useDesktopStore.getState().visitRemotePc("maya");
    });
    rerender({ deepLinkUsername: "maya" });

    expect(replaceState).toHaveBeenCalledWith(null, "", "/C/users/maya");
  });
});
