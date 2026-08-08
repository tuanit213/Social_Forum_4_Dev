/**
 * recommendation.js
 * Các thuật toán Lọc Cộng Tác (Collaborative Filtering) và Dựa trên Nội dung (Content-Based)
 */

// 1. CONTENT-BASED FILTERING (JACCARD SIMILARITY)

/**
 * Trích xuất "Hồ sơ Sở thích" của User dựa trên các tags của bài viết họ đã tương tác.
 * Trả về một Set các tags.
 */
function buildUserProfileTags(userId, allInteractions, allPosts) {
  const userInteractions = allInteractions.filter(i => i.userId === userId);
  const preferredTags = new Set();

  userInteractions.forEach(interaction => {
    const post = allPosts.find(p => p.id === interaction.postId);
    if (post && post.tags) {
      post.tags.forEach(tag => preferredTags.add(tag));
    }
  });

  return Array.from(preferredTags);
}

/**
 * Tính điểm Content-Based bằng Jaccard Similarity (Giao / Hợp)
 * Giữa User's Preferred Tags và Post's Tags
 */
function calculateContentScore(userTags, postTags) {
  if (!userTags || userTags.length === 0 || !postTags || postTags.length === 0) return 0;
  
  const intersection = userTags.filter(tag => postTags.includes(tag));
  const union = new Set([...userTags, ...postTags]);
  
  // Trả về giá trị từ 0.0 đến 1.0
  return intersection.length / union.size;
}

// 2. COLLABORATIVE FILTERING (COSINE SIMILARITY)

/**
 * Xây dựng Ma trận User-Item
 * Trả về Object dạng: { U1: { P1: 1, P2: 3 }, U2: { P1: 5, P3: 1 } ... }
 */
function buildUserItemMatrix(allInteractions) {
  const matrix = {};
  // Tính điểm ngầm (implicit rating) dựa trên loại tương tác
  const ratings = { view: 1, like: 3, comment: 5, share: 10 };

  allInteractions.forEach(i => {
    if (!matrix[i.userId]) matrix[i.userId] = {};
    const currentRating = matrix[i.userId][i.postId] || 0;
    // Cộng dồn điểm tương tác nếu user tương tác nhiều lần với 1 bài
    matrix[i.userId][i.postId] = currentRating + (ratings[i.type] || 1);
  });
  
  return matrix;
}

/**
 * Tính Cosine Similarity giữa 2 User dựa trên vector Item Ratings
 */
function cosineSimilarity(vecA, vecB) {
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
}

/**
 * Tìm K người giống User hiện tại nhất
 */
function findSimilarUsers(targetUserId, userItemMatrix, topK = 5) {
  const targetVector = userItemMatrix[targetUserId];
  if (!targetVector) return [];

  const similarities = [];
  for (const userId in userItemMatrix) {
    if (userId === targetUserId) continue;
    const sim = cosineSimilarity(targetVector, userItemMatrix[userId]);
    if (sim > 0) {
      similarities.push({ userId, similarity: sim });
    }
  }

  // Sắp xếp giảm dần theo độ tương đồng
  return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}

/**
 * Tính điểm Collaborative Filtering cho 1 Post đối với Target User
 * Dựa trên những người dùng có độ tương đồng (Similar Users) đã tương tác với Post này
 */
function calculateCollaborativeScore(post, similarUsers, userItemMatrix) {
  let score = 0;
  let simSum = 0;

  similarUsers.forEach(su => {
    const suRating = userItemMatrix[su.userId][post.id] || 0;
    if (suRating > 0) {
      // Nếu người giống mình có tương tác bài này, cộng điểm theo độ tương đồng
      score += suRating * su.similarity;
      simSum += su.similarity;
    }
  });

  if (simSum === 0) return 0;
  // Chuẩn hóa điểm về khoảng nhỏ để dễ gộp với EdgeRank (giả sử tối đa ~10-15đ)
  return (score / simSum) * 2; 
}

module.exports = {
  buildUserProfileTags,
  calculateContentScore,
  buildUserItemMatrix,
  findSimilarUsers,
  calculateCollaborativeScore
};
