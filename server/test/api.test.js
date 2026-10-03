import { test } from 'node:test';
import assert from 'node:assert/strict';

// Tests are deterministic and must never connect to production Azure resources.
process.env.AZURE_SQL_CONNECTION_STRING = '';
process.env.AZURE_STORAGE_CONNECTION_STRING = '';
const { default: app } = await import('../src/app.js');

async function withServer(run) {
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

let accountSequence = 0;
async function registerAccount(baseUrl, nickname) {
  accountSequence += 1;
  const username = `tester_${accountSequence}`;
  const password = 'test-password-123';
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, username, password }),
  });
  assert.equal(response.status, 201);
  const { profile } = await response.json();
  return { profile, username, password, cookie: response.headers.get('set-cookie').split(';')[0] };
}

test('health check reports active data mode', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.dataMode, 'memory');
  });
});

test('public feed returns seeded items without private contact note', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/items?building=ICT`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(body.items.length >= 1);
    assert.ok(body.items.every((item) => item.building_code === 'ICT'));
    assert.ok(body.items.every((item) => !Object.hasOwn(item, 'contact_note')));
  });
});

test('account can restore its profile by logging in again', async () => {
  await withServer(async (baseUrl) => {
    const anonymous = await fetch(`${baseUrl}/api/items/mine`);
    assert.equal(anonymous.status, 400);

    const account = await registerAccount(baseUrl, 'มิน');
    assert.ok(account.profile.id);
    assert.equal(account.profile.nickname, 'มิน');
    const mine = await fetch(`${baseUrl}/api/items/mine`, { headers: { Cookie: account.cookie } });
    assert.equal(mine.status, 200);

    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: account.username, password: account.password }),
    });
    assert.equal(response.status, 200);
    const restored = await response.json();
    assert.equal(restored.profile.id, account.profile.id);

    const wrongPassword = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: account.username, password: 'wrong-password' }),
    });
    assert.equal(wrongPassword.status, 401);

    const duplicate = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'ชื่อซ้ำ', username: account.username, password: account.password }),
    });
    assert.equal(duplicate.status, 409);
  });
});

test('legacy browser profile can add credentials without losing its identity', async () => {
  await withServer(async (baseUrl) => {
    const legacyId = '10000000-0000-4000-8000-000000000001';
    const response = await fetch(`${baseUrl}/api/auth/upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Profile-Id': legacyId },
      body: JSON.stringify({ username: 'legacy_admin', password: 'legacy-password-123' }),
    });
    assert.equal(response.status, 200);
    const { profile } = await response.json();
    assert.equal(profile.id, legacyId);
    assert.equal(profile.has_credentials, true);
    const cookie = response.headers.get('set-cookie').split(';')[0];
    const me = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookie } });
    assert.equal(me.status, 200);
    assert.equal((await me.json()).profile.id, legacyId);
  });
});

test('create report validates required content', async () => {
  await withServer(async (baseUrl) => {
    const { cookie } = await registerAccount(baseUrl, 'ผู้ทดสอบ');
    const response = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ reportType: 'LOST', title: 'สั้น' }),
    });
    assert.equal(response.status, 400);
  });
});

test('profile can publish a report at a newly added building', async () => {
  await withServer(async (baseUrl) => {
    const { profile, cookie } = await registerAccount(baseUrl, 'ฟ้าใส');
    const response = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        reportType: 'LOST', title: 'กระเป๋าผ้าสีครีม', description: 'มีสมุดและกล่องดินสออยู่ด้านใน',
        category: 'กระเป๋าและกระเป๋าสตางค์', buildingCode: 'UB', room: 'พื้นที่ส่วนกลาง',
        eventDate: new Date(Date.now() - 60_000).toISOString(),
      }),
    });
    assert.equal(response.status, 201);
    const { item } = await response.json();
    assert.equal(item.building_code, 'UB');
    assert.equal(item.owner_profile_id, profile.id);
  });
});

test('claim participants can reply and claimant can see the review status', async () => {
  await withServer(async (baseUrl) => {
    const owner = await registerAccount(baseUrl, 'เจ้าของประกาศ');
    const claimant = await registerAccount(baseUrl, 'ผู้ขอรับของ');
    const outsider = await registerAccount(baseUrl, 'บุคคลอื่น');
    const itemResponse = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: owner.cookie },
      body: JSON.stringify({
        reportType: 'FOUND', title: 'แท็บเล็ตสีดำ', description: 'พบแท็บเล็ตพร้อมเคสสีดำบริเวณโต๊ะ',
        category: 'อุปกรณ์อิเล็กทรอนิกส์', buildingCode: 'ICT', room: '1107',
        eventDate: new Date(Date.now() - 60_000).toISOString(),
      }),
    });
    const { item } = await itemResponse.json();
    const claimResponse = await fetch(`${baseUrl}/api/claims/item/${item.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: claimant.cookie },
      body: JSON.stringify({ proofDetails: 'ระบุรอยที่มุมเคสและภาพหน้าจอล็อกได้' }),
    });
    assert.equal(claimResponse.status, 201);
    const { claim } = await claimResponse.json();

    const ownerReply = await fetch(`${baseUrl}/api/claims/${claim.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: owner.cookie },
      body: JSON.stringify({ message: 'หน้าจอล็อกเป็นรูปอะไรครับ' }),
    });
    assert.equal(ownerReply.status, 201);
    const claimantReply = await fetch(`${baseUrl}/api/claims/${claim.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: claimant.cookie },
      body: JSON.stringify({ message: 'เป็นรูปแมวพื้นหลังสีม่วงครับ' }),
    });
    assert.equal(claimantReply.status, 201);
    const forbiddenReply = await fetch(`${baseUrl}/api/claims/${claim.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: outsider.cookie },
      body: JSON.stringify({ message: 'ไม่ควรส่งข้อความนี้ได้' }),
    });
    assert.equal(forbiddenReply.status, 403);

    const review = await fetch(`${baseUrl}/api/claims/${claim.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: owner.cookie },
      body: JSON.stringify({ decision: 'REJECTED' }),
    });
    assert.equal(review.status, 200);

    const claimantView = await fetch(`${baseUrl}/api/claims/item/${item.id}`, {
      headers: { Cookie: claimant.cookie },
    });
    const claimantBody = await claimantView.json();
    assert.equal(claimantBody.claims.length, 1);
    assert.equal(claimantBody.claims[0].status, 'REJECTED');
    assert.equal(claimantBody.claims[0].messages.length, 2);

    const outsiderView = await fetch(`${baseUrl}/api/claims/item/${item.id}`, {
      headers: { Cookie: outsider.cookie },
    });
    assert.equal((await outsiderView.json()).claims.length, 0);
  });
});

