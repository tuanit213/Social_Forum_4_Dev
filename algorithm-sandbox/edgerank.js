/**
 * edgerank.js
 * Logic tính toán điểm số phân phối bài viết
 */

// Bảng trọng số điểm cho từng loại tương tác
const WEIGHTS = {
  view: 0.1,
  like: 1.0,
  comment: 3.0,
  share: 5.0
};

/**
 * Tính điểm Affinity (Mức độ thân thiết) giữa 1 User và 1 Author
 * Dựa trên lịch sử tương tác trước đây của User với Author đó.
 */
function calculateAffinity(userId, authorId, allInteractions) {
  if (userId === authorId) return 0; // Tự tương tác với mình không tính điểm

  // Lấy các tương tác mà User này đã thực hiện với các bài viết của Author này
  const pastInteractions = allInteractions.filter(
    i => i.userId === userId && i.postAuthorId === authorId
  );

  let affinityScore = 1.0; // Base score (Mặc định ai cũng có 1 điểm)
  
  for (const interaction of pastInteractions) {
    const weight = WEIGHTS[interaction.type] || 0;
    affinityScore += weight;
  }

  // Tối đa Affinity Score là 10 (tránh việc 1 người buff quá nhiều điểm cho 1 người)
  return Math.min(affinityScore, 10);
}

/**
 * Tính tổng điểm Weight của bản thân Bài viết (Độ hot chung)
 */
function calculatePostWeight(post) {
  const { views = 0, likes = 0, comments = 0, shares = 0 } = post.stats;
  
  let totalWeight = 
    (views * WEIGHTS.view) + 
    (likes * WEIGHTS.like) + 
    (comments * WEIGHTS.comment) + 
    (shares * WEIGHTS.share);
    
  return totalWeight;
}

/**
 * Hàm số chống lão hóa (Time Decay)
 * Tính theo HackerNews Gravity Model cải tiến
 */
function calculateTimeDecay(createdAt) {
  const now = new Date();
  const postDate = new Date(createdAt);
  
  // Tính độ trễ theo đơn vị Giờ
  const diffInHours = Math.abs(now - postDate) / 36e5;
  
  // Công thức: 1 / (T + 2)^G (Gravity G = 1.5)
  // Nghĩa là bài viết càng cũ, mẫu số càng to -> Điểm Decay càng nhỏ (gần 0)
  const decayScore = Math.pow((diffInHours + 2), 1.5);
  
  return decayScore;
}

/**
 * Tính điểm EdgeRank cuối cùng cho 1 bài Post đối với 1 Target User cụ thể
 */
function calculateEdgeRank(targetUserId, post, allInteractions) {
  const U = calculateAffinity(targetUserId, post.authorId, allInteractions);
  const W = calculatePostWeight(post);
  const D = calculateTimeDecay(post.createdAt);
  
  // Nếu W bằng 0 (bài mới tinh), ta cộng thêm 1 điểm lót (base weight) để bài mới có cơ hội hiển thị
  const effectiveW = W === 0 ? 1 : W;

  const score = (U * effectiveW) / D;
  
  return {
    postId: post.id,
    authorName: post.authorName,
    content: post.content.substring(0, 30) + '...',
    stats: post.stats,
    createdAt: post.createdAt,
    U: U.toFixed(2),
    W: effectiveW.toFixed(2),
    D: D.toFixed(2),
    score: score.toFixed(4)
  };
}

module.exports = { calculateEdgeRank };
