import Chat from "../models/Chat.js";
import User from "../models/User.js";
import { inngest } from "../services/inngest/inngestClient.js";

// Lấy danh sách các cuộc trò chuyện của user
export async function getMyChats(req, res) {
  try {
    const userId = req.user.id;
    const chats = await Chat.find({ participants: userId })
      .sort({ updatedAt: -1 })
      .populate("participants", "fullName profilePic")
      .select("-messages"); // chỉ lấy thông tin chung, không lấy hết messages

    res.status(200).json(chats);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách chat:", error.message);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
}

// Lấy cuộc trò chuyện bằng ID (bao gồm messages)
export async function getChatById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(id)
      .populate("participants", "fullName profilePic")
      .lean();

    if (!chat || !chat.participants.some(p => p._id.toString() === userId)) {
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết chat:", error.message);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
}

// Gửi tin nhắn (tạo mới hoặc thêm vào chat đã có) - sử dụng inngest
export async function sendMessage(req, res) {
  try {
    const userId = req.user.id;
    const { chatId, content } = req.body;

    if (!content || !chatId) {
      return res.status(400).json({ message: "Thiếu thông tin gửi tin nhắn" });
    }

    // Gửi event cho inngest để xử lý lưu message
    const { data, error } = await inngest.send({
      name: "chat/send_message",
      data: {
        chatId,
        senderId: userId,
        content,
      },
    });

    if (error) {
      console.error("Inngest error:", error);
      return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
    }

    // Lấy lại chat để trả về message mới nhất
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }
    const newMessage = chat.messages[chat.messages.length - 1];

    // Có thể emit socket ở đây nếu có

    res.status(201).json({ success: true, message: newMessage });
  } catch (error) {
    console.error("Lỗi khi gửi tin nhắn:", error.message);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
}

// Tạo cuộc trò chuyện mới (nếu chưa có) - sử dụng inngest
export async function createChat(req, res) {
  try {
    const userId = req.user.id;
    const { participantId } = req.body;

    if (!participantId || participantId === userId) {
      return res.status(400).json({ message: "Người tham gia không hợp lệ" });
    }

    // Gửi event cho inngest để xử lý tạo chat
    const { data, error } = await inngest.send({
      name: "chat/create",
      data: {
        userId,
        participantId,
      },
    });

    if (error) {
      console.error("Inngest error:", error);
      return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
    }

    // Lấy lại chat vừa tạo hoặc đã tồn tại
    let chat = await Chat.findOne({
      isGroup: false,
      participants: { $all: [userId, participantId], $size: 2 },
    });

    if (!chat) {
      // fallback: lấy theo id nếu inngest trả về id
      if (data && data.chat && data.chat._id) {
        chat = await Chat.findById(data.chat._id);
      }
    }

    if (!chat) {
      return res.status(500).json({ message: "Không thể tạo cuộc trò chuyện" });
    }

    res.status(data && data.created ? 201 : 200).json(chat);
  } catch (error) {
    console.error("Lỗi khi tạo cuộc trò chuyện:", error.message);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
}
