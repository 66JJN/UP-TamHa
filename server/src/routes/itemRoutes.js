import { Router } from 'express';
import multer from 'multer';
import { asyncRoute, AppError } from '../lib/errors.js';
import { optionalProfile, requireProfile } from '../middleware/profile.js';
import {
  addImageRecord, countImagesForItem, createItem, getImageRecord, getItemById,
  listItems, listItemsByProfile, updateItem,
} from '../repositories/appRepository.js';
import { openObject, saveObject } from '../storage/objectStorage.js';

const router = Router();
const buildings = new Set(['ICT', 'CE', 'PKY', 'UB', 'DOME', 'PYM', 'LIBRARY', 'CANTEEN', 'CAMPUS', 'BUS', 'LAKE', 'SPORT', 'DORM', 'OTHER']);
const reportTypes = new Set(['LOST', 'FOUND']);
const statuses = new Set(['OPEN', 'CLAIM_PENDING', 'MATCHED', 'RETURNED', 'CLOSED']);
const categories = new Set([
  'บัตรและเอกสาร', 'กุญแจ', 'อุปกรณ์อิเล็กทรอนิกส์', 'กระเป๋าและกระเป๋าสตางค์',
  'ร่ม', 'เสื้อผ้า', 'เครื่องเขียน', 'อื่น ๆ',
]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter: (_req, file, callback) => {
    callback(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
  },
});

function assertUuid(value) {
  if (!uuidPattern.test(value)) throw new AppError(400, 'invalid_id', 'รหัสรายการไม่ถูกต้อง');
}

function publicItem(item, viewer) {
  const canSeePrivate = viewer && viewer.id === String(item.owner_profile_id);
  const { contact_note: contactNote, ...safe } = item;
  return canSeePrivate ? { ...safe, contact_note: contactNote } : safe;
}

function validateCreate(body) {
  const data = {
    reportType: String(body?.reportType || '').toUpperCase(),
    title: String(body?.title || '').trim(),
    description: String(body?.description || '').trim(),
    category: String(body?.category || '').trim(),
    buildingCode: String(body?.buildingCode || '').toUpperCase(),
    room: String(body?.room || '').trim(),
    eventDate: String(body?.eventDate || ''),
    contactNote: String(body?.contactNote || '').trim(),
  };
  if (!reportTypes.has(data.reportType)) throw new AppError(400, 'invalid_report_type', 'กรุณาเลือกประเภทประกาศ');
  if (data.title.length < 3 || data.title.length > 160) throw new AppError(400, 'invalid_title', 'ชื่อประกาศต้องมี 3–160 ตัวอักษร');
  if (data.description.length < 10 || data.description.length > 2000) throw new AppError(400, 'invalid_description', 'รายละเอียดต้องมี 10–2,000 ตัวอักษร');
  if (!categories.has(data.category)) throw new AppError(400, 'invalid_category', 'หมวดหมู่ไม่ถูกต้อง');
  if (!buildings.has(data.buildingCode)) throw new AppError(400, 'invalid_building', 'สถานที่หลักไม่ถูกต้อง');
  if (!data.room || data.room.length > 100) throw new AppError(400, 'invalid_room', 'กรุณาระบุห้องหรือพื้นที่');
  if (!data.eventDate || Number.isNaN(new Date(data.eventDate).getTime())) throw new AppError(400, 'invalid_event_date', 'วันที่ไม่ถูกต้อง');
  if (new Date(data.eventDate).getTime() > Date.now() + 300000) throw new AppError(400, 'future_event_date', 'วันที่เกิดเหตุต้องไม่เป็นอนาคต');
  if (data.contactNote.length > 500) throw new AppError(400, 'invalid_contact_note', 'ข้อมูลติดต่อยาวเกินไป');
  return data;
}

router.get('/', optionalProfile, asyncRoute(async (req, res) => {
  const result = await listItems({
    q: req.query.q, reportType: req.query.reportType, building: req.query.building,
    category: req.query.category, status: req.query.status, room: req.query.room,
    limit: req.query.limit, offset: req.query.offset,
  });
  res.json({ ...result, items: result.items.map((item) => publicItem(item, req.profile)) });
}));

router.get('/mine', requireProfile, asyncRoute(async (req, res) => {
  const items = await listItemsByProfile(req.profile.id);
  res.json({ items: items.map((item) => publicItem(item, req.profile)) });
}));

router.get('/:id', optionalProfile, asyncRoute(async (req, res) => {
  assertUuid(req.params.id);
  const item = await getItemById(req.params.id);
  if (!item) throw new AppError(404, 'item_not_found', 'ไม่พบประกาศ');
  res.json({ item: publicItem(item, req.profile) });
}));

router.post('/', requireProfile, asyncRoute(async (req, res) => {
  const item = await createItem(req.profile.id, validateCreate(req.body));
  res.status(201).json({ item: publicItem(item, req.profile) });
}));

router.patch('/:id', requireProfile, asyncRoute(async (req, res) => {
  assertUuid(req.params.id);
  const changes = {};
  if (req.body.title !== undefined) changes.title = String(req.body.title).trim();
  if (req.body.description !== undefined) changes.description = String(req.body.description).trim();
  if (req.body.category !== undefined) {
    if (!categories.has(req.body.category)) throw new AppError(400, 'invalid_category', 'หมวดหมู่ไม่ถูกต้อง');
    changes.category = req.body.category;
  }
  if (req.body.buildingCode !== undefined) {
    if (!buildings.has(req.body.buildingCode)) throw new AppError(400, 'invalid_building', 'สถานที่หลักไม่ถูกต้อง');
    changes.building_code = req.body.buildingCode;
  }
  if (req.body.room !== undefined) changes.room = String(req.body.room).trim();
  if (req.body.eventDate !== undefined) changes.event_date = req.body.eventDate;
  if (req.body.contactNote !== undefined) changes.contact_note = String(req.body.contactNote).trim();
  if (req.body.status !== undefined) {
    if (!statuses.has(req.body.status)) throw new AppError(400, 'invalid_status', 'สถานะไม่ถูกต้อง');
    changes.status = req.body.status;
  }
  const item = await updateItem(req.params.id, req.profile.id, changes);
  res.json({ item: publicItem(item, req.profile) });
}));

router.post('/:id/images', requireProfile, upload.array('images', 3), asyncRoute(async (req, res) => {
  assertUuid(req.params.id);
  const item = await getItemById(req.params.id);
  if (!item) throw new AppError(404, 'item_not_found', 'ไม่พบประกาศ');
  if (String(item.owner_profile_id) !== req.profile.id) throw new AppError(403, 'not_item_owner', 'เพิ่มรูปได้เฉพาะประกาศของโปรไฟล์นี้');
  const files = req.files || [];
  if (!files.length) throw new AppError(400, 'images_required', 'กรุณาเลือกรูปภาพ');
  const existing = await countImagesForItem(req.params.id);
  if (existing + files.length > 3) throw new AppError(400, 'too_many_images', 'เพิ่มรูปได้ไม่เกิน 3 รูปต่อประกาศ');
  const images = [];
  for (const file of files) {
    const stored = await saveObject(file);
    images.push(await addImageRecord(req.params.id, stored.blobName, file.mimetype, stored.localPath));
  }
  res.status(201).json({ images });
}));

router.get('/images/:imageId/content', asyncRoute(async (req, res) => {
  assertUuid(req.params.imageId);
  const record = await getImageRecord(req.params.imageId);
  if (!record) throw new AppError(404, 'image_not_found', 'ไม่พบรูปภาพ');
  res.setHeader('Content-Type', record.content_type);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  const stream = await openObject(record);
  stream.on('error', (error) => res.destroy(error));
  stream.pipe(res);
}));

export { uuidPattern };
export default router;

