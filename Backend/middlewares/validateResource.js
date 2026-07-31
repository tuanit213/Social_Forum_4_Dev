import mongoose from "mongoose";

// Middleware kiểm tra ObjectId hợp lệ trong params
export const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: `ID không hợp lệ (${paramName})` });
    }
    next();
  };
};

// Hàm tiện ích để kiểm tra ID trong body hoặc xử lý nội bộ
export const isValidId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};
