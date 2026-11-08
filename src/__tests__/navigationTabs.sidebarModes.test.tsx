import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NavigationTabs from "../components/custom/header/NavigationTabs";

function renderNavigation(overrides: Record<string, unknown> = {}) {
  const props = {
    activeTab: "home",
    setActiveTab: vi.fn(),
    handleLogOutRequest: vi.fn(),
    handleReloadRequest: vi.fn(),
    setIsReloading: vi.fn(),
    username: "student",
    settings: { isSidebarCollapsed: false, pinnedNavTabs: [], currSemesterID: "2025-2026" },
    setSettings: vi.fn(),
    attendancePercentage: { percentage: 92 },
    marksData: { cgpa: { cgpa: "9.1", creditsEarned: 60 } },
    ODhoursData: [],
    setODhoursIsOpen: vi.fn(),
    setGradesDisplayIsOpen: vi.fn(),
    activeAttendanceSubTab: "predictor",
    setActiveAttendanceSubTab: vi.fn(),
    activeToolsSubTab: "overview",
    setActiveToolsSubTab: vi.fn(),
    activeSubTab: "overview",
    setActiveSubTab: vi.fn(),
    HostelActiveSubTab: "overview",
    setHostelActiveSubTab: vi.fn(),
    activeDayscholarSubTab: "overview",
    setActiveDayscholarSubTab: vi.fn(),
    activeMoreSubTab: "overview",
    setActiveMoreSubTab: vi.fn(),
    activeProfileSubTab: "settings",
    setActiveProfileSubTab: vi.fn(),
    onOpenCommandPalette: vi.fn(),
    ...overrides,
  };
  return { ...render(<NavigationTabs {...(props as any)} />), props };
}

describe("sidebar modes", () => {
  it("shows all destinations in one grouped menu when expanded", () => {
    renderNavigation();
    const sidebar = screen.getByLabelText("Primary navigation");

    expect(within(sidebar).getByText("Study")).toBeTruthy();
    expect(within(sidebar).getByText("Campus")).toBeTruthy();
    expect(within(sidebar).getByText("Tools")).toBeTruthy();
    expect(within(sidebar).getByText("Account")).toBeTruthy();
    expect(within(sidebar).getByText("Home")).toBeTruthy();
    expect(within(sidebar).getByText("Payments")).toBeTruthy();
  });

  it("shows a small centered set of group icons and opens their destinations in a popup", () => {
    const { props } = renderNavigation({
      activeTab: "home",
      settings: { isSidebarCollapsed: true, pinnedNavTabs: [] },
    });
    const sidebar = screen.getByLabelText("Primary navigation");
    const nav = within(sidebar).getByRole("navigation", { name: "Navigation" });
    const groupButtons = within(nav).getAllByRole("button");

    expect(groupButtons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Study",
      "Campus",
      "Tools",
      "Account",
    ]);
    expect(within(nav).queryByRole("button", { name: "Home" })).toBeNull();

    fireEvent.click(within(nav).getByRole("button", { name: "Campus" }));
    const campusMenu = screen.getByRole("menu", { name: "Campus navigation" });
    const payments = within(campusMenu).getByRole("menuitem", { name: "Payments" });
    fireEvent.click(payments);
    expect(props.setActiveTab).toHaveBeenCalledWith("payments");
    expect(screen.queryByRole("menu", { name: "Campus navigation" })).toBeNull();

    fireEvent.click(within(nav).getByRole("button", { name: "Study" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu", { name: "Study navigation" })).toBeNull();
  });

  it("keeps group order consistent between expanded and collapsed modes", () => {
    const expanded = renderNavigation();
    const expandedSidebar = screen.getByLabelText("Primary navigation");
    const expandedGroups = ["Study", "Campus", "Tools", "Account"].map((label) =>
      within(expandedSidebar).getByText(label).textContent?.trim(),
    );
    expanded.unmount();

    renderNavigation({ settings: { isSidebarCollapsed: true, pinnedNavTabs: [] } });
    const collapsedNav = within(screen.getByLabelText("Primary navigation")).getByRole("navigation", {
      name: "Navigation",
    });
    const collapsedGroups = within(collapsedNav)
      .getAllByRole("button")
      .map((button) => button.getAttribute("aria-label"));

    expect(collapsedGroups).toEqual(expandedGroups);
  });

  it("offers a working collapse control in both modes", () => {
    const expanded = renderNavigation();
    const collapseButton = screen.getByRole("button", { name: "Collapse sidebar" });

    fireEvent.click(collapseButton);
    const collapseUpdate = expanded.props.setSettings.mock.calls[0][0];
    expect(collapseUpdate(expanded.props.settings).isSidebarCollapsed).toBe(true);

    expanded.unmount();
    const collapsed = renderNavigation({
      settings: { isSidebarCollapsed: true, pinnedNavTabs: [] },
    });
    const expandButton = screen.getByRole("button", { name: "Expand sidebar" });

    fireEvent.click(expandButton);
    const expandUpdate = collapsed.props.setSettings.mock.calls[0][0];
    expect(expandUpdate(collapsed.props.settings).isSidebarCollapsed).toBe(false);
  });
});
