import { describe, expect, it } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { useRef, useState } from "react";
import { useFocusTrap } from "@/lib/useFocusTrap";

function Harness() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open</button>
      {open && (
        <div ref={ref} role="dialog">
          <button>First</button>
          <button onClick={() => setOpen(false)}>Last</button>
        </div>
      )}
    </div>
  );
}

// jsdom has no layout, so give every element a client rect.
Element.prototype.getClientRects = function () {
  return [{ width: 1, height: 1 }] as unknown as DOMRectList;
};

describe("useFocusTrap", () => {
  it("moves focus in, wraps Tab inside, and restores focus on close", () => {
    const { getByText } = render(<Harness />);
    const opener = getByText("Open");
    opener.focus();
    fireEvent.click(opener);
    expect(document.activeElement).toBe(getByText("First"));

    getByText("Last").focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(getByText("First"));

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(getByText("Last"));

    fireEvent.click(getByText("Last"));
    expect(document.activeElement).toBe(opener);
  });
});
