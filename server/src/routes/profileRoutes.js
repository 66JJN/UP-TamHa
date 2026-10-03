import { Router } from 'express';
import multer from 'multer';
import { asyncRoute, AppError } from '../lib/errors.js';
import { requireProfile } from '../middleware/profile.js';
import { getProfileAvatarRecord, getProfileById, setProfileAvatar, updateProfile } from '../repositories/appRepository.js';
import { openObject, saveObject } from '../storage/objectStorage.js';

const router = Router();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024, files: 1 }, fileFilter: (_req, file, callback) => callback(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) });

function validateNickname(value) {
  const nickname = String(value || '').trim();
  if (nickname.length < 2 || nickname.length > 60) throw new AppError(400, 'invalid_nickname', 'ชื่อเล่นต้องมี 2–60 ตัวอักษร');
  return nickname;
}

function assertUuid(value) {
  if (!uuidPattern.test(value)) throw new AppError(400, 'invalid_id', 'รหัสโปรไฟล์ไม่ถูกต้อง');
}

router.get('/:id', asyncRoute(async (req, res) => {
  assertUuid(req.params.id);
  const profile = await getProfileById(req.params.id);
  if (!profile) throw new AppError(404, 'profile_not_found', 'ไม่พบโปรไฟล์');
  res.json({ profile });
}));

router.patch('/:id', requireProfile, asyncRoute(async (req, res) => {
  assertUuid(req.params.id);
  if (req.profile.id !== req.params.id) throw new AppError(403, 'not_profile_owner', 'แก้ไขได้เฉพาะโปรไฟล์ของตนเอง');
  const changes = {};
  if (req.body.nickname !== undefined) changes.nickname = validateNickname(req.body.nickname);
  if (['CAT', 'DOG'].includes(req.body.avatarKind)) changes.avatar_kind = req.body.avatarKind;
  res.json({ profile: await updateProfile(req.params.id, changes) });
}));

router.post('/:id/avatar', requireProfile, upload.single('avatar'), asyncRoute(async (req, res) => {
  assertUuid(req.params.id);
  if (req.profile.id !== req.params.id) throw new AppError(403, 'not_profile_owner', 'แก้ไขได้เฉพาะโปรไฟล์ของตนเอง');
  if (!req.file) throw new AppError(400, 'avatar_required', 'กรุณาเลือกรูปโปรไฟล์');
  const stored = await saveObject(req.file);
  res.json({ profile: await setProfileAvatar(req.params.id, stored.blobName, req.file.mimetype, stored.localPath) });
}));

router.get('/:id/avatar', asyncRoute(async (req, res) => {
  assertUuid(req.params.id);
  const record = await getProfileAvatarRecord(req.params.id);
  if (!record) throw new AppError(404, 'avatar_not_found', 'ไม่พบรูปโปรไฟล์');
  res.setHeader('Content-Type', record.content_type);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  const stream = await openObject(record);
  stream.on('error', (error) => res.destroy(error));
  stream.pipe(res);
}));

export default router;

