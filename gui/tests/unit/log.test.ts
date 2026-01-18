import { describe, expect, it } from "vitest";
import { computeResumeState, parseLogEntries } from "../../src/shared/log";

describe("parseLogEntries", () => {
  it("throws on non-array", () => {
    expect(() => parseLogEntries("nope")).toThrow(/array/);
  });

  it("throws on missing meta/seed", () => {
    expect(() => parseLogEntries([])).toThrow(/meta/i);
    expect(() => parseLogEntries([{ type: "meta" }])).toThrow(/seed/i);
  });
});

describe("computeResumeState", () => {
  const base = (overrides = {}) => [
    { type: "meta", a: "chatgpt", b: "claude", first: "chatgpt", rounds: 2 },
    { type: "seed", text: "topic" },
    ...overrides.turns
  ];

  it("returns next who=other when last turn is first", () => {
    const entries = base({
      turns: [
        { type: "turn", round: 1, who: "chatgpt", input: "x", output: "y" }
      ]
    });
    const state = computeResumeState(entries);
    expect(state.nextRound).toBe(1);
    expect(state.nextWho).toBe("claude");
    expect(state.currentText).toBe("y");
  });

  it("returns next round and who=first when last turn is other", () => {
    const entries = base({
      turns: [
        { type: "turn", round: 1, who: "chatgpt", input: "x", output: "y" },
        { type: "turn", round: 1, who: "claude", input: "y", output: "z" }
      ]
    });
    const state = computeResumeState(entries);
    expect(state.nextRound).toBe(2);
    expect(state.nextWho).toBe("chatgpt");
    expect(state.currentText).toBe("z");
  });

  it("returns seed as currentText when no valid turns", () => {
    const entries = base({ turns: [] });
    const state = computeResumeState(entries);
    expect(state.nextRound).toBe(1);
    expect(state.nextWho).toBe("chatgpt");
    expect(state.currentText).toBe("topic");
  });

  it("ignores errored or empty-output turns", () => {
    const entries = base({
      turns: [
        { type: "turn", round: 1, who: "chatgpt", input: "x", output: "" },
        { type: "turn", round: 1, who: "chatgpt", input: "x", output: "y", error: true }
      ]
    });
    const state = computeResumeState(entries);
    expect(state.currentText).toBe("topic");
  });

  it("throws on empty log", () => {
    expect(() => computeResumeState([])).toThrow();
  });
});
