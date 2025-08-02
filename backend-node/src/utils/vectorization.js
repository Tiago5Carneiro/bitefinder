class VectorizationUtils {
  static createEmbeddingsFromPreferences(preferences, type = 0) {
    // This is a placeholder implementation
    // In the real system, you'd use proper embedding models

    const vectorSize = 50;
    const vector = new Array(vectorSize).fill(0);

    // Simple hash-based approach for demonstration
    for (const pref of preferences) {
      const hash = this.simpleHash(pref);
      for (let i = 0; i < vectorSize; i++) {
        vector[i] += Math.sin(hash * (i + 1)) * 0.1;
      }
    }

    // Normalize
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    );
    return magnitude > 0 ? vector.map((val) => val / magnitude) : vector;
  }

  static simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  static averageEmbedding(embeddings) {
    if (!embeddings || embeddings.length === 0) return null;

    const length = embeddings[0].length;
    const result = new Array(length).fill(0);

    for (const embedding of embeddings) {
      for (let i = 0; i < length; i++) {
        result[i] += embedding[i];
      }
    }

    return result.map((val) => val / embeddings.length);
  }

  static cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}

module.exports = VectorizationUtils;
