import User from "../models/User.js";

const emptyStats = {
  experienceYears: 0,
  courseCount: 0,
  postCount: 0,
  globalRank: 0,
  currentStreak: 0,
  contestCount: 0,
};

const emptyProfileDashboard = {
  headline: "",
  coreStack: [],
  experience: "",
  achievements: [],
  competitions: [],
  topContribution: "",
};

const buildDashboardResponse = (user) => ({
  user: {
    id: user._id,
    username: user.Username,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio || "",
    pronouns: user.pronouns || "Don't specify",
    company: user.company || "",
    location: user.location || "",
    showLocalTime: Boolean(user.showLocalTime),
    contactEmail: user.contactEmail || "",
    websiteUrl: user.websiteUrl || "",
    facebookUrl: user.facebookUrl || "",
    socialLinks: user.socialLinks || [],
  },
  stats: {
    ...emptyStats,
    ...(user.stats?.toObject?.() || user.stats || {}),
  },
  profileDashboard: {
    ...emptyProfileDashboard,
    ...(user.profileDashboard?.toObject?.() || user.profileDashboard || {}),
  },
});

export const getMyDashboardProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "Khong tim thay nguoi dung" });
    }

    return res.status(200).json(buildDashboardResponse(user));
  } catch (error) {
    console.error("getMyDashboardProfile error", error.name, error.message);
    return res.status(500).json({ message: "Loi he thong" });
  }
};

export const updateMyDashboardProfile = async (req, res) => {
  try {
    const {
      displayName,
      bio,
      pronouns,
      company,
      location,
      showLocalTime,
      contactEmail,
      websiteUrl,
      facebookUrl,
      socialLinks,
      headline,
      coreStack,
      experience,
      topContribution,
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $set: {
          ...(displayName ? { displayName } : {}),
          bio,
          pronouns,
          company,
          location,
          showLocalTime,
          contactEmail,
          websiteUrl,
          facebookUrl,
          socialLinks,
          "profileDashboard.headline": headline,
          "profileDashboard.coreStack": coreStack,
          "profileDashboard.experience": experience,
          "profileDashboard.topContribution": topContribution,
        },
      },
      { new: true, runValidators: true },
    );

    if (!user) {
      return res.status(404).json({ message: "Khong tim thay nguoi dung" });
    }

    return res.status(200).json(buildDashboardResponse(user));
  } catch (error) {
    console.error("updateMyDashboardProfile error", error.name, error.message);
    return res.status(500).json({ message: "Loi he thong" });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "Khong tim thay nguoi dung" });
    }

    return res.status(200).json({
      message: "Thong tin ca nhan bao mat",
      user: {
        id: user._id,
        username: user.Username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio || "",
        pronouns: user.pronouns || "Don't specify",
        company: user.company || "",
        location: user.location || "",
        showLocalTime: Boolean(user.showLocalTime),
        contactEmail: user.contactEmail || "",
        websiteUrl: user.websiteUrl || "",
        facebookUrl: user.facebookUrl || "",
        socialLinks: user.socialLinks || [],
      },
    });
  } catch (error) {
    console.error("Lỗi cập nhật dashboard profile:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "Username displayName avatarUrl");
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Lỗi lấy danh sách user:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user.userId;

    const user = await User.findOne({ Username: username });
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const isFollowing = user.followers.includes(currentUserId);
    const followersCount = user.followers.length;
    const followingCount = user.following.length;

    const responseData = buildDashboardResponse(user);
    responseData.followInfo = {
      isFollowing,
      followersCount,
      followingCount
    };

    return res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error("Lỗi lấy thông tin profile:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

export const toggleFollowUser = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user.userId;

    const targetUser = await User.findOne({ Username: username });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    if (targetUser._id.toString() === currentUserId) {
      return res.status(400).json({ success: false, message: "Không thể tự theo dõi chính mình" });
    }

    const isFollowing = targetUser.followers.includes(currentUserId);
    
    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(targetUser._id, { $pull: { followers: currentUserId } });
      await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUser._id } });
      return res.status(200).json({ success: true, isFollowing: false, message: "Đã hủy theo dõi" });
    } else {
      // Follow
      await User.findByIdAndUpdate(targetUser._id, { $addToSet: { followers: currentUserId } });
      await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUser._id } });
      return res.status(200).json({ success: true, isFollowing: true, message: "Đã theo dõi" });
    }
  } catch (error) {
    console.error("Lỗi theo dõi người dùng:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};
