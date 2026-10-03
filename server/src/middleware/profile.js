import { AppError } from '../lib/errors.js';
import { hashSessionToken, parseCookies, SESSION_COOKIE } from '../lib/auth.js';
import { getProfileById, getProfileBySession } from '../repositories/appRepository.js';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function optionalProfile(req, _res, next) {
  try {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    if (token) {
      const profile = await getProfileBySession(hashSessionToken(token));
      if (profile) {
        req.profile = profile;
        req.authMethod = 'session';
        req.sessionToken = token;
        return next();
      }
    }
    const profileId = String(req.headers['x-profile-id'] || '');
    if (!profileId) return next();
    if (!uuidPattern.test(profileId)) throw new AppError(400, 'invalid_profile_id', 'โปรไฟล์ไม่ถูกต้อง');
    const profile = await getProfileById(profileId);
    if (!profile) throw new AppError(404, 'profile_not_found', 'ไม่พบโปรไฟล์ กรุณาตั้งชื่อเล่นใหม่');
    req.profile = profile;
    req.authMethod = 'legacy';
    return next();
  } catch (error) {
    return next(error);
  }
}

export async function requireSessionProfile(req, res, next) {
  return optionalProfile(req, res, (error) => {
    if (error) return next(error);
    if (!req.profile || req.authMethod !== 'session') return next(new AppError(401, 'login_required', 'กรุณาเข้าสู่ระบบ'));
    return next();
  });
}

export async function requireProfile(req, res, next) {
  return optionalProfile(req, res, (error) => {
    if (error) return next(error);
    if (!req.profile) return next(new AppError(400, 'profile_required', 'กรุณาตั้งชื่อเล่นก่อน'));
    return next();
  });
}

