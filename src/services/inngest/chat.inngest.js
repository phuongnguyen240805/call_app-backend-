import Chat from "../../models/Chat.js";
import { inngest } from "./inngestClient.js";

// Inngest function: Tạo chat mới giữa 2 user (nếu chưa có)
const inngestCreateChat = inngest.createFunction(
  { id: "inngest-create-chat" },
  { event: "chat/create" },
  async ({ event }) => {
    try {
      const { userId, participantId } = event.data;
      if (!userId || !participantId || userId === participantId) {
        throw new Error("Invalid participants");
      }

      // Kiểm tra đã có chat giữa 2 người chưa
      let chat = await Chat.findOne({
        isGroup: false,
        participants: { $all: [userId, participantId], $size: 2 },
      });

      if (chat) {
        return { chat, created: false };
      }

      chat = await Chat.create({
        participants: [userId, participantId],
        isGroup: false,
      });

      return { chat, created: true };
    } catch (error) {
      console.error("Inngest create chat error:", error.message);
      throw error;
    }
  }
);

// Inngest function: Gửi tin nhắn vào chat
const inngestSendMessage = inngest.createFunction(
  { id: "inngest-send-message" },
  { event: "chat/send_message" },
  async ({ event }) => {
    try {
      const { chatId, senderId, content } = event.data;
      if (!chatId || !senderId || !content) {
        throw new Error("Missing data to send message");
      }

      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.includes(senderId)) {
        throw new Error("Chat not found or sender not in chat");
      }

      const newMessage = {
        sender: senderId,
        content,
        sentAt: new Date(),
        readBy: [senderId],
      };

      chat.messages.push(newMessage);
      chat.lastMessage = content;
      chat.lastMessageAt = new Date();

      await chat.save();

      return { success: true, message: newMessage, chatId };
    } catch (error) {
      console.error("Inngest send message error:", error.message);
      throw error;
    }
  }
);
