import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    // Lấy token từ header Authorization (Bearer Token)
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Không tìm thấy Access Token, vui lòng đăng nhập" });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';

    // Xác thực token
    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
        }
        
        // Lưu thông tin giải mã vào req để các route sau có thể sử dụng (ví dụ: lấy req.user.userId)
        req.user = decoded;
        next();
    });
};
