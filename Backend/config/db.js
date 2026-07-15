import mongoose from 'mongoose';

/**
 * Hàm kết nối tới cơ sở dữ liệu MongoDB.
 * Sử dụng try-catch để bắt và xử lý lỗi kết nối để dễ debug.
 */
const connectDB = async () => {
  try {
    // process.env.MONGODB_URI hiện đang để trống theo yêu cầu
    if (!process.env.MONGODB_URI) {
      console.warn("Cảnh báo: MONGODB_URI đang trống. Bỏ qua kết nối database.");
      return;
    }
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Lỗi kết nối MongoDB: ${error.message}`);
    // Dừng tiến trình server nếu xảy ra lỗi kết nối nghiêm trọng
    process.exit(1);
  }
};

export default connectDB;
