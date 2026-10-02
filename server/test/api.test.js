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

test('nickname profile unlocks personal routes without login', async () => {
  await withServer(async (baseUrl) => {
    const anonymous = await fetch(`${baseUrl}/api/items/mine`);
    assert.equal(anonymous.status, 400);

    const response = await fetch(`${baseUrl}/api/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'มิน', avatarKind: 'DOG' }),
    });
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.ok(body.profile.id);
    assert.equal(body.profile.nickname, 'มิน');

    const mine = await fetch(`${baseUrl}/api/items/mine`, { headers: { 'X-Profile-Id': body.profile.id } });
    assert.equal(mine.status, 200);
  });
});

test('create report validates required content', async () => {
  await withServer(async (baseUrl) => {
    const created = await fetch(`${baseUrl}/api/profiles`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'ผู้ทดสอบ', avatarKind: 'CAT' }),
    });
    const { profile } = await created.json();
    const response = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Profile-Id': profile.id },
      body: JSON.stringify({ reportType: 'LOST', title: 'สั้น' }),
    });
    assert.equal(response.status, 400);
  });
});

test('profile can publish a report at a newly added building', async () => {
  await withServer(async (baseUrl) => {
    const created = await fetch(`${baseUrl}/api/profiles`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'ฟ้าใส', avatarKind: 'CAT' }),
    });
    const { profile } = await created.json();
    const response = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Profile-Id': profile.id },
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

