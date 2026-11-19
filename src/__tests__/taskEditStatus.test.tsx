import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TaskEditSheet from "../components/custom/tasks/TaskEditSheet";

describe("new task status", () => {
  it("shows and saves the status chosen from a board column", () => {
    const onSave = vi.fn();
    render(
      <TaskEditSheet
        isOpen
        initialTitle="Read chapter"
        initialStatus="in_progress"
        onClose={() => {}}
        onSave={onSave}
      />,
    );
    expect(screen.getByRole("button", { name: "in progress" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Create Task" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: "Read chapter", status: "in_progress" }));
  });

  it("records a completion time for a task created as done", () => {
    const onSave = vi.fn();
    render(
      <TaskEditSheet isOpen initialTitle="Read chapter" initialStatus="done" onClose={() => {}} onSave={onSave} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Create Task" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ status: "done", completedAt: expect.any(String) }));
  });
});
