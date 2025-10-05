import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

export async function signup(req, res) {
  const { email, password, fullName } = req.body;

  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ tất cả các trường" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Định dạng email không hợp lệ" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại, vui lòng sử dụng email khác" });
    }

    const idx = Math.floor(Math.random() * 100) + 1; // sinh số ngẫu nhiên từ 1-100
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    const newUser = await User.create({
      email,
      fullName,
      password,
      profilePic: randomAvatar,
    });

    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      console.log(`Đã tạo user Stream cho ${newUser.fullName}`);
    } catch (error) {
      console.log("Lỗi khi tạo user Stream:", error);
    }

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true, // ngăn chặn XSS
      sameSite: "none", // cho phép cookie cross-domain
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.log("Lỗi trong controller đăng ký", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ tất cả các trường" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true, // ngăn chặn XSS
      sameSite: "strict", // ngăn chặn CSRF
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Lỗi trong controller đăng nhập", error.message);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
}

export function logout(req, res) {
  res.clearCookie("jwt");
  res.status(200).json({ success: true, message: "Đăng xuất thành công" });
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;

    const { fullName, bio, nativeLanguage, learningLanguage, location } = req.body;

    if (!fullName || !bio || !nativeLanguage || !learningLanguage || !location) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ tất cả các trường",
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !location && "location",
        ].filter(Boolean),
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      console.log(`Đã cập nhật user Stream sau khi onboarding cho ${updatedUser.fullName}`);
    } catch (streamError) {
      console.log("Lỗi khi cập nhật user Stream trong quá trình onboarding:", streamError.message);
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Lỗi onboarding:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
}
