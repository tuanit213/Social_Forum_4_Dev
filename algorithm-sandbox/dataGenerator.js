/**
 * dataGenerator.js
 * Sinh dữ liệu giả (Users, Posts, Interactions) để thử nghiệm thuật toán EdgeRank
 */

const { faker } = require("@faker-js/faker");

const NUM_USERS = 50;
const NUM_POSTS = 200;
const NUM_INTERACTIONS = 1500;

function generateData() {
  console.log("Generating fake data...");

  // 1. Generate Users
  const users = [];
  for (let i = 1; i <= NUM_USERS; i++) {
    users.push({
      id: `U${i}`,
      name: faker.person.fullName(),
      affinityScores: {}, // Lịch sử độ thân thiết tính toán sau
    });
  }

  // 2. Generate Posts
  const posts = [];
  const now = new Date();
  for (let i = 1; i <= NUM_POSTS; i++) {
    const author = faker.helpers.arrayElement(users);
    // Ngày đăng: random trong vòng 7 ngày qua
    const createdAt = faker.date.recent({ days: 7 });

    posts.push({
      id: `P${i}`,
      authorId: author.id,
      authorName: author.name,
      content: faker.lorem.sentences(2),
      tags: faker.helpers.arrayElements(
        ["javascript", "react", "nodejs", "algorithm", "system-design"],
        2,
      ),
      createdAt,
      stats: { views: 0, likes: 0, comments: 0 },
    });
  }

  // 3. Generate Interactions
  const interactions = [];
  const interactionTypes = ["view", "like", "comment", "share"];
  // Trọng số xác suất: view rất nhiều, like vừa, comment ít
  const interactionWeights = [0.6, 0.25, 0.1, 0.05];

  for (let i = 0; i < NUM_INTERACTIONS; i++) {
    const user = faker.helpers.arrayElement(users);
    const post = faker.helpers.arrayElement(posts);

    // User không tự tương tác với bài của mình (giả sử)
    if (user.id === post.authorId) continue;

    // Đảm bảo tương tác xảy ra SAU khi bài viết được đăng
    const interactedAt = faker.date.between({ from: post.createdAt, to: now });
    const type = faker.helpers.weightedArrayElement(
      interactionTypes.map((t, index) => ({
        weight: interactionWeights[index],
        value: t,
      })),
    );

    // Cập nhật stats ảo cho dễ nhìn
    post.stats[`${type}s`] = (post.stats[`${type}s`] || 0) + 1;

    interactions.push({
      userId: user.id,
      postId: post.id,
      postAuthorId: post.authorId,
      type,
      createdAt: interactedAt,
    });
  }

  console.log(
    `Generated ${users.length} users, ${posts.length} posts, ${interactions.length} interactions.`,
  );
  return { users, posts, interactions };
}

module.exports = { generateData };
