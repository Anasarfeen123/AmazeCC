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

function NestedDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true);
  return (
    <div ref={ref} role="dialog">
      <button>Inner first</button>
      <button onClick={onClose}>Inner last</button>
    </div>
  );
}

function NestedHarness() {
  const [nested, setNested] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true);
  return (
    <div ref={ref} role="dialog">
      <button onClick={() => setNested(true)}>Open inner</button>
      {nested && <NestedDialog onClose={() => setNested(false)} />}
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

  it("keeps focus in the topmost dialog and restores it to the inner opener", () => {
    const { getByText } = render(<NestedHarness />);
    fireEvent.click(getByText("Open inner"));
    expect(document.activeElement).toBe(getByText("Inner first"));
    getByText("Inner last").focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(getByText("Inner first"));
    fireEvent.click(getByText("Inner last"));
    expect(document.activeElement).toBe(getByText("Open inner"));
  });
});
