import { Router } from 'express';
import { requireProfile } from '../middleware/profile.js';
import { asyncRoute, AppError } from '../lib/errors.js';
import {
  createClaim, listClaimsByProfile, listClaimsForItem, listClaimsForOwnedItems, reviewClaim, sendClaimMessage,
} from '../repositories/appRepository.js';
import { uuidPattern } from './itemRoutes.js';

const router = Router();
router.use(requireProfile);

function assertUuid(value) {
  if (!uuidPattern.test(value)) throw new AppError(400, 'invalid_id', 'รหัสรายการไม่ถูกต้อง');
}

router.get('/mine', asyncRoute(async (req, res) => {
  res.json({ claims: await listClaimsByProfile(req.profile.id) });
}));

router.get('/received', asyncRoute(async (req, res) => {
  res.json({ claims: await listClaimsForOwnedItems(req.profile.id) });
}));

router.get('/item/:itemId', asyncRoute(async (req, res) => {
  assertUuid(req.params.itemId);
  res.json({ claims: await listClaimsForItem(req.params.itemId, req.profile.id) });
}));

router.post('/item/:itemId', asyncRoute(async (req, res) => {
  assertUuid(req.params.itemId);
  const proofDetails = String(req.body?.proofDetails || '').trim();
  if (proofDetails.length < 10 || proofDetails.length > 1500) {
    throw new AppError(400, 'invalid_proof', 'รายละเอียดพิสูจน์ต้องมี 10–1,500 ตัวอักษร');
  }
  const claim = await createClaim(req.params.itemId, req.profile.id, proofDetails);
  res.status(201).json({ claim });
}));

router.patch('/:claimId', asyncRoute(async (req, res) => {
  assertUuid(req.params.claimId);
  const decision = String(req.body?.decision || '').toUpperCase();
  if (!['APPROVED', 'REJECTED'].includes(decision)) throw new AppError(400, 'invalid_decision', 'ผลการตรวจไม่ถูกต้อง');
  res.json({ claim: await reviewClaim(req.params.claimId, req.profile.id, decision) });
}));

router.post('/:claimId/messages', asyncRoute(async (req, res) => {
  assertUuid(req.params.claimId);
  const message = String(req.body?.message || '').trim();
  if (!message || message.length > 1500) {
    throw new AppError(400, 'invalid_message', 'ข้อความตอบกลับต้องมี 1–1,500 ตัวอักษร');
  }
  res.status(201).json({ message: await sendClaimMessage(req.params.claimId, req.profile.id, message) });
}));

export default router;

