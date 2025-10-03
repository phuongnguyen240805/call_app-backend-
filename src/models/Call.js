import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat", // cuộc gọi gắn với chat nào
      required: true,
    },
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // người gọi
      required: true,
    },
    callee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // người nhận
    },
    type: {
      type: String,
      enum: ["audio", "video"],
      required: true,
    },
    status: {
      type: String,
      enum: ["ringing", "accepted", "rejected", "ended"],
      default: "ringing",
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Call", callSchema);
