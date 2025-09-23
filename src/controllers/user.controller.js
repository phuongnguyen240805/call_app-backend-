import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate("friends", "fullName profilePic nativeLanguage learningLanguage");

    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Lỗi trong controller lấy danh sách bạn bè", error.message);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    // ngăn gửi lời mời kết bạn cho chính mình
    if (myId === recipientId) {
      return res.status(400).json({ message: "Bạn không thể gửi lời mời kết bạn cho chính mình" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Không tìm thấy người nhận" });
    }

    // kiểm tra đã là bạn bè chưa
    if (recipient.friends.includes(myId)) {
      return res.status(400).json({ message: "Bạn đã là bạn bè với người này" });
    }

    // kiểm tra đã tồn tại lời mời kết bạn chưa
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "Đã tồn tại lời mời kết bạn giữa bạn và người này" });
    }

    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Lỗi trong controller gửi lời mời kết bạn", error.message);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Không tìm thấy lời mời kết bạn" });
    }

    // Xác minh người dùng hiện tại là người nhận
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "Bạn không có quyền chấp nhận lời mời này" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    // thêm mỗi người vào danh sách bạn bè của người kia
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({ message: "Đã chấp nhận lời mời kết bạn" });
  } catch (error) {
    console.log("Lỗi trong controller chấp nhận lời mời kết bạn", error.message);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
}
