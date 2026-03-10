import config from '../../config.js';

const MAX_REQUESTS = 3;
const WINDOW_MS = 5 * 60 * 1000;

type RateState = {
  requestTimestamps: number[];
  pendingJob: (() => Promise<void>) | undefined;
  pendingKey: string | undefined;
  timer: NodeJS.Timeout | undefined;
};

const states = new Map<string, RateState>();

const getState = (key: string) => {
  const existing = states.get(key);
  if (existing) return existing;

  const next: RateState = { requestTimestamps: [], pendingJob: undefined, pendingKey: undefined, timer: undefined };
  states.set(key, next);
  return next;
};

const pruneOld = (timestamps: number[], now: number) =>
  timestamps.filter(timestamp => now - timestamp < WINDOW_MS);

const runPendingJob = async (key: string) => {
  const state = states.get(key);
  if (!state?.pendingJob) return;

  const now = Date.now();
  state.requestTimestamps = pruneOld(state.requestTimestamps, now);

  if (state.requestTimestamps.length >= MAX_REQUESTS) {
    const earliest = state.requestTimestamps[0] ?? now;
    const delay = Math.max(0, earliest + WINDOW_MS - now) + 25;
    state.timer = setTimeout(() => {
      runPendingJob(key).catch((error) => {
        console.error(`[embeddings] Deferred job failed for "${key}"`, error);
      });
    }, delay);
    return;
  }

  const job = state.pendingJob;
  state.pendingJob = undefined;
  state.pendingKey = undefined;
  state.timer = undefined;
  state.requestTimestamps.push(now);

  try {
    await job();
    console.log(`[embeddings] Deferred update executed for "${key}"`);
  } catch (error) {
    console.error(`[embeddings] Deferred job failed for "${key}"`, error);
  }
};

export const runOrDeferEmbeddingJob = async (key: string, job: () => Promise<void>) => {
  if (!config.OPENAI_API_KEY) {
    await job();
    return { executed: true, deferred: false };
  }

  const now = Date.now();
  const state = getState(key);
  state.requestTimestamps = pruneOld(state.requestTimestamps, now);

  if (state.requestTimestamps.length < MAX_REQUESTS) {
    state.requestTimestamps.push(now);
    await job();
    return { executed: true, deferred: false };
  }

  state.pendingJob = job;
  state.pendingKey = key;

  if (state.timer) clearTimeout(state.timer);

  const earliest = state.requestTimestamps[0] ?? now;
  const runAt = earliest + WINDOW_MS;
  const delay = Math.max(0, runAt - now) + 25;
  state.timer = setTimeout(() => {
    runPendingJob(key).catch((error) => {
      console.error(`[embeddings] Deferred job failed for "${key}"`, error);
    });
  }, delay);

  console.warn(
    `[embeddings] Rate limit reached for "${key}" (max ${MAX_REQUESTS} per ${WINDOW_MS / 60000} minutes). Deferred latest update.`,
  );

  return {
    executed: false,
    deferred: true,
    retryAt: new Date(runAt),
  };
};
