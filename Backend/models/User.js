import mogoose from "mongoose";

const userSchema = new mogoose.Schema({
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
        trim: true
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

    phone:{
        type: String,
        sparse: true
    }
},
    {
        timestamps: true,
    }
)

const User = mogoose.model("User", userSchema);
export default User;