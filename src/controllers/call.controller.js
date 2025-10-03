import Call from "../models/Call.js";

export async function startCall(req, res) {
  try {
    const userId = req.user.id;
    const { chatId, type } = req.body; // type: 'audio' | 'video'

    const call = await Call.create({
      chat: chatId,
      caller: userId,
      type,
      status: "ringing",
    });

    // Emit sự kiện đến user khác qua socket
    req.io.to(chatId).emit("incoming_call", {
      callId: call._id,
      chatId,
      caller: userId,
      type,
    });

    res.status(201).json(call);
  } catch (error) {
    console.error("Lỗi khi tạo call:", error.message);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
}

// Nhận SDP offer/answer từ client
export async function signaling(req, res) {
  try {
    const { callId, sdp, candidate } = req.body;

    // Gửi tiếp cho peer khác qua socket
    req.io.to(callId).emit("signaling", { sdp, candidate });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Lỗi signaling:", error.message);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
}
