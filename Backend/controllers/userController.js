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
    console.error("getMyProfile error", error.name, error.message);
    return res.status(500).json({ message: "Loi he thong" });
  }
};
