import Post from "../models/Post.js";
import User from "../models/User.js";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const globalSearch = async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 200) : "";
    const type = ["all", "post", "user"].includes(req.query.type) ? req.query.type : "all";
    const pageValue = Number.parseInt(req.query.page, 10);
    const limitValue = Number.parseInt(req.query.limit, 10);
    const page = Number.isFinite(pageValue) ? Math.max(pageValue, 1) : 1;
    const limitNum = Number.isFinite(limitValue) ? Math.min(Math.max(limitValue, 1), 50) : 20;

    if (!q) {
      return res.status(200).json({ success: true, data: { posts: [], users: [] } });
    }

    const skip = (page - 1) * limitNum;

    let postsPromise = Promise.resolve([]);
    let usersPromise = Promise.resolve([]);

    // Tìm kiếm bài viết (dùng Text Index)
    if (type === "all" || type === "post") {
      postsPromise = Post.find(
        { $text: { $search: q } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .skip(skip)
        .limit(limitNum)
        .populate("userId", "Username displayName avatarUrl")
        .lean();
    }

    // Tìm kiếm người dùng (dùng Regex trên Username và displayName)
    if (type === "all" || type === "user") {
      const userSearch = new RegExp(escapeRegExp(q), "i");
      usersPromise = User.find({
        $or: [
          { Username: userSearch },
          { displayName: userSearch }
        ]
      })
        .skip(skip)
        .limit(limitNum)
        .select("Username displayName avatarUrl bio followers stats")
        .lean();
    }

    const [postsResult, usersResult] = await Promise.allSettled([postsPromise, usersPromise]);

    const posts = postsResult.status === "fulfilled" ? postsResult.value : [];
    const users = usersResult.status === "fulfilled" ? usersResult.value : [];
    
    if (postsResult.status === "rejected") {
      console.error("Posts search error:", postsResult.reason);
    }
    if (usersResult.status === "rejected") {
      console.error("Users search error:", usersResult.reason);
    }

    console.log(`[Search API] q: "${q}", type: "${type}"`);
    console.log(`[Search API] Results -> posts: ${posts.length}, users: ${users.length}`);

    return res.status(200).json({
      success: true,
      data: {
        posts,
        users
      }
    });

  } catch (error) {
    console.error("Lỗi khi tìm kiếm:", error);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống khi tìm kiếm" });
  }
};
