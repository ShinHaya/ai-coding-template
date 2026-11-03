import test from "node:test";
import { dispatchWorker } from "../../scripts/issue-dispatch.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmod, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dispatchCli = path.join(repoRoot, "scripts/issue-dispatch.mjs");

async function makeFakeWorker(scriptBody) {
  const directory = await mkdtemp(path.join(tmpdir(), "example-dispatch-exit-"));
  const filePath = path.join(directory, "claude");
  await writeFile(filePath, `#!${process.execPath}\n${scriptBody}\n`, "utf8");
  await chmod(filePath, 0o755);
  return filePath;
}

/** Run the dispatch CLI on a verified-looking route and return its exit and last JSON line. */
function runDispatch(executable, { timeoutMs = 10_000 } = {}) {
  const route = {
    agent: "Claude",
    model: "sonnet",
    role: "worker",
    selector: `${executable} --model sonnet`,
    selectable: true,
    verifiable: true,
    timeoutMs,
  };
  const result = spawnSync(
    process.execPath,
    [
      dispatchCli,
      "--route-json", JSON.stringify(route),
      "--issue", "1",
      "--release-policy", "pr-created",
      "--next-milestone", "pr-created",
    ],
    { encoding: "utf8", timeout: 30_000 },
  );
  const lines = result.stdout.trim().split("\n").filter(Boolean);
  return { status: result.status, final: JSON.parse(lines.at(-1)) };
}

test("dispatch CLI exits 0 when the worker exits 0", async () => {
  const worker = await makeFakeWorker("process.exit(0);");
  const { status, final } = runDispatch(worker);
  assert.equal(status, 0);
  assert.equal(final.status, "exited");
});

test("dispatch CLI exits non-zero when the worker executable is missing", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "example-dispatch-missing-"));
  const { status, final } = runDispatch(path.join(directory, "claude"));
  assert.equal(final.status, "failed");
  assert.equal(final.code, null);
  assert.notEqual(status, 0);
});

test("dispatch CLI propagates a worker's non-zero exit code", async () => {
  const worker = await makeFakeWorker("process.exit(3);");
  const { status, final } = runDispatch(worker);
  assert.equal(status, 3);
  assert.equal(final.status, "failed");
});

test("dispatch CLI exits 128 + signal number when the worker is killed by a signal", async () => {
  const worker = await makeFakeWorker('process.kill(process.pid, "SIGTERM");');
  const { status, final } = runDispatch(worker);
  assert.equal(final.status, "failed");
  assert.equal(final.signal, "SIGTERM");
  assert.equal(status, 143);
});

test("dispatch CLI exits 124 when the worker times out", async () => {
  const worker = await makeFakeWorker("setInterval(() => {}, 60_000);");
  const { status, final } = runDispatch(worker, { timeoutMs: 200 });
  assert.equal(final.status, "timeout");
  assert.equal(status, 124);
});

for (const scenario of [
  { name: "accepts a verified Claude alias", agent: "Claude", token: "sonnet", requestedModel: "sonnet", accepted: true },
  { name: "accepts the exact canonical model", agent: "Claude", token: "claude-sonnet-4-6", requestedModel: "sonnet", accepted: true },
  { name: "rejects an unrelated alias", agent: "Claude", token: "opus", requestedModel: "sonnet" },
  { name: "rejects case changes", agent: "Claude", token: "Sonnet", requestedModel: "sonnet" },
  { name: "rejects partial alias matches", agent: "Claude", token: "sonnet-extra", requestedModel: "sonnet" },
  { name: "rejects an absent requested model", agent: "Claude", token: "sonnet" },
  { name: "rejects aliases for a runtime without reported-model resolution", agent: "Codex", token: "sonnet", requestedModel: "sonnet" },
]) {
  test(`dispatch ${scenario.name}`, async () => {
    const launches = [];
    const operation = dispatchWorker({
      route: {
        agent: scenario.agent, role: "worker", model: "claude-sonnet-4-6",
        requestedModel: scenario.requestedModel,
        selector: `claude --model ${scenario.token} --permission-mode bypassPermissions`,
        selectable: true, verifiable: true, timeoutMs: 1000,
      },
      issueNumber: 1, releasePolicy: "pr-created", nextMilestone: "pr-created", cwd: repoRoot,
    }, {
      spawnWorker: async (...args) => {
        launches.push(args);
        return { pid: 123, kill() {}, wait: async () => ({ code: 0 }) };
      },
    });
    if (scenario.accepted) {
      const handle = await operation;
      assert.equal(handle.model, "claude-sonnet-4-6");
      assert.equal(launches.length, 1);
      assert.deepEqual(launches[0][1].slice(0, 2), ["--model", scenario.token]);
    } else {
      await assert.rejects(operation, /^Error: model-mismatch$/);
      assert.equal(launches.length, 0);
    }
  });
}
