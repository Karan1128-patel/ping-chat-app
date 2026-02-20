import { apiHandler, apiResponse } from "../utils/api.util.js";
import * as chatService from "../services/chat.service.js";
import { getMessageByLang } from "../utils/misc.util.js";
import { CUSTOM_SUCCESS } from "../utils/message.util.js";

let sendMessageHitCount = 0;
export const sendMessage = apiHandler(async (req, res) => {
  sendMessageHitCount++;

  console.log(`📩 sendMessage API hit count: ${sendMessageHitCount}`);
  let language = req.user.language || "en";
  const senderId = req.user.id;
  const { receiver_id, conversation_id, encrypted_message, message_type, timestamp } = req.body;
  const message = await chatService.sendMessageServiceBySocket({
    sender_id: senderId, sender_device_id: req.body.sender_device_id,
    receiver_id, reciver_device_id: req.body.reciver_device_id, conversation_id,
    encrypted_payload: encrypted_message, created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    message_type, timestamp
  });
  return apiResponse(CUSTOM_SUCCESS, getMessageByLang(language, "Message_sent"), message, res);
});

export const messageRead = apiHandler(async (req, res) => {
  const { message_id, sender_id, sender_device_id, receiver_id, receiver_device_id, conversation_id } = req.body;
  const result = await chatService.messageReadService({ message_id, sender_id, sender_device_id, receiver_id, receiver_device_id, conversation_id });
  return apiResponse(CUSTOM_SUCCESS,"Message marked as read",result,res);
});
