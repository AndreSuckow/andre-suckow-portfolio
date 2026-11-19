import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRange } from './range.mjs';
import { spawn } from 'node:child_process';
import { stat, readFile } from 'node:fs/promises';
test('downloads can request an opening chunk, an open end or a suffix', () => {
  assert.deepEqual(parseRange('bytes=0-1023', 74482594), { start: 0, end: 1023 });
  assert.deepEqual(parseRange('bytes=50-', 100), { start: 50, end: 99 });
  assert.deepEqual(parseRange('bytes=-10', 100), { start: 90, end: 99 });
  assert.deepEqual(parseRange('bytes=90-500', 100), { start: 90, end: 99 });
  assert.equal(parseRange(undefined, 100), undefined);
});
test('invalid and unsatisfiable ranges are rejected rather than streaming the full file', () => {
  for (const header of [
    'bytes=100-101',
    'bytes=10-2',
    'bytes=-0',
    'bytes=-',
    'bytes=0-2,4-6',
    'bytes=999999999999999999999-',
    'garbage',
  ])
    assert.equal(parseRange(header, 100), null, header);
  assert.equal(parseRange('bytes=0-0', 0), null);
});
test('the server exposes only the main route and streams the new PDF', async () => {
  const child = spawn(process.execPath, ['server.mjs', '--port', '0'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  try {
    const base = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('Test server did not start')), 6000);
      child.once('error', reject);
      child.stdout.on('data', (data) => {
        const match = String(data).match(/http:\/\/127\.0\.0\.1:\d+/);
        if (match) {
          clearTimeout(timer);
          resolve(match[0]);
        }
      });
    });
    const size = (await stat('public/curriculo-andre-suckow.pdf')).size;
    const home = await (await fetch(base + '/')).text();
    assert(home.includes('data-portfolio="curriculo"'));
    assert(home.includes('id="stage-canvas"'));
    for (const removed of ['/cs', '/cs/', '/cs/curriculo/'])
      assert.equal((await fetch(base + removed)).status, 404);
    for (const route of ['/']) {
      const printable = await (await fetch(base + route + 'curriculo/')).text();
      assert(printable.includes(`href="${route}"`), 'printable CV returns to its own route');
      const projects = JSON.parse(await readFile('profile.json', 'utf8')).projects;
      for (const project of projects) {
        const response = await fetch(base + route + 'cases/' + project.slug + '/');
        assert.equal(response.status, 200);
        const study = await response.text();
        assert(study.includes(`href="${route}"`), 'project details return to the portfolio');
      }
      for (const old of ['frontend', 'performance'])
        if (!projects.some((project) => project.slug === old))
          assert.equal((await fetch(base + route + 'cases/' + old + '/')).status, 404);
    }
    const chunk = await fetch(`${base}/curriculo-andre-suckow.pdf`, {
      headers: { Range: 'bytes=0-31' },
    });
    assert.equal(chunk.status, 206);
    assert.equal(chunk.headers.get('content-type'), 'application/pdf');
    assert.equal(chunk.headers.get('content-range'), `bytes 0-31/${size}`);
    assert.equal((await chunk.arrayBuffer()).byteLength, 32);
    const head = await fetch(`${base}/curriculo-andre-suckow.pdf`, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(Number(head.headers.get('content-length')), size);
    assert.equal((await head.arrayBuffer()).byteLength, 0);
    const invalid = await fetch(`${base}/curriculo-andre-suckow.pdf`, {
      headers: { Range: `bytes=${size}-` },
    });
    assert.equal(invalid.status, 416);
    assert.equal((await invalid.arrayBuffer()).byteLength, 0);
  } finally {
    child.kill();
  }
});
