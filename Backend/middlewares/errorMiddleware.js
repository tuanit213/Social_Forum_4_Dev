/**
 * Middleware bắt các request đến endpoint không tồn tại (404)
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Đẩy lỗi xuống errorHandler
};

/**
 * Middleware xử lý lỗi tập trung.
 * Bất kỳ lỗi nào trong ứng dụng (từ try-catch) sẽ được chuyển về đây 
 * để trả thông báo lỗi rõ ràng dạng JSON cho client, giúp dễ debug.
 */
const errorHandler = (err, req, res, next) => {
  // Nếu status code vẫn là 200 dù có lỗi, chuyển thành 500 (Internal Server Error)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode);
  
  res.json({
    message: err.message,
    // Hiển thị stack trace chi tiết nếu đang ở môi trường phát triển (development)
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export { notFound, errorHandler };
