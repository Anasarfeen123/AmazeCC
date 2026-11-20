import { describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import GameSheet from "@/components/custom/games/GameSheet";
import { isGameOpenAtom } from "@/store/uiAtoms";

describe("GameSheet easter egg", () => {
  it("opens the brick game on the Konami code", () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <GameSheet />
      </Provider>,
    );
    expect(store.get(isGameOpenAtom)).toBe(false);
    const keys = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "b",
      "a",
    ];
    act(() => {
      for (const key of keys) fireEvent.keyDown(window, { key });
    });
    expect(store.get(isGameOpenAtom)).toBe(true);
  });

  it("ignores the code while typing in a field", () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <input aria-label="field" />
        <GameSheet />
      </Provider>,
    );
    const input = screen.getByLabelText("field");
    for (const key of [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "b",
      "a",
    ])
      fireEvent.keyDown(input, { key });
    expect(store.get(isGameOpenAtom)).toBe(false);
  });
});
