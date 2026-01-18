export function parseLogEntries(entries) {
  if (!Array.isArray(entries)) throw new Error("Log entries must be an array");

  const meta = entries.find((e) => e?.type === "meta");
  const seed = entries.find((e) => e?.type === "seed");
  if (!meta) throw new Error("Missing meta entry");
  if (!seed) throw new Error("Missing seed entry");

  const turns = entries.filter((e) => e?.type === "turn");
  return { meta, seed, turns };
}

export function computeResumeState(entries) {
  const { meta, seed, turns } = parseLogEntries(entries);
  const first = meta.first;
  const other = first === meta.a ? meta.b : meta.a;

  const lastTurn = [...turns].reverse().find((t) => t && t.output && !t.error);
  if (!lastTurn) {
    return {
      status: "ready",
      nextRound: 1,
      nextWho: first,
      currentText: seed.text,
      meta,
      seed
    };
  }

  let nextRound = Number(lastTurn.round || 1);
  let nextWho;
  if (lastTurn.who === first) {
    nextWho = other;
  } else {
    nextWho = first;
    nextRound += 1;
  }

  const completed = nextRound > Number(meta.rounds || 0);
  return {
    status: completed ? "completed" : "ready",
    nextRound,
    nextWho,
    currentText: lastTurn.output,
    meta,
    seed
  };
}

export function logToMarkdown(entries) {
  const { meta, seed, turns } = parseLogEntries(entries);
  const lines = [];
  lines.push(`# LLM Rally Log`);
  lines.push("");
  lines.push(`- A: ${meta.a}`);
  lines.push(`- B: ${meta.b}`);
  lines.push(`- First: ${meta.first}`);
  lines.push(`- Rounds: ${meta.rounds}`);
  lines.push("");
  lines.push(`## Seed`);
  lines.push("");
  lines.push(seed.text || "(empty)");

  let currentRound = null;
  for (const turn of turns) {
    if (turn.round !== currentRound) {
      currentRound = turn.round;
      lines.push("");
      lines.push(`## Round ${currentRound}`);
      lines.push("");
    }
    lines.push(`### ${turn.who}`);
    lines.push("");
    lines.push(`**Input**`);
    lines.push("");
    lines.push(turn.input || "(empty)");
    lines.push("");
    lines.push(`**Output**`);
    lines.push("");
    lines.push(turn.output || "(empty)");
    lines.push("");
  }

  return lines.join("\n");
}
