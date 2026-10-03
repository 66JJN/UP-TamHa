import { randomUUID } from 'node:crypto';
import { dataMode } from '../config/env.js';
import { getSqlPool, sql } from '../db/pool.js';
import { memoryStore } from '../data/memoryStore.js';
import { AppError } from '../lib/errors.js';

const isMemory = dataMode === 'memory';

function attachMemoryItem(item) {
  const profile = memoryStore.profiles.find((entry) => entry.id === item.owner_profile_id);
  const images = memoryStore.images.filter((image) => image.item_id === item.id);
  return {
    ...item,
    owner_name: profile?.nickname || 'ผู้ใช้งาน',
    owner_avatar_kind: profile?.avatar_kind || 'CAT',
    owner_has_avatar: Boolean(profile?.avatar_blob_name),
    image_count: images.length,
    images: images.map((image) => ({ id: image.id, content_type: image.content_type })),
  };
}

function attachSqlCover(row) {
  const { cover_image_id: coverImageId, cover_image_content_type: coverImageContentType, ...item } = row;
  return {
    ...item,
    images: coverImageId ? [{ id: coverImageId, content_type: coverImageContentType }] : [],
  };
}

function profileView(profile) {
  if (!profile) return null;
  const { password_hash: _passwordHash, username: _username, ...safe } = profile;
  return { ...safe, has_avatar: Boolean(profile.avatar_blob_name ?? profile.has_avatar), has_credentials: Boolean(profile.password_hash ?? profile.has_credentials) };
}

export async function createProfile({ nickname, avatarKind, username = null, passwordHash = null }) {
  if (isMemory) {
    if (username && memoryStore.profiles.some((entry) => entry.username === username)) {
      const error = new Error('Username already exists'); error.number = 2601; throw error;
    }
    const profile = { id: randomUUID(), nickname, username, password_hash: passwordHash, avatar_kind: avatarKind, created_at: new Date().toISOString() };
    memoryStore.profiles.push(profile);
    return profileView(profile);
  }
  const pool = await getSqlPool();
  const result = await pool.request()
    .input('nickname', sql.NVarChar(60), nickname)
    .input('username', sql.NVarChar(40), username)
    .input('passwordHash', sql.NVarChar(255), passwordHash)
    .input('avatarKind', sql.NVarChar(10), avatarKind)
    .query(`INSERT INTO profiles (nickname, username, password_hash, avatar_kind)
      OUTPUT INSERTED.id, INSERTED.nickname, INSERTED.username, INSERTED.password_hash, INSERTED.avatar_kind, INSERTED.created_at
      VALUES (@nickname, @username, @passwordHash, @avatarKind)`);
  return profileView(result.recordset[0]);
}

export async function getProfileById(id) {
  if (isMemory) {
    const profile = memoryStore.profiles.find((entry) => entry.id === id);
    return profileView(profile);
  }
  const pool = await getSqlPool();
  const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`
    SELECT id, nickname, avatar_kind, created_at,
      CASE WHEN avatar_blob_name IS NULL THEN CAST(0 AS BIT) ELSE CAST(1 AS BIT) END AS has_avatar,
      CASE WHEN password_hash IS NULL THEN CAST(0 AS BIT) ELSE CAST(1 AS BIT) END AS has_credentials
    FROM profiles WHERE id = @id`);
  return result.recordset[0] || null;
}

export async function getAccountByUsername(username) {
  if (isMemory) return memoryStore.profiles.find((entry) => entry.username === username) || null;
  const pool = await getSqlPool();
  const result = await pool.request().input('username', sql.NVarChar(40), username).query(`
    SELECT id, nickname, username, password_hash, avatar_kind, created_at,
      CASE WHEN avatar_blob_name IS NULL THEN CAST(0 AS BIT) ELSE CAST(1 AS BIT) END AS has_avatar
    FROM profiles WHERE username = @username`);
  return result.recordset[0] || null;
}

export async function setProfileCredentials(id, username, passwordHash) {
  if (isMemory) {
    if (memoryStore.profiles.some((entry) => entry.id !== id && entry.username === username)) {
      const error = new Error('Username already exists'); error.number = 2601; throw error;
    }
    const profile = memoryStore.profiles.find((entry) => entry.id === id);
    if (!profile) throw new AppError(404, 'profile_not_found', 'ไม่พบโปรไฟล์');
    Object.assign(profile, { username, password_hash: passwordHash });
    return profileView(profile);
  }
  const pool = await getSqlPool();
  await pool.request().input('id', sql.UniqueIdentifier, id).input('username', sql.NVarChar(40), username)
    .input('passwordHash', sql.NVarChar(255), passwordHash)
    .query('UPDATE profiles SET username = @username, password_hash = @passwordHash WHERE id = @id');
  return getProfileById(id);
}

export async function createSession(profileId, tokenHash, expiresAt) {
  if (isMemory) {
    memoryStore.sessions.push({ token_hash: tokenHash, profile_id: profileId, expires_at: expiresAt.toISOString() });
    return;
  }
  const pool = await getSqlPool();
  await pool.request().input('tokenHash', sql.Char(64), tokenHash).input('profileId', sql.UniqueIdentifier, profileId)
    .input('expiresAt', sql.DateTime2, expiresAt)
    .query('INSERT INTO sessions (token_hash, profile_id, expires_at) VALUES (@tokenHash, @profileId, @expiresAt)');
}

export async function getProfileBySession(tokenHash) {
  if (isMemory) {
    const session = memoryStore.sessions.find((entry) => entry.token_hash === tokenHash && new Date(entry.expires_at) > new Date());
    return session ? getProfileById(session.profile_id) : null;
  }
  const pool = await getSqlPool();
  const result = await pool.request().input('tokenHash', sql.Char(64), tokenHash).query(`
    SELECT p.id, p.nickname, p.avatar_kind, p.created_at,
      CASE WHEN p.avatar_blob_name IS NULL THEN CAST(0 AS BIT) ELSE CAST(1 AS BIT) END AS has_avatar,
      CAST(1 AS BIT) AS has_credentials
    FROM sessions s JOIN profiles p ON p.id = s.profile_id
    WHERE s.token_hash = @tokenHash AND s.expires_at > SYSUTCDATETIME()`);
  return result.recordset[0] || null;
}

export async function deleteSession(tokenHash) {
  if (isMemory) {
    memoryStore.sessions = memoryStore.sessions.filter((entry) => entry.token_hash !== tokenHash);
    return;
  }
  const pool = await getSqlPool();
  await pool.request().input('tokenHash', sql.Char(64), tokenHash).query('DELETE FROM sessions WHERE token_hash = @tokenHash');
}

export async function updateProfile(id, changes) {
  const existing = await getProfileById(id);
  if (!existing) throw new AppError(404, 'profile_not_found', 'ไม่พบโปรไฟล์');
  if (isMemory) {
    const profile = memoryStore.profiles.find((entry) => entry.id === id);
    Object.assign(profile, changes);
    if (changes.avatar_kind) {
      delete profile.avatar_blob_name;
      delete profile.avatar_content_type;
      delete profile.avatar_local_path;
    }
    return profileView(profile);
  }
  const pool = await getSqlPool();
  const request = pool.request().input('id', sql.UniqueIdentifier, id);
  const sets = [];
  if (changes.nickname !== undefined) { request.input('nickname', sql.NVarChar(60), changes.nickname); sets.push('nickname = @nickname'); }
  if (changes.avatar_kind !== undefined) {
    request.input('avatarKind', sql.NVarChar(10), changes.avatar_kind);
    sets.push('avatar_kind = @avatarKind', 'avatar_blob_name = NULL', 'avatar_content_type = NULL');
  }
  if (sets.length) await request.query(`UPDATE profiles SET ${sets.join(', ')} WHERE id = @id`);
  return getProfileById(id);
}

export async function setProfileAvatar(id, blobName, contentType, localPath = null) {
  if (isMemory) {
    const profile = memoryStore.profiles.find((entry) => entry.id === id);
    if (!profile) throw new AppError(404, 'profile_not_found', 'ไม่พบโปรไฟล์');
    Object.assign(profile, { avatar_kind: 'CUSTOM', avatar_blob_name: blobName, avatar_content_type: contentType, avatar_local_path: localPath });
    return profileView(profile);
  }
  const pool = await getSqlPool();
  await pool.request().input('id', sql.UniqueIdentifier, id)
    .input('blobName', sql.NVarChar(500), blobName).input('contentType', sql.NVarChar(100), contentType)
    .query(`UPDATE profiles SET avatar_kind = 'CUSTOM', avatar_blob_name = @blobName, avatar_content_type = @contentType WHERE id = @id`);
  return getProfileById(id);
}

export async function getProfileAvatarRecord(id) {
  if (isMemory) {
    const profile = memoryStore.profiles.find((entry) => entry.id === id);
    if (!profile?.avatar_blob_name) return null;
    return { blob_name: profile.avatar_blob_name, content_type: profile.avatar_content_type, local_path: profile.avatar_local_path };
  }
  const pool = await getSqlPool();
  const result = await pool.request().input('id', sql.UniqueIdentifier, id)
    .query('SELECT avatar_blob_name AS blob_name, avatar_content_type AS content_type FROM profiles WHERE id = @id AND avatar_blob_name IS NOT NULL');
  return result.recordset[0] || null;
}

export async function listItems(filters = {}) {
  const limit = Math.min(Math.max(Number(filters.limit) || 24, 1), 50);
  const offset = Math.max(Number(filters.offset) || 0, 0);
  if (isMemory) {
    const q = String(filters.q || '').trim().toLocaleLowerCase('th');
    const filtered = memoryStore.items.filter((item) => {
      if (filters.reportType && item.report_type !== filters.reportType) return false;
      if (filters.building && item.building_code !== filters.building) return false;
      if (filters.category && item.category !== filters.category) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.room && item.room !== filters.room) return false;
      return !q || `${item.title} ${item.description}`.toLocaleLowerCase('th').includes(q);
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { items: filtered.slice(offset, offset + limit).map(attachMemoryItem), total: filtered.length };
  }
  const pool = await getSqlPool();
  const request = pool.request().input('limit', sql.Int, limit).input('offset', sql.Int, offset);
  const where = [];
  const bindings = [
    ['reportType', 'i.report_type', sql.NVarChar(10)], ['building', 'i.building_code', sql.NVarChar(10)],
    ['category', 'i.category', sql.NVarChar(60)], ['status', 'i.status', sql.NVarChar(30)], ['room', 'i.room', sql.NVarChar(100)],
  ];
  for (const [key, column, type] of bindings) if (filters[key]) { request.input(key, type, filters[key]); where.push(`${column} = @${key}`); }
  if (filters.q) { request.input('q', sql.NVarChar(200), `%${filters.q}%`); where.push('(i.title LIKE @q OR i.description LIKE @q)'); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const result = await request.query(`
    SELECT i.*, p.nickname AS owner_name, p.avatar_kind AS owner_avatar_kind,
      CASE WHEN p.avatar_blob_name IS NULL THEN CAST(0 AS BIT) ELSE CAST(1 AS BIT) END AS owner_has_avatar,
      (SELECT COUNT(*) FROM item_images im WHERE im.item_id = i.id) AS image_count,
      cover.id AS cover_image_id, cover.content_type AS cover_image_content_type,
      COUNT(*) OVER() AS total_count
    FROM items i JOIN profiles p ON p.id = i.owner_profile_id
    OUTER APPLY (
      SELECT TOP 1 im.id, im.content_type FROM item_images im
      WHERE im.item_id = i.id ORDER BY im.created_at, im.id
    ) cover
    ${clause}
    ORDER BY i.created_at DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`);
  return {
    items: result.recordset.map(({ total_count: _total, ...row }) => attachSqlCover(row)),
    total: result.recordset[0]?.total_count || 0,
  };
}

export async function getItemById(id) {
  if (isMemory) {
    const item = memoryStore.items.find((entry) => entry.id === id);
    return item ? attachMemoryItem(item) : null;
  }
  const pool = await getSqlPool();
  const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`
    SELECT i.*, p.nickname AS owner_name, p.avatar_kind AS owner_avatar_kind,
      CASE WHEN p.avatar_blob_name IS NULL THEN CAST(0 AS BIT) ELSE CAST(1 AS BIT) END AS owner_has_avatar,
      (SELECT COUNT(*) FROM item_images im WHERE im.item_id = i.id) AS image_count
    FROM items i JOIN profiles p ON p.id = i.owner_profile_id WHERE i.id = @id`);
  const item = result.recordset[0];
  if (!item) return null;
  const imageResult = await pool.request().input('itemId', sql.UniqueIdentifier, id)
    .query('SELECT id, content_type FROM item_images WHERE item_id = @itemId ORDER BY created_at');
  return { ...item, images: imageResult.recordset };
}

export async function createItem(profileId, data) {
  if (isMemory) {
    const item = { id: randomUUID(), owner_profile_id: profileId, report_type: data.reportType, title: data.title, description: data.description, category: data.category, building_code: data.buildingCode, room: data.room, event_date: data.eventDate, contact_note: data.contactNote || '', status: 'OPEN', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    memoryStore.items.push(item);
    return attachMemoryItem(item);
  }
  const pool = await getSqlPool();
  const result = await pool.request().input('profileId', sql.UniqueIdentifier, profileId)
    .input('reportType', sql.NVarChar(10), data.reportType).input('title', sql.NVarChar(160), data.title)
    .input('description', sql.NVarChar(2000), data.description).input('category', sql.NVarChar(60), data.category)
    .input('buildingCode', sql.NVarChar(10), data.buildingCode).input('room', sql.NVarChar(100), data.room)
    .input('eventDate', sql.DateTime2, new Date(data.eventDate)).input('contactNote', sql.NVarChar(500), data.contactNote || null)
    .query(`INSERT INTO items (owner_profile_id, report_type, title, description, category, building_code, room, event_date, contact_note)
      OUTPUT INSERTED.id VALUES (@profileId, @reportType, @title, @description, @category, @buildingCode, @room, @eventDate, @contactNote)`);
  return getItemById(result.recordset[0].id);
}

export async function updateItem(id, profileId, changes) {
  const existing = await getItemById(id);
  if (!existing) throw new AppError(404, 'item_not_found', 'ไม่พบประกาศ');
  if (String(existing.owner_profile_id) !== profileId) throw new AppError(403, 'not_item_owner', 'แก้ไขได้เฉพาะประกาศของโปรไฟล์นี้');
  const allowed = ['title', 'description', 'category', 'building_code', 'room', 'event_date', 'contact_note', 'status'];
  const normalized = Object.fromEntries(Object.entries(changes).filter(([key, value]) => allowed.includes(key) && value !== undefined));
  if (isMemory) {
    const item = memoryStore.items.find((entry) => entry.id === id);
    Object.assign(item, normalized, { updated_at: new Date().toISOString() });
    return attachMemoryItem(item);
  }
  if (!Object.keys(normalized).length) return existing;
  const pool = await getSqlPool();
  const request = pool.request().input('id', sql.UniqueIdentifier, id);
  const typeMap = { title: sql.NVarChar(160), description: sql.NVarChar(2000), category: sql.NVarChar(60), building_code: sql.NVarChar(10), room: sql.NVarChar(100), event_date: sql.DateTime2, contact_note: sql.NVarChar(500), status: sql.NVarChar(30) };
  const sets = [];
  for (const [key, value] of Object.entries(normalized)) { request.input(key, typeMap[key], key === 'event_date' ? new Date(value) : value); sets.push(`${key} = @${key}`); }
  await request.query(`UPDATE items SET ${sets.join(', ')}, updated_at = SYSUTCDATETIME() WHERE id = @id`);
  return getItemById(id);
}

export async function listItemsByProfile(profileId) {
  if (isMemory) return memoryStore.items.filter((item) => item.owner_profile_id === profileId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(attachMemoryItem);
  const pool = await getSqlPool();
  const result = await pool.request().input('profileId', sql.UniqueIdentifier, profileId).query(`
    SELECT i.*, p.nickname AS owner_name, p.avatar_kind AS owner_avatar_kind,
      CASE WHEN p.avatar_blob_name IS NULL THEN CAST(0 AS BIT) ELSE CAST(1 AS BIT) END AS owner_has_avatar,
      (SELECT COUNT(*) FROM item_images im WHERE im.item_id = i.id) AS image_count,
      cover.id AS cover_image_id, cover.content_type AS cover_image_content_type
    FROM items i JOIN profiles p ON p.id = i.owner_profile_id
    OUTER APPLY (
      SELECT TOP 1 im.id, im.content_type FROM item_images im
      WHERE im.item_id = i.id ORDER BY im.created_at, im.id
    ) cover
    WHERE i.owner_profile_id = @profileId ORDER BY i.created_at DESC`);
  return result.recordset.map(attachSqlCover);
}

export async function createClaim(itemId, profileId, proofDetails) {
  const item = await getItemById(itemId);
  if (!item) throw new AppError(404, 'item_not_found', 'ไม่พบประกาศ');
  if (String(item.owner_profile_id) === profileId) throw new AppError(400, 'cannot_claim_own_item', 'ขอรับประกาศของตัวเองไม่ได้');
  if (!['OPEN', 'CLAIM_PENDING'].includes(item.status)) throw new AppError(409, 'item_not_claimable', 'ประกาศนี้ปิดรับคำขอแล้ว');
  if (isMemory) {
    if (memoryStore.claims.some((claim) => claim.item_id === itemId && claim.claimant_profile_id === profileId)) throw new AppError(409, 'claim_already_exists', 'ส่งคำขอนี้แล้ว');
    const claim = { id: randomUUID(), item_id: itemId, claimant_profile_id: profileId, proof_details: proofDetails, status: 'PENDING', created_at: new Date().toISOString(), reviewed_at: null };
    memoryStore.claims.push(claim);
    Object.assign(memoryStore.items.find((entry) => entry.id === itemId), { status: 'CLAIM_PENDING', updated_at: new Date().toISOString() });
    return claim;
  }
  const pool = await getSqlPool();
  const transaction = new sql.Transaction(pool); await transaction.begin();
  try {
    const result = await new sql.Request(transaction).input('itemId', sql.UniqueIdentifier, itemId).input('profileId', sql.UniqueIdentifier, profileId).input('proof', sql.NVarChar(1500), proofDetails)
      .query(`INSERT INTO claims (item_id, claimant_profile_id, proof_details) OUTPUT INSERTED.* VALUES (@itemId, @profileId, @proof);
        UPDATE items SET status = 'CLAIM_PENDING', updated_at = SYSUTCDATETIME() WHERE id = @itemId AND status = 'OPEN';`);
    await transaction.commit(); return result.recordset[0];
  } catch (error) { await transaction.rollback(); if ([2601, 2627].includes(error.number)) throw new AppError(409, 'claim_already_exists', 'ส่งคำขอนี้แล้ว'); throw error; }
}

function attachClaim(claim) {
  const profile = memoryStore.profiles.find((entry) => entry.id === claim.claimant_profile_id);
  const item = memoryStore.items.find((entry) => entry.id === claim.item_id);
  const messages = memoryStore.claimMessages
    .filter((message) => message.claim_id === claim.id)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map((message) => ({
      ...message,
      sender_name: memoryStore.profiles.find((entry) => entry.id === message.sender_profile_id)?.nickname,
    }));
  return { ...claim, claimant_name: profile?.nickname, item_title: item?.title, messages };
}

async function attachSqlClaimMessages(pool, claims) {
  if (!claims.length) return claims;
  const request = pool.request();
  const placeholders = claims.map((claim, index) => {
    const name = `claimId${index}`;
    request.input(name, sql.UniqueIdentifier, claim.id);
    return `@${name}`;
  });
  const result = await request.query(`
    SELECT m.id, m.claim_id, m.sender_profile_id, m.message, m.created_at,
      p.nickname AS sender_name
    FROM claim_messages m JOIN profiles p ON p.id = m.sender_profile_id
    WHERE m.claim_id IN (${placeholders.join(', ')})
    ORDER BY m.created_at, m.id`);
  return claims.map((claim) => ({
    ...claim,
    messages: result.recordset.filter((message) => String(message.claim_id) === String(claim.id)),
  }));
}

export async function listClaimsForItem(itemId, profileId) {
  const item = await getItemById(itemId);
  if (!item) throw new AppError(404, 'item_not_found', 'ไม่พบประกาศ');
  const isOwner = String(item.owner_profile_id) === profileId;
  if (isMemory) {
    return memoryStore.claims
      .filter((claim) => claim.item_id === itemId && (isOwner || claim.claimant_profile_id === profileId))
      .map(attachClaim);
  }
  const pool = await getSqlPool();
  const request = pool.request().input('itemId', sql.UniqueIdentifier, itemId);
  const viewerClause = isOwner ? '' : 'AND c.claimant_profile_id = @profileId';
  if (!isOwner) request.input('profileId', sql.UniqueIdentifier, profileId);
  const result = await request.query(`
    SELECT c.*, p.nickname AS claimant_name, i.title AS item_title FROM claims c
    JOIN profiles p ON p.id = c.claimant_profile_id JOIN items i ON i.id = c.item_id
    WHERE c.item_id = @itemId ${viewerClause} ORDER BY c.created_at DESC`);
  return attachSqlClaimMessages(pool, result.recordset);
}

export async function listClaimsByProfile(profileId) {
  if (isMemory) return memoryStore.claims.filter((claim) => claim.claimant_profile_id === profileId).map(attachClaim);
  const pool = await getSqlPool();
  const result = await pool.request().input('profileId', sql.UniqueIdentifier, profileId).query(`
    SELECT c.*, p.nickname AS claimant_name, i.title AS item_title
    FROM claims c JOIN profiles p ON p.id = c.claimant_profile_id JOIN items i ON i.id = c.item_id
    WHERE c.claimant_profile_id = @profileId ORDER BY c.created_at DESC`);
  return attachSqlClaimMessages(pool, result.recordset);
}

export async function listClaimsForOwnedItems(profileId) {
  if (isMemory) {
    const ownedItemIds = new Set(memoryStore.items.filter((item) => item.owner_profile_id === profileId).map((item) => item.id));
    return memoryStore.claims.filter((claim) => ownedItemIds.has(claim.item_id)).map(attachClaim)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  const pool = await getSqlPool();
  const result = await pool.request().input('profileId', sql.UniqueIdentifier, profileId).query(`
    SELECT c.*, p.nickname AS claimant_name, i.title AS item_title
    FROM claims c JOIN profiles p ON p.id = c.claimant_profile_id JOIN items i ON i.id = c.item_id
    WHERE i.owner_profile_id = @profileId ORDER BY c.created_at DESC`);
  return attachSqlClaimMessages(pool, result.recordset);
}

export async function sendClaimMessage(claimId, profileId, message) {
  if (isMemory) {
    const claim = memoryStore.claims.find((entry) => entry.id === claimId);
    if (!claim) throw new AppError(404, 'claim_not_found', 'ไม่พบคำขอ');
    const item = memoryStore.items.find((entry) => entry.id === claim.item_id);
    if (![claim.claimant_profile_id, item.owner_profile_id].includes(profileId)) {
      throw new AppError(403, 'not_claim_participant', 'ตอบกลับได้เฉพาะผู้ยื่นคำขอและเจ้าของประกาศ');
    }
    const created = { id: randomUUID(), claim_id: claimId, sender_profile_id: profileId, message, created_at: new Date().toISOString() };
    memoryStore.claimMessages.push(created);
    return { ...created, sender_name: memoryStore.profiles.find((entry) => entry.id === profileId)?.nickname };
  }
  const pool = await getSqlPool();
  const targetResult = await pool.request().input('claimId', sql.UniqueIdentifier, claimId).query(`
    SELECT c.claimant_profile_id, i.owner_profile_id
    FROM claims c JOIN items i ON i.id = c.item_id WHERE c.id = @claimId`);
  const target = targetResult.recordset[0];
  if (!target) throw new AppError(404, 'claim_not_found', 'ไม่พบคำขอ');
  if (![String(target.claimant_profile_id), String(target.owner_profile_id)].includes(profileId)) {
    throw new AppError(403, 'not_claim_participant', 'ตอบกลับได้เฉพาะผู้ยื่นคำขอและเจ้าของประกาศ');
  }
  const result = await pool.request()
    .input('claimId', sql.UniqueIdentifier, claimId)
    .input('profileId', sql.UniqueIdentifier, profileId)
    .input('message', sql.NVarChar(1500), message)
    .query(`INSERT INTO claim_messages (claim_id, sender_profile_id, message)
      OUTPUT INSERTED.id, INSERTED.claim_id, INSERTED.sender_profile_id, INSERTED.message, INSERTED.created_at
      VALUES (@claimId, @profileId, @message)`);
  return { ...result.recordset[0], sender_name: (await getProfileById(profileId)).nickname };
}

export async function reviewClaim(claimId, profileId, decision) {
  if (isMemory) {
    const claim = memoryStore.claims.find((entry) => entry.id === claimId);
    if (!claim) throw new AppError(404, 'claim_not_found', 'ไม่พบคำขอ');
    const item = memoryStore.items.find((entry) => entry.id === claim.item_id);
    if (item.owner_profile_id !== profileId) throw new AppError(403, 'not_item_owner', 'ตรวจคำขอได้เฉพาะเจ้าของประกาศ');
    Object.assign(claim, { status: decision, reviewed_at: new Date().toISOString() });
    if (decision === 'APPROVED') {
      item.status = 'MATCHED';
      memoryStore.claims.filter((entry) => entry.item_id === item.id && entry.id !== claim.id && entry.status === 'PENDING').forEach((entry) => Object.assign(entry, { status: 'REJECTED', reviewed_at: new Date().toISOString() }));
    } else if (!memoryStore.claims.some((entry) => entry.item_id === item.id && entry.status === 'PENDING')) item.status = 'OPEN';
    item.updated_at = new Date().toISOString(); return attachClaim(claim);
  }
  const pool = await getSqlPool();
  const ownerResult = await pool.request().input('claimId', sql.UniqueIdentifier, claimId).query(`SELECT c.item_id, i.owner_profile_id FROM claims c JOIN items i ON i.id = c.item_id WHERE c.id = @claimId`);
  const target = ownerResult.recordset[0];
  if (!target) throw new AppError(404, 'claim_not_found', 'ไม่พบคำขอ');
  if (String(target.owner_profile_id) !== profileId) throw new AppError(403, 'not_item_owner', 'ตรวจคำขอได้เฉพาะเจ้าของประกาศ');
  const transaction = new sql.Transaction(pool); await transaction.begin();
  try {
    await new sql.Request(transaction).input('claimId', sql.UniqueIdentifier, claimId).input('itemId', sql.UniqueIdentifier, target.item_id).input('decision', sql.NVarChar(20), decision).query(`
      UPDATE claims SET status = @decision, reviewed_at = SYSUTCDATETIME() WHERE id = @claimId AND status = 'PENDING';
      IF @decision = 'APPROVED' BEGIN UPDATE items SET status = 'MATCHED', updated_at = SYSUTCDATETIME() WHERE id = @itemId;
        UPDATE claims SET status = 'REJECTED', reviewed_at = SYSUTCDATETIME() WHERE item_id = @itemId AND id <> @claimId AND status = 'PENDING'; END
      ELSE IF NOT EXISTS (SELECT 1 FROM claims WHERE item_id = @itemId AND status = 'PENDING') UPDATE items SET status = 'OPEN', updated_at = SYSUTCDATETIME() WHERE id = @itemId;`);
    await transaction.commit();
  } catch (error) { await transaction.rollback(); throw error; }
  return (await listClaimsForItem(target.item_id, profileId)).find((claim) => String(claim.id) === claimId);
}

export async function countImagesForItem(itemId) {
  if (isMemory) return memoryStore.images.filter((image) => image.item_id === itemId).length;
  const pool = await getSqlPool(); const result = await pool.request().input('itemId', sql.UniqueIdentifier, itemId).query('SELECT COUNT(*) AS count FROM item_images WHERE item_id = @itemId'); return result.recordset[0].count;
}

export async function addImageRecord(itemId, blobName, contentType, localPath = null) {
  if (isMemory) { const image = { id: randomUUID(), item_id: itemId, blob_name: blobName, content_type: contentType, local_path: localPath, created_at: new Date().toISOString() }; memoryStore.images.push(image); return { id: image.id, content_type: image.content_type }; }
  const pool = await getSqlPool(); const result = await pool.request().input('itemId', sql.UniqueIdentifier, itemId).input('blobName', sql.NVarChar(500), blobName).input('contentType', sql.NVarChar(100), contentType).query('INSERT INTO item_images (item_id, blob_name, content_type) OUTPUT INSERTED.id, INSERTED.content_type VALUES (@itemId, @blobName, @contentType)'); return result.recordset[0];
}

export async function getImageRecord(imageId) {
  if (isMemory) return memoryStore.images.find((image) => image.id === imageId) || null;
  const pool = await getSqlPool(); const result = await pool.request().input('imageId', sql.UniqueIdentifier, imageId).query('SELECT TOP 1 * FROM item_images WHERE id = @imageId'); return result.recordset[0] || null;
}
