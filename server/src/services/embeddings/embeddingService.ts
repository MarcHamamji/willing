import OpenAI from 'openai';

import config from '../../config.js';

export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 1536;

let openAIClient: OpenAI | null = null;

const getOpenAIClient = () => {
  if (!config.OPENAI_API_KEY) return null;
  if (!openAIClient) {
    openAIClient = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  }
  return openAIClient;
};

export const normalizeTextForEmbedding = (text: string) => {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  return cleaned.length > 0 ? cleaned : 'No meaningful text provided.';
};

const hashTextToSeed = (text: string) => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const seededRandom = (seed: number) => {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

export const normalizeVector = (vector: number[]) => {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) return vector.map(() => 0);
  return vector.map(value => value / magnitude);
};

export const deterministicFallbackVector = (text: string) => {
  const seed = hashTextToSeed(text);
  const random = seededRandom(seed);
  const vector = Array.from({ length: EMBEDDING_DIMENSIONS }, () => (random() * 2) - 1);
  return normalizeVector(vector);
};

export const ensureVectorLength = (vector: number[]) => {
  if (vector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Expected vector length ${EMBEDDING_DIMENSIONS}, got ${vector.length}`);
  }
};

export const embedText = async (text: string): Promise<number[]> => {
  const normalizedText = normalizeTextForEmbedding(text);
  const client = getOpenAIClient();

  if (!client) {
    console.warn('[embeddings] Embedding: FALLBACK (missing OPENAI_API_KEY)');
    return deterministicFallbackVector(normalizedText);
  }

  try {
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: normalizedText,
    });
    const vector = response.data?.[0]?.embedding ?? [];
    ensureVectorLength(vector);
    console.log('[embeddings] Embedding: OpenAI');
    return vector;
  } catch (error) {
    console.warn('[embeddings] Embedding: FALLBACK (OpenAI request failed)', error);
    return deterministicFallbackVector(normalizedText);
  }
};

export const combineVectors = (vectorA: number[], vectorB: number[], weightA: number, weightB: number) => {
  ensureVectorLength(vectorA);
  ensureVectorLength(vectorB);

  const combined = vectorA.map((value, index) => (value * weightA) + ((vectorB[index] ?? 0) * weightB));
  return normalizeVector(combined);
};

export const weightedAverage = (vectors: number[][], weights: number[]) => {
  if (vectors.length === 0) {
    return deterministicFallbackVector('empty weighted average');
  }
  if (vectors.length !== weights.length) {
    throw new Error('Vector and weight counts must match');
  }

  vectors.forEach(ensureVectorLength);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const firstVector = vectors[0];
  if (totalWeight <= 0) {
    return firstVector ? normalizeVector(firstVector) : deterministicFallbackVector('empty weighted average');
  }

  const accumulator = new Array(EMBEDDING_DIMENSIONS).fill(0);
  vectors.forEach((vector, vectorIndex) => {
    const normalizedWeight = (weights[vectorIndex] ?? 0) / totalWeight;
    for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
      accumulator[i] += (vector[i] ?? 0) * normalizedWeight;
    }
  });

  return normalizeVector(accumulator);
};

export const vectorToSqlLiteral = (vector: number[]) => {
  ensureVectorLength(vector);
  return `[${vector.map(value => Number(value.toFixed(8))).join(',')}]`;
};

export const parseVectorLiteral = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return null;

  const parts = trimmed.slice(1, -1).split(',').map(part => Number(part.trim()));
  if (parts.some(part => Number.isNaN(part)) || parts.length !== EMBEDDING_DIMENSIONS) {
    return null;
  }
  return parts;
};

export const computeVolunteerOpportunityScore = (profileSimilarity: number, experienceSimilarity: number | null) => {
  if (experienceSimilarity === null || Number.isNaN(experienceSimilarity)) {
    return 0.6 * profileSimilarity;
  }
  return (0.6 * profileSimilarity) + (0.4 * experienceSimilarity);
};
