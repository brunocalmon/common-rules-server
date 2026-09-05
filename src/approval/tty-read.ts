/**
 * A synchronous line read off a real terminal.
 *
 * `fs.readFileSync(0, "utf8")` — the interactive channel's original
 * approach — throws `EAGAIN: resource temporarily unavailable` on a TTY
 * file descriptor instead of blocking for input. This isn't specific to
 * one platform or one container: a terminal typically opens its file
 * descriptor non-blocking, and a synchronous read against a non-blocking
 * descriptor with no data yet ready fails immediately rather than waiting —
 * every real interactive run of `common-rules setup` hit this, every time,
 * confirmed by reproducing it under a real pseudo-terminal.
 *
 * The fix keeps the whole approval flow synchronous — `DecisionSource.ask()`
 * returns a plain `boolean`, not a `Promise` — by retrying past `EAGAIN`
 * with a real (not `Promise`-based) blocking sleep, one byte at a time
 * until a newline. This is the same technique synchronous terminal-input
 * libraries use internally; it costs no new dependency, which was this
 * fatia's original goal.
 */

/** The two low-level primitives a real terminal read needs, isolated so the retry logic is testable without one. */
export interface SyncReader {
  /** Same contract as `fs.readSync`: reads at most `buffer.length` bytes, returns the count. Throws on `EAGAIN` when nothing is ready yet. */
  readSync(fd: number, buffer: Buffer): number;
  /** Blocks the calling thread for real; a `Promise`-based delay can't be awaited from synchronous code. */
  sleep(ms: number): void;
}

/** `Atomics.wait` on a throwaway buffer: the standard way to block a Node main thread for a fixed duration without a subprocess. */
function atomicsSleep(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** The real reader, used outside tests. */
export function realSyncReader(readSync: (fd: number, buffer: Buffer) => number): SyncReader {
  return { readSync, sleep: atomicsSleep };
}

const NEWLINE = 10;
const RETRY_DELAY_MS = 20;

/**
 * Reads one line from `fd`, retrying past `EAGAIN` instead of failing on it.
 *
 * Stops at a newline or at EOF (`readSync` returning 0, which happens when
 * the descriptor is closed — e.g. Ctrl-D — not on an ordinary Enter key).
 * A trailing `\r` is stripped so the result reads the same on every
 * platform's terminal.
 */
export function readTtyLine(reader: SyncReader, fd = 0): string {
  const chunks: Buffer[] = [];
  const byte = Buffer.alloc(1);
  for (;;) {
    let n: number;
    try {
      n = reader.readSync(fd, byte);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "EAGAIN") {
        reader.sleep(RETRY_DELAY_MS);
        continue;
      }
      throw err;
    }
    if (n === 0 || byte[0] === NEWLINE) break;
    chunks.push(Buffer.from(byte));
  }
  return Buffer.concat(chunks).toString("utf8").replace(/\r$/, "");
}
