/**
 * Controller để xử lý logic cho các endpoint mẫu.
 * Tất cả các hàm đều dùng try-catch để bắt lỗi dễ dàng.
 */

// @desc    Lấy dữ liệu mẫu
// @route   GET /api/sample
// @access  Public
export const getSample = async (req, res, next) => {
  try {
    // Chèn logic lấy dữ liệu vào đây (VD: tìm trong DB)
    const data = { id: 1, name: "Sample Data" };
    
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error); // Chuyển lỗi tới errorHandler để xử lý tập trung
  }
};

// @desc    Tạo mới dữ liệu mẫu
// @route   POST /api/sample
// @access  Public
export const createSample = async (req, res, next) => {
  try {
    const { title } = req.body;
    
    // Validate cơ bản
    if (!title) {
      res.status(400); // Bad Request
      throw new Error("Vui lòng cung cấp title!"); // Bắn ra lỗi, errorHandler sẽ nhận lấy
    }
    
    // Chèn logic lưu dữ liệu vào đây
    
    res.status(201).json({
      success: true,
      message: `Đã tạo thành công dữ liệu: ${title}`,
    });
  } catch (error) {
    next(error);
  }
};
