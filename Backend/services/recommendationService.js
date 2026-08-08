// 1. CONTENT-BASED FILTERING (JACCARD SIMILARITY)

/**
 * Trích xuất "Hồ sơ Sở thích" của User dựa trên các tags của bài viết họ đã tương tác.
 */
export const buildUserProfileTags = (targetUserId, allInteractions, allPosts) => {
  const userInteractions = allInteractions.filter(i => i.userId.toString() === targetUserId.toString());
  const preferredTags = new Set();

  userInteractions.forEach(interaction => {
    const post = allPosts.find(p => p._id.toString() === interaction.postId.toString());
    if (post && post.tags && post.tags.length > 0) {
      post.tags.forEach(tag => preferredTags.add(tag));
    }
  });

  return Array.from(preferredTags);
};

export const calculateContentScore = (userTags, postTags) => {
  if (!userTags || userTags.length === 0 || !postTags || postTags.length === 0) return 0;
  
  const intersection = userTags.filter(tag => postTags.includes(tag));
  const union = new Set([...userTags, ...postTags]);
  
  return intersection.length / union.size;
};

// 2. COLLABORATIVE FILTERING (COSINE SIMILARITY)

export const buildUserItemMatrix = (allInteractions) => {
  const matrix = {};
  const ratings = { view: 1, like: 3, reaction: 3, comment: 5, share: 10 };

  allInteractions.forEach(i => {
    const uid = i.userId.toString();
    const pid = i.postId.toString();

    if (!matrix[uid]) matrix[uid] = {};
    const currentRating = matrix[uid][pid] || 0;
    matrix[uid][pid] = currentRating + (ratings[i.type] || 1);
  });
  
  return matrix;
};

const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB) return 0;
  const allItems = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  allItems.forEach(item => {
    const a = vecA[item] || 0;
    const b = vecB[item] || 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  });

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const findSimilarUsers = (targetUserId, userItemMatrix, topK = 5) => {
  const targetStr = targetUserId.toString();
  const targetVector = userItemMatrix[targetStr];
  if (!targetVector) return [];

  const similarities = [];
  for (const userId in userItemMatrix) {
    if (userId === targetStr) continue;
    const sim = cosineSimilarity(targetVector, userItemMatrix[userId]);
    if (sim > 0) {
      similarities.push({ userId, similarity: sim });
    }
  }

  return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
};

export const calculateCollaborativeScore = (post, similarUsers, userItemMatrix) => {
  let score = 0;
  let simSum = 0;
  const pid = post._id.toString();

  similarUsers.forEach(su => {
    const suRating = userItemMatrix[su.userId][pid] || 0;
    if (suRating > 0) {
      score += suRating * su.similarity;
      simSum += su.similarity;
    }
  });

  if (simSum === 0) return 0;
  return (score / simSum) * 2; 
};
