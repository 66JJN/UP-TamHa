import { Router } from 'express';
import { AppError, asyncRoute } from '../lib/errors.js';
import {
  createSessionToken, hashPassword, hashSessionToken, normalizeUsername,
  parseCookies, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, sessionCookie, verifyPassword,
} from '../lib/auth.js';
import { optionalProfile, requireSessionProfile } from '../middleware/profile.js';
import {
  createProfile, createSession, deleteSession, getAccountByUsername, getProfileById, setProfileCredentials,
} from '../repositories/appRepository.js';

const router = Router();

function validateNickname(value) {
  const nickname = String(value || '').trim();
  if (nickname.length < 2 || nickname.length > 60) throw new AppError(400, 'invalid_nickname', 'ชื่อเล่นต้องมี 2–60 ตัวอักษร');
  return nickname;
}

function validateUsername(value) {
  const username = normalizeUsername(value);
  if (!/^[\p{L}\p{N}._-]{3,40}$/u.test(username)) {
    throw new AppError(400, 'invalid_username', 'ชื่อผู้ใช้ต้องมี 3–40 ตัว และใช้ได้เฉพาะตัวอักษร ตัวเลข จุด ขีดกลาง หรือขีดล่าง');
  }
  return username;
}

function validatePassword(value) {
  const password = String(value || '');
  if (password.length < 8 || password.length > 128) throw new AppError(400, 'invalid_password', 'รหัสผ่านต้องมี 8–128 ตัวอักษร');
  return password;
}

async function issueSession(res, profileId) {
  const { token, tokenHash } = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await createSession(profileId, tokenHash, expiresAt);
  res.setHeader('Set-Cookie', sessionCookie(token));
}

function duplicateUsername(error) {
  if ([2601, 2627].includes(error.number)) throw new AppError(409, 'username_taken', 'ชื่อผู้ใช้นี้ถูกใช้แล้ว');
  throw error;
}

router.post('/register', asyncRoute(async (req, res) => {
  const nickname = validateNickname(req.body?.nickname);
  const username = validateUsername(req.body?.username);
  const passwordHash = await hashPassword(validatePassword(req.body?.password));
  try {
    const profile = await createProfile({ nickname, username, passwordHash, avatarKind: 'CAT' });
    await issueSession(res, profile.id);
    res.status(201).json({ profile });
  } catch (error) { duplicateUsername(error); }
}));

router.post('/login', asyncRoute(async (req, res) => {
  const username = validateUsername(req.body?.username);
  const account = await getAccountByUsername(username);
  if (!account || !await verifyPassword(String(req.body?.password || ''), account.password_hash)) {
    throw new AppError(401, 'invalid_credentials', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  }
  await issueSession(res, account.id);
  res.json({ profile: await getProfileById(account.id) });
}));

router.get('/me', requireSessionProfile, (req, res) => res.json({ profile: req.profile }));

router.post('/logout', optionalProfile, asyncRoute(async (req, res) => {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (token) await deleteSession(hashSessionToken(token));
  res.setHeader('Set-Cookie', sessionCookie('', 0));
  res.status(204).end();
}));

router.post('/upgrade', optionalProfile, asyncRoute(async (req, res) => {
  if (!req.profile || req.authMethod !== 'legacy') throw new AppError(400, 'legacy_profile_required', 'ไม่พบโปรไฟล์เดิมบนเครื่องนี้');
  if (req.profile.has_credentials) throw new AppError(409, 'account_already_secured', 'โปรไฟล์นี้มีบัญชีเข้าสู่ระบบแล้ว');
  const username = validateUsername(req.body?.username);
  const passwordHash = await hashPassword(validatePassword(req.body?.password));
  try {
    const profile = await setProfileCredentials(req.profile.id, username, passwordHash);
    await issueSession(res, profile.id);
    res.json({ profile });
  } catch (error) { duplicateUsername(error); }
}));

export default router;
