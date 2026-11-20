import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CommandPalette } from "@/components/custom/shared/CommandPalette";

// The hidden game is found in spotlight by words that are not in its label
// ("bored", "game"), so the search has to read `keywords` too.
// jsdom has no scrollIntoView; the palette scrolls the active row into view.
Element.prototype.scrollIntoView = vi.fn();

describe("CommandPalette keywords", () => {
  const commands = [
    { id: "play-bricks", label: "Break some bricks", keywords: ["game", "bored"], onSelect: vi.fn() },
    { id: "other", label: "Attendance", onSelect: vi.fn() },
  ];

  it("finds a command by a hidden keyword", () => {
    render(<CommandPalette isOpen onClose={vi.fn()} commands={commands} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "bored" } });
    expect(screen.queryByText("Break some bricks")).not.toBeNull();
    expect(screen.queryByText("Attendance")).toBeNull();
  });
});
