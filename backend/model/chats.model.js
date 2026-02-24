import db from "../config/db.js";

export const insertMessage = async ({
  message_type,
  sender_id,
  receiver_id,
  encrypted_payload,
  conversation_id,
  status,
  sender_device_id,
  reciver_device_id,
  timestamp
}) => {
  const result = await db.query(
    `INSERT INTO messages
     (id, sender_id,receiver_id,message_type, encrypted_payload, created_at, conversation_id,status,sender_device_id,reciver_device_id,timestamp)
     VALUES ($1, $2, $3, $4, $5, NOW(), $6,$7,$8,$9,$10)
     RETURNING *`,
    [conversation_id, sender_id, receiver_id, message_type, encrypted_payload, conversation_id, status,sender_device_id,reciver_device_id,timestamp]
  );

  return result;
};

export const markDeliveredModel = async (messageIds, userId) => {
  if (!messageIds || messageIds.length === 0) return;

  const query = `
    INSERT INTO message_status (message_id, user_id, status)
    SELECT id, $2, 'delivered'
    FROM messages
    WHERE id = ANY($1::uuid[])
    ON CONFLICT (message_id, user_id)
    DO UPDATE SET status = 'delivered'
  `;

  return db.query(query, [messageIds, userId]);
};

export const markSeenModel = async ({ ids, userId }) => {
  const result = await db.query(`UPDATE message_status SET status = 'seen' WHERE message_id IN (${ids}) AND user_id = '${userId}'`);
  return result;
};

export const getPendingMessagesByDevice = async (receiver_id) => {
  const result = await db.query(
    `SELECT * FROM messages WHERE receiver_id = $1 AND status IN ('sent','delivered') ORDER BY created_at ASC`, [receiver_id]
  );
  return result || [];
};

export const updateMessageStatus = async (message_id, status) => {
  const query = `
    UPDATE messages
    SET status = $1,
        delivered_at = CASE WHEN $1 = 'delivered' THEN NOW() ELSE delivered_at END,
        read_at = CASE WHEN $1 = 'read' THEN NOW() ELSE read_at END
    WHERE id = $2
    RETURNING *;
  `;
  const result = await db.query(query, [status, message_id]);
  return result.rows[0];
};


export const deleteMessage = async (message_id) => {
  return db.query(
    `DELETE FROM messages WHERE id = $1`,
    [message_id]
  );
};

export const setUserOnline = async (user_id, device_id) => {
  await db.query(
    `UPDATE users
     SET active_status = true,
         last_seen = NULL
     WHERE id = $1`,
    [user_id]
  );

  await db.query(
    `UPDATE user_identity_keys
     SET active_status = true
     WHERE user_id = $1
       AND device_id = $2`,
    [user_id, device_id]
  );

  return { success: true };
};

export const setUserOffline = async (user_id, device_id) => {
  await db.query(
    `UPDATE user_identity_keys
     SET active_status = false
     WHERE user_id = $1
       AND device_id = $2`,
    [user_id, device_id]
  );

  const activeDevices = await db.query(
    `SELECT 1
     FROM user_identity_keys
     WHERE user_id = $1
       AND active_status = true
     LIMIT 1`,
    [user_id]
  );

  if (activeDevices.length === 0) {
    await db.query(
      `UPDATE users
       SET active_status = false,
           last_seen = NOW()
       WHERE id = $1`,
      [user_id]
    );
  }

  return { success: true };
};

export const getMessageById = async (messageId) => {
  const query = `
    SELECT *
    FROM messages
    WHERE id = $1
    LIMIT 1
  `;

  const  rows  = await db.query(query, [messageId]);
  return rows[0] || null;
};


export const deleteMessagesByDevice = async (userId, deviceId) => {
  const query = `DELETE FROM messages WHERE (sender_id = $1 AND sender_device_id = $2) OR (receiver_id = $1 AND reciver_device_id = $2)`;
  await db.query(query, [userId, deviceId]);
};
