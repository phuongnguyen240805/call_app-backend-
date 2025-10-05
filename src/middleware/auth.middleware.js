import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ message: "Chưa xác thực - Không có token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!decoded) {
      return res.status(401).json({ message: "Chưa xác thực - Token không hợp lệ" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Chưa xác thực - Không tìm thấy người dùng" });
    }

    req.user = user;

    next();
  } catch (error) {
    console.log("Lỗi trong middleware protectRoute", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};
