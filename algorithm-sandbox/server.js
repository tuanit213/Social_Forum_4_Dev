const express = require('express');
const cors = require('cors');
const { generateData } = require('./dataGenerator');
const { calculateEdgeRank } = require('./edgerank');
const {
  buildUserProfileTags,
  calculateContentScore,
  buildUserItemMatrix,
  findSimilarUsers,
  calculateCollaborativeScore
} = require('./recommendation');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let users = [];
let posts = [];
let interactions = [];

function resetData() {
  const data = generateData();
  users = data.users;
  posts = data.posts;
  interactions = data.interactions;
}

resetData();

// API: Lấy danh sách Users để làm chức năng "User Switcher"
app.get('/api/users', (req, res) => {
  // Lấy ra 5 user đầu tiên cho dễ test
  res.json(users.slice(0, 5));
});

// API: Lấy News Feed (Hybrid Algorithm)
app.get('/api/feed', (req, res) => {
  const targetUserId = req.query.userId || users[0].id;
  const targetUser = users.find(u => u.id === targetUserId);
  
  if (!targetUser) return res.status(404).json({ error: 'User not found' });

  // 1. Phân tích Profile & Ma trận (Chạy real-time để bắt tương tác mới)
  const userTags = buildUserProfileTags(targetUserId, interactions, posts);
  const matrix = buildUserItemMatrix(interactions);
  const similarUsers = findSimilarUsers(targetUserId, matrix, 3); // Lấy top 3 người giống nhất

  const scoredPosts = [];
  
  for (const post of posts) {
    if (post.authorId === targetUserId) continue; // Bỏ qua bài của chính mình
    
    // Thuật toán 1: EdgeRank
    const edgeRankResult = calculateEdgeRank(targetUserId, post, interactions);
    const eScore = parseFloat(edgeRankResult.score);
    
    // Thuật toán 2: Content-Based
    // Nhân 10 để Scale lên gần tương đương với EdgeRank
    const cScore = calculateContentScore(userTags, post.tags) * 10; 
    
    // Thuật toán 3: Collaborative Filtering
    const cfScore = calculateCollaborativeScore(post, similarUsers, matrix);
    
    // Gộp (Hybrid)
    const finalScore = (eScore * 0.4) + (cScore * 0.3) + (cfScore * 0.3);

    scoredPosts.push({
      ...edgeRankResult,
      cScore: cScore.toFixed(2),
      cfScore: cfScore.toFixed(2),
      eScore: eScore.toFixed(2),
      score: finalScore.toFixed(4)
    });
  }

  scoredPosts.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));

  res.json({
    user: targetUser,
    similarUsers: similarUsers, // Gửi về Frontend để vẽ biểu đồ
    userTags: userTags,
    feed: scoredPosts,
    totalPosts: posts.length
  });
});

// API: Lấy dữ liệu Đồ thị (Graph Visualization)
app.get('/api/graph', (req, res) => {
  const nodes = [];
  const edges = [];
  
  // Chỉ lấy giới hạn 10 Users và 20 Posts để Graph không bị quá tải
  const limitUsers = users.slice(0, 10);
  const limitUserIds = limitUsers.map(u => u.id);
  
  // 1. Thêm Nodes (Users)
  limitUsers.forEach(u => {
    nodes.push({ id: u.id, label: u.name, group: 'users', title: 'User' });
  });

  // 2. Tính toán ma trận và độ tương đồng giữa các Users này
  const matrix = buildUserItemMatrix(interactions);
  const processedEdges = new Set();

  limitUsers.forEach(u => {
    const similarUsers = findSimilarUsers(u.id, matrix, 3); // Top 3 người giống nhất
    similarUsers.forEach(su => {
      if (limitUserIds.includes(su.userId)) {
        // Tạo edge (Cạnh) thể hiện sự tương đồng (Collaborative)
        const edgeId1 = `${u.id}-${su.userId}`;
        const edgeId2 = `${su.userId}-${u.id}`;
        
        if (!processedEdges.has(edgeId1) && !processedEdges.has(edgeId2)) {
          edges.push({
            from: u.id,
            to: su.userId,
            value: su.similarity, // Độ dày của cạnh dựa trên Similarity
            title: `Độ tương đồng: ${(su.similarity * 100).toFixed(1)}%`,
            color: { color: '#10b981' }, // Màu xanh ngọc (Emerald)
            dashes: true // Nét đứt thể hiện quan hệ ngầm
          });
          processedEdges.add(edgeId1);
        }
      }
    });
  });

  // 3. Thêm Nodes (Posts) và Cạnh Tương tác (Interactions)
  // Tìm các Post đã được tương tác bởi top 10 Users này
  const relevantInteractions = interactions.filter(i => limitUserIds.includes(i.userId));
  const postIds = [...new Set(relevantInteractions.map(i => i.postId))].slice(0, 20); // Giới hạn 20 bài

  postIds.forEach(pid => {
    const post = posts.find(p => p.id === pid);
    if (post) {
      nodes.push({ id: pid, label: `Post ${pid}`, group: 'posts', title: post.content.substring(0,50)+'...' });
    }
  });

  // Thêm cạnh Tương tác (User -> Post)
  relevantInteractions.forEach(i => {
    if (postIds.includes(i.postId)) {
      edges.push({
        from: i.userId,
        to: i.postId,
        title: `Tương tác: ${i.type}`,
        color: { color: '#6366f1' }, // Màu xanh dương (Indigo) cho tương tác
        arrows: 'to'
      });
    }
  });

  res.json({ nodes, edges });
});

app.post('/api/regenerate', (req, res) => {
  resetData();
  res.json({ message: 'Đã tạo mới dữ liệu thành công!' });
});

app.post('/api/interact', (req, res) => {
  const { userId, postId, type } = req.body; 
  
  const post = posts.find(p => p.id === postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  interactions.push({
    userId: userId,
    postId: post.id,
    postAuthorId: post.authorId,
    type: type,
    createdAt: new Date()
  });

  post.stats[`${type}s`] = (post.stats[`${type}s`] || 0) + 1;
  res.json({ message: 'Tương tác thành công', post });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Sandbox Visualizer is running at http://localhost:${PORT}`);
});
