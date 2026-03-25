/**
 * Embedding Service - Skeleton for semantic search
 * Phase 2: Core Services
 * 
 * This provides a foundation for vector embeddings.
 * Full implementation would use sentence-transformers or external APIs.
 */

import { getConfig } from '../config.js';

/**
 * Generate embedding vector for text
 * Currently returns placeholder - requires full implementation
 * 
 * TODO: Implement actual embedding generation
 * - Option 1: Local TF-IDF fallback (for offline mode)
 * - Option 2: sentence-transformers for local embeddings
 * - Option 3: External API (OpenAI, Cohere)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const config = getConfig();
  
  switch (config.embeddingModel) {
    case 'local':
      return generateLocalEmbedding(text);
    case 'openai':
      return generateOpenAIEmbedding(text);
    case 'cohere':
      return generateCohereEmbedding(text);
    default:
      // Default to local TF-IDF fallback
      return generateLocalEmbedding(text);
  }
}

/**
 * Local TF-IDF based embedding (fallback for offline mode)
 * This is a simplified version - production would use proper TF-IDF
 */
function generateLocalEmbedding(text: string): number[] {
  // Simplified TF-IDF-like vector generation
  // In production, this would use a proper TF-IDF implementation
  
  const dimension = 384; // Standard embedding dimension
  const words = text.toLowerCase().split(/\s+/);
  const wordFreq = new Map<string, number>();
  
  // Count word frequencies
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  }
  
  // Create simple hash-based vector
  const vector = new Array(dimension).fill(0);
  for (const [word, freq] of wordFreq) {
    const hash = hashString(word);
    const index = hash % dimension;
    vector[index] += freq / words.length;
  }
  
  // Normalize
  return normalizeVector(vector);
}

/**
 * Generate hash from string
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Normalize vector to unit length
 */
function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) return vector;
  return vector.map(v => v / magnitude);
}

/**
 * OpenAI embedding API (stub)
 */
async function generateOpenAIEmbedding(text: string): Promise<number[]> {
  // TODO: Implement OpenAI API call
  // const response = await fetch('https://api.openai.com/v1/embeddings', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     model: 'text-embedding-3-small',
  //     input: text,
  //   }),
  // });
  
  console.warn('OpenAI embedding not implemented - using local fallback');
  return generateLocalEmbedding(text);
}

/**
 * Cohere embedding API (stub)
 */
async function generateCohereEmbedding(text: string): Promise<number[]> {
  // TODO: Implement Cohere API call
  console.warn('Cohere embedding not implemented - using local fallback');
  return generateLocalEmbedding(text);
}

/**
 * Chunk text for large documents
 * Vector models typically have token limits (e.g., 4096)
 */
export function chunkText(text: string, maxTokens: number = 4096): string[] {
  // Rough estimation: 1 token ≈ 4 characters
  const maxChars = maxTokens * 4;
  
  if (text.length <= maxChars) {
    return [text];
  }
  
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]\s+/);
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChars) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Aggregate chunk embeddings into single vector
 * Uses mean pooling
 */
export function aggregateEmbeddings(embeddings: number[][]): number[] {
  if (embeddings.length === 0) {
    return [];
  }
  
  const dimension = embeddings[0].length;
  const sum = new Array(dimension).fill(0);
  
  for (const embedding of embeddings) {
    for (let i = 0; i < dimension; i++) {
      sum[i] += embedding[i];
    }
  }
  
  return sum.map(v => v / embeddings.length);
}

/**
 * Compute cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimension');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  
  return dotProduct / denominator;
}

/**
 * Store embedding in memory record
 * Called after memory creation if vectors enabled
 */
export async function updateMemoryEmbedding(
  memoryId: string,
  embedding: number[]
): Promise<void> {
  const { getDatabase } = await import('../db/connection.js');
  const db = getDatabase();
  
  const embeddingJson = JSON.stringify(embedding);
  
  const stmt = db.prepare('UPDATE memories SET embedding = ? WHERE id = ?');
  stmt.run(embeddingJson, memoryId);
}