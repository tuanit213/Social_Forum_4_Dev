/**
 * test.js
 * Script chạy thử nghiệm toàn bộ luồng tạo dữ liệu và tính điểm EdgeRank
 */

const { generateData } = require('./dataGenerator');
const { calculateEdgeRank } = require('./edgerank');

// 1. Tạo tập dữ liệu khổng lồ
const data = generateData();
const { users, posts, interactions } = data;

// Chọn 1 Target User ngẫu nhiên (Ví dụ User 1)
const targetUser = users[0];
console.log(`\n--- Đang tính toán News Feed cho Target User: ${targetUser.name} (${targetUser.id}) ---`);

// 2. Chạy thuật toán chấm điểm toàn bộ bài viết trong hệ thống đối với Target User này
const scoredPosts = [];

for (const post of posts) {
  // Bỏ qua bài viết của chính Target User
  if (post.authorId === targetUser.id) continue;
  
  const result = calculateEdgeRank(targetUser.id, post, interactions);
  scoredPosts.push(result);
}

// 3. Xếp hạng bài viết (Ranking)
// Sắp xếp giảm dần theo Điểm Score
scoredPosts.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));

// 4. In ra Top 15 bài viết tốt nhất sẽ được hiển thị trên News Feed
console.log(`\nTop 15 bài viết trên News Feed của ${targetUser.name}:`);
console.table(scoredPosts.slice(0, 15));

// 5. Thử in ra 5 bài viết dở nhất (bị chôn vùi dưới đáy)
console.log(`\nTop 5 bài viết đội sổ (ít được hiển thị nhất):`);
console.table(scoredPosts.slice(-5));
