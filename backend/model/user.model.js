import db from "../config/db.js";
import { ApiError } from "../utils/api.util.js";
import { DB_ERROR } from "../utils/message.util.js";

export const getUserByPhoneHash = async (phone_hash) => {
  try {
    const result = await db.query(
      "SELECT * FROM users WHERE phone_number = $1 LIMIT 1",
      [phone_hash]
    );

    return result;
  } catch (error) {
    throw new ApiError(DB_ERROR, "User", error, false);
  }
};

export const createUnverifiedUser = async ({ phone_hash, country_code, language }) => {
  try {
    const result = await db.query(
      `INSERT INTO users (id, phone_number, country_code, is_active,language, created_at)
       VALUES (gen_random_uuid(), $1, $2,  true,$3, NOW())
       RETURNING *`,
      [phone_hash, country_code, language]
    );
    return result;
  } catch (error) {
    throw new ApiError(DB_ERROR, "User", error, false);
  }
};


export const createProfileModel = async (updatedFields, id) => {
  const keys = Object.keys(updatedFields);
  const values = Object.values(updatedFields);
  const setClause = keys.map((key) => `${key} = $${keys.indexOf(key) + 1}`).join(", ");
  values.push(id);
  const query = `UPDATE users SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
  return db.query(query, values);
};

export const getUserByIdModel = async (user_id) => {
  const result = await db.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [user_id]);
  return result;
};

export const updateProfileModel = async (updatedFields, id) => {
  const keys = Object.keys(updatedFields);
  const values = Object.values(updatedFields);
  const setClause = keys.map((key) => `${key} = $${keys.indexOf(key) + 1}`).join(", ");
  values.push(id);
  const query = `UPDATE users SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
  return db.query(query, values);
};

export const fetchTermsAndConditionsModel = async () => {
  const result = await db.query("SELECT * FROM content_managment WHERE content_type = 'terms_and_service' LIMIT 1");
  return result;
};

export const fetchPrivacyPolicyModel = async () => {
  const result = await db.query("SELECT * FROM content_managment WHERE content_type = 'privacy_policy' LIMIT 1");
  return result;
};

export const upsertIdentityKeyModel = async (userId, deviceId, registrationId, identityKey) => {
  const query = `INSERT INTO user_identity_keys (user_id, device_id, registration_id, identity_key)
    VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, device_id)
    DO UPDATE SET registration_id = EXCLUDED.registration_id,identity_key = EXCLUDED.identity_key,created_at = CURRENT_TIMESTAMP
  `;
  await db.query(query, [userId, deviceId, registrationId, identityKey,]);
};

export const insertSignedPreKeyModel = async (userId, deviceId, signedPreKeyId, signedPreKey, signature) => {
  const query = `INSERT INTO user_signed_prekeys (user_id, device_id, signed_prekey_id, signed_prekey, signature)
    VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id, device_id, signed_prekey_id) DO UPDATE SET
    signed_prekey = EXCLUDED.signed_prekey,signature = EXCLUDED.signature,created_at = CURRENT_TIMESTAMP
  `;
  await db.query(query, [userId, deviceId, signedPreKeyId, signedPreKey, signature,]);
};

export const fetchIdentityKeyModel = async (userId) => {
  const query = `SELECT registration_id, device_id, identity_key FROM user_identity_keys WHERE user_id = $1 LIMIT 1`;
  const rows = await db.query(query, [userId]);
  return rows[0];
};

export const fetchLatestSignedPreKeyModel = async (userId) => {
  const query = `SELECT signed_prekey_id, signed_prekey, signature FROM user_signed_prekeys
    WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1 `;
  const rows = await db.query(query, [userId]);
  return rows[0];
};

export const consumeOnePreKeyModel = async (userId) => {
  const query = ` DELETE FROM user_prekeys WHERE id = (
      SELECT id FROM user_prekeys WHERE user_id = $1 AND is_used = false
      ORDER BY created_at ASC LIMIT 1 FOR UPDATE) RETURNING prekey_id, public_key`;
  const rows = await db.query(query, [userId]);
  return rows[0] || null;
};


export const fetchActiveDeviceIdModel = async (userId) => {
  const query = `SELECT device_id FROM user_identity_keys WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1 `;
  const rows = await db.query(query, [userId]);
  return rows[0] || null;
};

export const fetchPreKeyCountByDeviceModel = async (userId, deviceId) => {
  const query = `SELECT COUNT(*)::int AS count FROM user_prekeys WHERE user_id = $1 AND device_id = $2 AND is_used = false`;
  const rows = await db.query(query, [userId, deviceId,]);
  return rows[0];
};

export const fetchIdentityKeyOnlyModel = async (userId) => {
  const query = `SELECT identity_key FROM user_identity_keys WHERE user_id = $1 LIMIT 1`;
  const rows = await db.query(query, [userId]);
  return rows[0] || null;
};

export const fetchPreKeyCountModel = async (userId) => {
  const query = `
    SELECT device_id, COUNT(*)::int AS count FROM user_prekeys
    WHERE user_id = $1 AND is_used = false GROUP BY device_id ORDER BY device_id ASC
  `;
  const rows = await db.query(query, [userId]);
  return rows;
};

export const insertAdditionalPreKeysModel = async (userId, deviceId, preKeys) => {
  const values = [];
  const placeholders = [];
  preKeys.forEach((key, index) => {
    const base = index * 4;
    placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
    values.push(userId, deviceId, key.id, key.publicKey);
  });

  const query = `
    INSERT INTO user_prekeys (user_id, device_id, prekey_id, public_key)
    VALUES ${placeholders.join(", ")}
    ON CONFLICT (user_id, device_id, prekey_id) DO NOTHING RETURNING prekey_id
  `;
  const { rows } = await db.query(query, values);
  return rows.length;
};

export const fetchUsersByPhoneHashesModel = async (hashes) => {
  const query = `SELECT * FROM users WHERE phone_number = ANY($1)`;
  const rows = await db.query(query, [hashes]);
  return rows;
};

export const deleteAllPreKeysByUserAndDeviceModel = async (userId, deviceId) => {
  const query = `DELETE FROM user_prekeys WHERE user_id = $1 AND device_id = $2`;
  await db.query(query, [userId, deviceId]);
};

export const insertPreKeysModel = async (userId, deviceId, preKeys) => {
  const values = [];
  const placeholders = [];
  preKeys.forEach((key, index) => {
    const base = index * 4;
    placeholders.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`
    );
    values.push(userId, deviceId, key.id, key.publicKey);
  });
  const query = `INSERT INTO user_prekeys (user_id, device_id, prekey_id, public_key) VALUES ${placeholders.join(", ")}`;
  await db.query(query, values);
};

export const deleteIdentityKeyModel = async (userId, deviceId) => {
  await db.query(`DELETE FROM user_identity_keys WHERE user_id = $1 AND device_id = $2`, [userId, deviceId]);
};

export const deletePreKeysModel = async (userId, deviceId) => {
  await db.query(`DELETE FROM user_prekeys WHERE user_id = $1 AND device_id = $2`, [userId, deviceId]);
};

export const deleteSignedPreKeysModel = async (userId, deviceId) => {
  await db.query(`DELETE FROM user_signed_prekeys WHERE user_id = $1 AND device_id = $2`, [userId, deviceId]);
};

export const getUsersByIdsModel = async (user_ids) => {
  if (!user_ids || user_ids.length === 0) return [];
  const query = `SELECT * FROM users WHERE id = ANY($1) `;
  const rows = await db.query(query, [user_ids]);
  return rows;
};

