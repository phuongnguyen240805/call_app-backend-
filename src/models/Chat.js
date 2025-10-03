import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        // Optionally, you can add type: text, image, etc.
        sentAt: {
            type: Date,
            default: Date.now,
        },
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { _id: false }
);

const chatSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        messages: [messageSchema],
        lastMessage: {
            type: String,
        },
        lastMessageAt: {
            type: Date,
        },
        isGroup: {
            type: Boolean,
            default: false,
        },
        groupName: {
            type: String,
        },
        groupAvatar: {
            type: String,
        },
    },
    { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
