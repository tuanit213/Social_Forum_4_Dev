import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    Username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    hashPassword: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    displayName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80
    },

    avatarUrl: {
        type: String
    },

    avatarId: {
        type: String
    },

    bio:{
        type: String,
        maxlength: 500
    },

    location:{
        type: String,
        trim: true,
        maxlength: 120,
        default: ""
    },

    pronouns:{
        type: String,
        trim: true,
        maxlength: 40,
        default: "Don't specify"
    },

    company:{
        type: String,
        trim: true,
        maxlength: 120,
        default: ""
    },

    showLocalTime:{
        type: Boolean,
        default: false
    },

    contactEmail:{
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 254,
        default: ""
    },

    websiteUrl:{
        type: String,
        trim: true,
        maxlength: 180,
        default: ""
    },

    facebookUrl:{
        type: String,
        trim: true,
        maxlength: 180,
        default: ""
    },

    socialLinks:{
        type: [String],
        default: []
    },

    phone:{
        type: String,
        sparse: true
    },

    stats: {
        experienceYears: { type: Number, default: 0, min: 0 },
        courseCount: { type: Number, default: 0, min: 0 },
        postCount: { type: Number, default: 0, min: 0 },
        globalRank: { type: Number, default: 0, min: 0 },
        currentStreak: { type: Number, default: 0, min: 0 },
        contestCount: { type: Number, default: 0, min: 0 }
    },

    profileDashboard: {
        headline: { type: String, trim: true, maxlength: 120, default: "" },
        coreStack: { type: [String], default: [] },
        experience: { type: String, trim: true, maxlength: 1200, default: "" },
        achievements: { type: [String], default: [] },
        competitions: { type: [String], default: [] },
        topContribution: { type: String, trim: true, maxlength: 180, default: "" }
    },
    role: {
        type: String,
        enum: ["MEMBER", "MODERATOR", "ADMIN", "SUPER_ADMIN"],
        default: "MEMBER",
        index: true
    },
    status: {
        type: String,
        enum: ["active", "warned", "suspended", "banned"],
        default: "active",
        index: true
    },
    warnings: [{
        reason: { type: String, trim: true, maxlength: 500 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now }
    }],
    adminNotes: [{
        note: { type: String, trim: true, maxlength: 1000 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now }
    }],
    lastAdminActionAt: {
        type: Date
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
},
    {
        timestamps: true,
    }
)

userSchema.index({ email: 1 });
userSchema.index({ Username: 1 });
userSchema.index({ role: 1, status: 1, createdAt: -1 });

const User = mongoose.model("User", userSchema);
export default User;
