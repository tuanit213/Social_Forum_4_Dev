import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Sign Up Function
export const signUp = async (req, res) => {
    try {
        const { username, password, email, firstName, lastName } = req.body;

        if (!username || !password || !email || !firstName || !lastName) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
        }

        // Kiểm tra user đã tồn tại (dựa vào Username hoặc email)
        const duplicateUser = await User.findOne({ $or: [{ Username: username }, { email: email }] });
        if (duplicateUser) {
            return res.status(409).json({ message: "Tên người dùng hoặc email đã tồn tại" });
        }

        // Mã hóa thông tin password
        const hashedPassword = await bcrypt.hash(password, 10); 
        
        // Tạo user mới (Chú ý field Username viết hoa theo model)
        await User.create({
            Username: username,
            hashPassword: hashedPassword,
            email,
            displayName: `${firstName} ${lastName}`,
        });
        
        return res.status(201).json({ message: "Đăng ký thành công!" });
    }
    catch (error) {
        console.error('Lỗi khi call signUp', error);
        return res.status(500).json({ message: 'Lỗi hệ thống' });
    }
}

// Sign In Function
export const signIn = async (req, res) => {
    try {
        // Lấy thông tin từ request
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ message: "Thiếu Username hoặc Password" });
        }
        
        // Tìm user trong DB theo Username
        const user = await User.findOne({ Username: username });
        if (!user) {
            return res.status(401).json({ message: "Username hoặc password không chính xác" });
        }
        
        // So sánh password
        const passwordCorrect = await bcrypt.compare(password, user.hashPassword);
        if (!passwordCorrect) {
            return res.status(401).json({ message: "Username hoặc password không chính xác" });
        }
        
        // Tạo JWT Token
        const tokenPayload = { userId: user._id, username: user.Username };
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';
        
        const accessToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '15m' });
        const refreshToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '7d' });
        
        // Lưu refresh token vào cookie (httpOnly)
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        // Return Access Token và thông tin user về client
        return res.status(200).json({
            message: "Đăng nhập thành công",
            accessToken,
            user: {
                id: user._id,
                username: user.Username,
                email: user.email,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl
            }
        });

    } catch (error) {
        console.error('Lỗi khi call signIn', error);
        return res.status(500).json({ message: 'Lỗi hệ thống' });
    }
}

// Refresh Token Function
export const refreshToken = async (req, res) => {
    try {
        const refreshTokenCookie = req.cookies.refreshToken;
        if (!refreshTokenCookie) {
            return res.status(401).json({ message: "Không tìm thấy refresh token" });
        }

        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';
        
        // Xác minh refresh token
        jwt.verify(refreshTokenCookie, jwtSecret, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: "Refresh token không hợp lệ hoặc đã hết hạn" });
            }

            // Tìm user
            const user = await User.findById(decoded.userId);
            if (!user) {
                return res.status(404).json({ message: "Không tìm thấy người dùng" });
            }

            // Cấp lại accessToken mới
            const tokenPayload = { userId: user._id, username: user.Username };
            const newAccessToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '15m' });

            return res.status(200).json({
                accessToken: newAccessToken,
                user: {
                    id: user._id,
                    username: user.Username,
                    email: user.email,
                    displayName: user.displayName,
                    avatarUrl: user.avatarUrl
                }
            });
        });

    } catch (error) {
        console.error('Lỗi khi call refreshToken', error);
        return res.status(500).json({ message: 'Lỗi hệ thống' });
    }
}

// Sign Out Function
export const signOut = async (req, res) => {
    try {
        // Xóa cookie refreshToken
        res.clearCookie('refreshToken');
        return res.status(200).json({ message: "Đăng xuất thành công" });
    } catch (error) {
        console.error('Lỗi khi call signOut', error);
        return res.status(500).json({ message: 'Lỗi hệ thống' });
    }
}