// Optional real-browser gameplay check using an isolated headless Chrome profile.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import os from 'node:os';
const executable =
  process.env.GAME_TEST_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = process.env.GAME_TEST_URL || 'http://127.0.0.1:4173/';
const output = path.resolve('tmp/portfolio-browser');
fs.mkdirSync(output, { recursive: true });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function connect(url) {
  const ws = new WebSocket(url),
    pending = new Map();
  let next = 0;
  const errors = [];
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id);
      if (request) {
        clearTimeout(request.timeout);
        pending.delete(message.id);
        message.error
          ? request.reject(Error(JSON.stringify(message.error)))
          : request.resolve(message.result);
      }
    } else if (message.method === 'Runtime.exceptionThrown')
      errors.push(message.params.exceptionDetails);
  });
  return {
    errors,
    send: (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = ++next,
          timeout = setTimeout(() => {
            pending.delete(id);
            reject(Error(`Timeout: ${method}`));
          }, 30000);
        pending.set(id, { resolve, reject, timeout });
        ws.send(JSON.stringify({ id, method, params }));
      }),
    close: () => ws.close(),
  };
}
let browser, page, child;
try {
  assert(fs.existsSync(executable), 'Chrome not found; set GAME_TEST_CHROME.');
  const response = await fetch(base);
  assert.equal(response.status, 200, 'Start npm run dev before this check.');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-game-browser-'));
  const localTest =
    new URL(base).hostname === '127.0.0.1' || new URL(base).hostname === 'localhost';
  const testSandboxArgs =
    process.env.GAME_TEST_NO_SANDBOX === '1' && localTest ? ['--no-sandbox'] : [];
  child = spawn(
    executable,
    [
      '--headless=new',
      ...testSandboxArgs,
      '--disable-extensions',
      '--disable-background-networking',
      '--no-first-run',
      '--no-default-browser-check',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--remote-debugging-address=127.0.0.1',
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      'about:blank',
    ],
    { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] },
  );
  const endpoint = await new Promise((resolve, reject) => {
    let buffer = '';
    const timer = setTimeout(() => reject(Error('Chrome did not start within 15 seconds.')), 15000);
    child.once('error', reject);
    child.stderr.on('data', (data) => {
      buffer += data;
      const match = buffer.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
  });
  browser = await connect(endpoint);
  const targets = await (await fetch(`http://${new URL(endpoint).host}/json/list`)).json();
  page = await connect(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('Network.enable');
  await page.send('Page.addScriptToEvaluateOnNewDocument', {
    source:
      'try{localStorage.setItem("andre:prefs",JSON.stringify({...JSON.parse(localStorage.getItem("andre:prefs")||"{}"),mode:"2d"}))}catch{}',
  });
  const evaluate = async (expression) => {
    const result = await page.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
    });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const until = async (expression, label) => {
    for (let i = 0; i < 400; i++) {
      if (await evaluate(expression)) return;
      await wait(60);
    }
    throw Error(`Timed out: ${label}`);
  };


  await page.send('Emulation.setDeviceMetricsOverride', {width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await page.send('Page.navigate', {url:base});
  await until('document.readyState==="complete" && document.querySelector("[data-mobile-preview]")','button and styles');
  await until('document.querySelector("[data-loader]").hidden && !document.documentElement.hasAttribute("data-site-loading")','site ready');
  assert.equal(await evaluate('getComputedStyle(document.querySelector("[data-mobile-preview]")).display'),'flex');
  assert.equal(await evaluate('performance.getEntriesByType("resource").some(x=>/models\\/mobile\\/scene.gltf|boxlyne.webm|mobile-phone-viewer.js/.test(x.name))'),false);
  await evaluate('document.querySelector("[data-mobile-preview]").focus(); document.querySelector("[data-mobile-preview]").click()');
  await until('document.querySelector("[data-phone=ready]")','3D ready');
  await until('document.querySelector(".mobile-preview iframe").src==="https://boxlyne.com.br/"','live site');
  assert.equal(await evaluate('document.querySelector(".mobile-preview iframe").hidden'),false);
  assert.equal(await evaluate('document.querySelector(".mobile-preview iframe").clientWidth<=320'),true);
  assert.equal(await evaluate('document.querySelector(".mobile-preview video").hasAttribute("src")'),false);
  assert.equal(await evaluate('!document.querySelector(".mobile-preview__actions a[href]")'),true);
  assert.equal(await evaluate('document.querySelector("[data-show-video]").hidden'),true);
  fs.writeFileSync(path.join(output,'mobile-phone.png'),Buffer.from((await page.send('Page.captureScreenshot')).data,'base64'));
  await evaluate('document.querySelector(".mobile-preview iframe").dispatchEvent(new Event("error"))');
  assert.equal(await evaluate('document.querySelector("[data-show-video]").hidden'),false);
  await evaluate('document.querySelector("[data-show-video]").click()');
  await until('document.querySelector(".mobile-preview video").readyState>=2','video fallback');
  assert.equal(await evaluate('document.querySelector(".mobile-preview iframe").hidden'),true);
  assert.equal(await evaluate('document.querySelector(".mobile-preview video").hidden'),false);
  const before = await evaluate('document.querySelector("[data-preview-screen]").style.transform');
  await evaluate('document.querySelector(".mobile-preview__stage").focus()');
  await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
  await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
  await until(`document.querySelector("[data-preview-screen]").style.transform!==${JSON.stringify(before)}`,'phone rotation');
  await evaluate('document.querySelector(".mobile-preview video").play()');
  await until('document.querySelector(".mobile-preview video").currentTime>0.1','playing');
  await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await until('!document.querySelector("dialog").open && !document.querySelector(".mobile-preview video").hasAttribute("src") && !document.querySelector(".mobile-preview iframe").hasAttribute("src")','closed and cleaned up');
  assert.equal(await evaluate('document.activeElement.hasAttribute("data-mobile-preview") || document.activeElement.id==="stage-canvas"'),true);
  assert.equal(await evaluate('document.querySelectorAll(".mobile-preview canvas").length'),0);
  await evaluate('document.querySelector("[data-mobile-preview]").click()');
  await until('document.querySelector("[data-phone=ready]") && document.querySelector(".mobile-preview iframe").src==="https://boxlyne.com.br/"','reopened');
  await evaluate('document.querySelector(".mobile-preview iframe").dispatchEvent(new Event("error"))');
  await evaluate('document.querySelector("[data-show-video]").click()');
  await until('document.querySelector(".mobile-preview video").readyState>=2','video fallback');
  assert.equal(await evaluate('document.querySelector(".mobile-preview iframe").hidden'),true);
  await evaluate('document.querySelector(".mobile-preview video").src="/missing-mobile-video.webm"');
  await until('!document.querySelector("[data-retry]").hidden','video error');
  await evaluate('document.querySelector("[data-retry]").click()');
  await until('document.querySelector(".mobile-preview video").readyState>=2','retry recovery');
  await evaluate('document.querySelector("[data-close]").click()');
  await until('!document.querySelector("dialog").open','closed after retry');
  await page.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await page.send('Emulation.setDeviceMetricsOverride',{width:800,height:600,deviceScaleFactor:1,mobile:false});
  await evaluate('document.querySelector("[data-mobile-preview]").click()');
  await until('document.querySelector("[data-phone=ready]")','narrow desktop');
  assert.equal(await evaluate('document.querySelector("dialog").scrollWidth<=document.querySelector("dialog").clientWidth'),true);
  await evaluate('document.querySelector("[data-close]").click()');
  await page.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await page.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await page.send('Page.navigate',{url:base});
  await until('document.readyState==="complete"','mobile page');
  assert.equal(await evaluate('getComputedStyle(document.querySelector("[data-mobile-preview]")).display'),'none');
  assert.equal(await evaluate('performance.getEntriesByType("resource").some(x=>/models\\/mobile\\/scene.gltf|boxlyne.webm|mobile-phone-viewer.js/.test(x.name))'),false);
  assert.equal(await evaluate('document.querySelector(".project-demo-actions a").getBoundingClientRect().width>0'),true);
  assert.equal(page.errors.length,0,JSON.stringify(page.errors));
  console.log('PASS: mobile-width live iframe, video fallback, phone rotation, Escape, cleanup and reopen.');
} finally {
  page?.close();
  if (browser) {
    await browser.send('Browser.close').catch(() => {});
    browser.close();
  } else child?.kill();
}
