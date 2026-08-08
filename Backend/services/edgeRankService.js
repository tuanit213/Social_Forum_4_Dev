// Bảng trọng số điểm cho từng loại tương tác
const WEIGHTS = {
  view: 0.1,
  like: 1.0,
  reaction: 1.5,
  comment: 3.0,
  share: 5.0
};

/**
 * Tính điểm Affinity (Mức độ thân thiết) giữa 1 User và 1 Author
 * Dựa trên lịch sử tương tác và trạng thái Follow.
 */
export const calculateAffinity = (targetUserId, authorId, allInteractions, targetUserFollowingIds) => {
  if (targetUserId.toString() === authorId.toString()) return 0; // Không tính điểm cho bản thân

  let affinityScore = 1.0; // Điểm cơ bản
  
  // 1. Điểm Follow (Rất quan trọng)
  if (targetUserFollowingIds.includes(authorId.toString())) {
      affinityScore += 10.0;
  }

  // 2. Điểm Tương tác trong quá khứ
  const pastInteractions = allInteractions.filter(
    i => i.userId.toString() === targetUserId.toString() && i.postAuthorId.toString() === authorId.toString()
  );

  for (const interaction of pastInteractions) {
    const weight = WEIGHTS[interaction.type] || 0;
    affinityScore += weight;
  }

  // Giới hạn Affinity tối đa (tránh việc buff quá đà)
  return Math.min(affinityScore, 20);
};

/**
 * Tính tổng điểm Weight của bản thân Bài viết (Độ hot chung)
 */
export const calculatePostWeight = (post) => {
  const views = post.views || 0;
  const likes = (post.upvotes ? post.upvotes.length : 0);
  const comments = post.commentsCount || 0;
  
  // Tính tổng số reaction
  let reactionsCount = 0;
  if (post.reactions && post.reactions.length > 0) {
      post.reactions.forEach(r => reactionsCount += (r.users ? r.users.length : 0));
  }
  
  let totalWeight = 
    (views * WEIGHTS.view) + 
    (likes * WEIGHTS.like) + 
    (reactionsCount * WEIGHTS.reaction) + 
    (comments * WEIGHTS.comment);
    
  return totalWeight;
};

/**
 * Hàm số chống lão hóa (Time Decay)
 * HackerNews Gravity Model
 */
export const calculateTimeDecay = (createdAt) => {
  const now = new Date();
  const postDate = new Date(createdAt);
  
  const diffInHours = Math.abs(now - postDate) / 36e5;
  const decayScore = Math.pow((diffInHours + 2), 1.5);
  
  return decayScore;
};

/**
 * Tính điểm EdgeRank cuối cùng cho 1 bài Post đối với 1 Target User cụ thể
 */
export const calculateEdgeRank = (targetUserId, targetUserFollowingIds, post, allInteractions) => {
  const U = calculateAffinity(targetUserId, post.userId, allInteractions, targetUserFollowingIds);
  const W = calculatePostWeight(post);
  const D = calculateTimeDecay(post.createdAt);
  
  const effectiveW = W === 0 ? 1 : W; // Lót đường cho bài mới
  const score = (U * effectiveW) / D;
  
  return {
    postId: post._id.toString(),
    U,
    W: effectiveW,
    D,
    eScore: score
  };
};
