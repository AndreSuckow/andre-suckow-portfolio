import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { whatsappMessage } from './public/cs-model.js';
import { createCareerJourney, drawCareerScreen } from './public/career-map.js';
import { projectDemoButtons } from './public/project-demo-actions.js';
const html = fs.readFileSync('public/index.html', 'utf8');
test('project storage puts three cartridges per level on matching shelves', async () => {
  const { projectCartridgeLayout, projectShelves, PROJECT_SHELF } =
    await import('./public/project-shelf.js');
  const count = JSON.parse(fs.readFileSync('profile.json', 'utf8')).projects.length + 1,
    slots = projectCartridgeLayout(count),
    shelves = projectShelves(count);
  assert.equal(slots.length, count);
  assert.equal(slots.filter((slot) => slot.position[1] === PROJECT_SHELF.baseY).length, 3);
  assert.equal(slots.filter((slot) => slot.position[1] > PROJECT_SHELF.baseY).length, 3);
  assert.equal(shelves.length, 1);
  for (const slot of slots) {
    const [x, y, z] = slot.position;
    if (y === PROJECT_SHELF.baseY) continue;
    const shelf = shelves.find(
      (s) => Math.abs(s.y + s.thickness / 2 + PROJECT_SHELF.restOffset - y) < 1e-8,
    );
    assert(shelf);
    assert(x - 0.05 > shelf.x - shelf.width / 2 && x + 0.05 < shelf.x + shelf.width / 2);
    assert(z - 0.03 > shelf.z - shelf.depth / 2 && z + 0.03 < shelf.z + shelf.depth / 2);
  }
  const expanded = projectCartridgeLayout(10);
  assert.equal(new Set(expanded.map((s) => s.position.join(','))).size, 10);
  assert.equal(projectShelves(10).length, 3);
  assert.throws(() => projectCartridgeLayout(0));
});
test('project cartridges offer delivery details and only the links supplied for that project', async () => {
  const { default: generator } = await import('./cs-portfolio.cjs');
  const profile = JSON.parse(fs.readFileSync('profile.json', 'utf8'));
  const project = {
    slug: 'example',
    cartTitle: 'EXAMPLE',
    title: 'Entrega de exemplo',
    subtitle: 'Descrição da entrega',
    summary: 'Interface de demonstração',
    stack: ['JavaScript'],
    labelArt: '/img/example.png',
    shellColor: '#ffffff',
    labelColor: '#000000',
    statusLabel: 'Projeto',
    screenshot: { src: '/img/example.png', alt: 'Tela da entrega', width: 800, height: 600 },
  };
  for (const links of [
    { demoUrl: 'https://example.com/demo' },
    { repoUrl: 'https://github.com/example/project' },
    { demoUrl: 'https://example.com/demo', repoUrl: 'https://github.com/example/project' },
  ]) {
    const dom = new JSDOM(
        generator.sections({ ...profile, projects: [{ ...project, ...links }] }).projects,
      ),
      d = dom.window.document;
    for (const [field, action] of [
      ['demoUrl', 'demo'],
      ['repoUrl', 'code'],
    ]) {
      const link = d.querySelector(`[data-tv="projetos/${action}/example"]`);
      assert.equal(!!link, !!links[field]);
      if (link) {
        assert.equal(link.href, links[field]);
        assert.equal(link.target, '_blank');
        assert(link.rel.includes('noopener'));
      }
    }
    assert.equal(d.querySelector('.project-site-image').alt, 'Tela da entrega');
    assert(d.querySelector('[data-tv="projetos/contact"][data-action="open-contact"]'));
    assert(d.body.textContent.includes(profile.projectInvitation.title));
    assert(!d.body.textContent.includes('Visitar empresa'));
    dom.window.close();
  }
});

test('Sinergia project points to its 5.0 demo and repository', () => {
  const profile = JSON.parse(fs.readFileSync('profile.json', 'utf8'));
  const project = profile.projects.find((entry) => entry.slug === 'sinergia-movel');
  assert(project);
  assert.equal(project.demoUrl, 'https://andresuckow.github.io/sinergia-onepage-b2b-5.0/');
  assert.equal(project.repoUrl, 'https://github.com/AndreSuckow/sinergia-onepage-b2b-5.0');
});

test('every project with an online demo gets its own mobile iframe preview by default', async () => {
  const { default: generator } = await import('./cs-portfolio.cjs');
  const profile = JSON.parse(fs.readFileSync('profile.json', 'utf8')),
    markup = generator.sections(profile).projects,
    dom = new JSDOM(markup),
    buttons = [...dom.window.document.querySelectorAll('[data-mobile-preview]')];
  assert.equal(buttons.length, profile.projects.filter((project) => project.demoUrl).length);
  for (const project of profile.projects.filter((entry) => entry.demoUrl)) {
    const button = dom.window.document.querySelector(`[data-tv="projetos/mobile/${project.slug}"]`);
    assert(button);
    assert.equal(button.dataset.mobileDemo, project.demoUrl);
    assert.equal(button.dataset.projectTitle, project.cartTitle);
  }
  assert(!markup.includes('boxlyne.webm'));

  const future = {
      ...profile.projects[0],
      slug: 'future-project',
      cartTitle: 'FUTURE PROJECT',
      demoUrl: 'https://future.example/',
    },
    futureDom = new JSDOM(generator.sections({ ...profile, projects: [future] }).projects);
  assert.equal(
    futureDom.window.document.querySelector('[data-mobile-preview]').dataset.mobileDemo,
    future.demoUrl,
  );

  const disabled = { ...future, mobilePreview: false },
    disabledDom = new JSDOM(generator.sections({ ...profile, projects: [disabled] }).projects);
  assert.equal(disabledDom.window.document.querySelector('[data-mobile-preview]'), null);
  assert.equal(
    disabledDom.window.document.querySelector('[data-tv="projetos/demo/future-project"]').href,
    future.demoUrl,
  );
  dom.window.close();
  futureDom.window.close();
  disabledDom.window.close();
});

test('3D project cards also show the mobile preview for online demos on desktop', () => {
  const profile = JSON.parse(fs.readFileSync('profile.json', 'utf8'));
  for (const project of profile.projects.filter((entry) => entry.demoUrl)) {
    const [online, mobile] = projectDemoButtons(project, 120, true);
    assert.equal(online.id, `projetos/demo/${project.slug}`);
    assert.equal(online.rect.w, 192);
    assert.equal(mobile.id, `projetos/mobile/${project.slug}`);
    assert.equal(mobile.rect.w, 192);
    assert.deepEqual(
      projectDemoButtons(project, 120, false).map((button) => button.id),
      [`projetos/demo/${project.slug}`],
    );
  }
  assert.deepEqual(projectDemoButtons({ slug: 'no-demo' }, 120, true), []);
  assert.deepEqual(
    projectDemoButtons({ ...profile.projects[0], mobilePreview: false }, 120, true).map(
      (button) => button.id,
    ),
    [`projetos/demo/${profile.projects[0].slug}`],
  );
});

test('blank cartridge is a collaboration invitation with contact and eject actions', () => {
  const source = fs.readFileSync('src/engine.js', 'utf8'),
    start = source.indexOf('function $S('),
    end = source.indexOf('function ', start + 10),
    profile = JSON.parse(fs.readFileSync('profile.json', 'utf8'));
  const text = [],
    actions = [];
  const draw = new Function(
    'jh',
    'Z',
    'X',
    'Q',
    'wv',
    'RS',
    source.slice(start, end) + ';return $S;',
  )(
    profile.projectInvitation,
    1024,
    {},
    (_ctx, value) => text.push(value),
    (_ctx, value) => text.push(value),
    (_ctx, _game, item) => actions.push(item),
  );
  draw({}, {}, 0);
  assert(text.includes(profile.projectInvitation.title));
  assert(text.includes(profile.projectInvitation.summary));
  assert(!text.includes('ERRO 404'));
  assert.deepEqual(
    actions.map((item) => item.id),
    ['projetos/contact', 'projetos/eject'],
  );
});

test('single frontend route shares canonical content with the TV and printable resume', () => {
  const profile = JSON.parse(fs.readFileSync('profile.json', 'utf8')),
    details = JSON.parse(fs.readFileSync('skill-details.json', 'utf8'));
  const dom = new JSDOM(html),
    d = dom.window.document,
    content = JSON.parse(d.querySelector('#portfolio-data').textContent);
  const { experience, skills, achievements, projects, ...person } = profile;
  assert.deepEqual(content, { person, experience, skills, achievements, projects });
  assert.deepEqual(JSON.parse(d.querySelector('#skill-details').textContent), details);
  assert.equal(d.documentElement.dataset.portfolio, 'curriculo');
  assert(!fs.existsSync('public/cs'));
  const cv = new JSDOM(fs.readFileSync('public/curriculo/index.html', 'utf8'));
  for (const document of [d, cv.window.document]) {
    const text = document.body.textContent;
    for (const company of experience.filter((x) => !x.invitation))
      for (const fact of [company.role, company.org, company.period, ...company.bullets])
        assert(text.includes(fact), fact);
    for (const group of profile.tools)
      for (const tool of group.items) assert(text.includes(tool), tool);
    assert(
      text.includes('React') &&
        text.includes('TypeScript') &&
        text.includes('GP Strategies Brasil'),
    );
    assert(!text.includes('Jan 2018 – Jan 2024'));
    assert(!text.includes('300 empresas'));
  }
  for (const project of projects) {
    const study = new JSDOM(
      fs.readFileSync('public/cases/' + project.slug + '/index.html', 'utf8'),
    );
    if (project.demoUrl) {
      const first = study.window.document.querySelector('.document-actions a');
      assert.equal(first.href, project.demoUrl);
      assert(first.classList.contains('btn--primary'));
      assert.equal(study.window.document.querySelectorAll('.btn--primary').length, 1);
    }
    assert(study.window.document.body.textContent.includes(project.caseStory));
    assert.equal(
      study.window.document.querySelector('[data-document-back]').getAttribute('href'),
      '/',
    );
    study.window.close();
  }
  const engine = fs.readFileSync('public/engine.js', 'utf8');
  for (const [name, next, field] of [
    ['Eh', 'Dh', 'person'],
    ['Dh', 'Oh', 'experience'],
    ['Oh', 'kh', 'skills'],
    ['kh', 'Ah', 'achievements'],
    ['Ah', 'jh', 'projects'],
  ]) {
    const begin = engine.indexOf(name + '=') + name.length + 1,
      finish = engine.indexOf(',' + next + '=', begin);
    const select = new Function('portfolioContent', 'return ' + engine.slice(begin, finish));
    assert.equal(select(content), content[field]);
  }
  assert.equal(experience.find((x) => x.id === 'marq').period, 'Jan 2018 – Jan 2021');
  assert.equal(experience.find((x) => x.id === 'gp').period, 'Fev 2021 – Mar 2025');
  assert.equal(experience.find((x) => x.id === 'match').period, 'Jul 2026 – Atual');
  dom.window.close();
  cv.window.close();
});

test('career map creates a selectable stop for every job and the invitation', async () => {
  const { careerStops } = await import('./public/career-map.js');
  const profile = JSON.parse(fs.readFileSync('profile.json', 'utf8'));
  const points = careerStops(profile.experience.length);
  assert.equal(points.length, 6);
  assert.equal(new Set(points.map((p) => p.join(','))).size, 6);
  const journey = createCareerJourney(points);
  assert(journey.walkTo(5, 0));
  assert.equal(journey.update(2), 5);
  assert.deepEqual(journey.position, points[5]);
  assert.throws(() => careerStops(0));
});

test('career travel follows the path for two seconds and changes location only on arrival', () => {
  const stops = [
      [-0.4, -1.93],
      [0.25, 0.67],
      [-0.4, 3.27],
    ],
    journey = createCareerJourney(stops);
  assert(journey.walkTo(1, 0));
  assert.equal(journey.current, 0);
  assert.deepEqual(journey.position, stops[0]);
  assert.equal(journey.update(1), null);
  const halfway = journey.position;
  assert.notDeepEqual(halfway, stops[0]);
  assert.notDeepEqual(halfway, stops[1]);
  assert.equal(journey.current, 0);
  assert.equal(journey.update(1), null);
  assert.deepEqual(journey.position, halfway, 'A frozen game clock freezes the walk');
  journey.update(1.999);
  assert.equal(journey.current, 0);
  assert.equal(journey.update(2), 1);
  assert.equal(journey.current, 1);
  assert(!journey.moving);
  assert.deepEqual(journey.position, stops[1]);
  assert.equal(journey.walkTo(1, 3), false);
});

test('chronological trail visits every employer and routes around buildings in both directions', async () => {
  const { careerStops, careerOrder, careerTrail } = await import('./public/career-map.js');
  const companies = JSON.parse(fs.readFileSync('profile.json', 'utf8')).experience,
    order = careerOrder(companies);
  assert.deepEqual(
    order.map((i) => companies[i].id),
    ['gvt', 'marq', 'gp', 'pilgrims', 'match', 'next'],
  );
  const slots = careerStops(companies.length),
    buildings = companies.map((_, i) => slots[order.indexOf(i)]),
    stations = buildings.map(([x, z]) => [x, z + 0.67]);
  const trail = careerTrail(stations, order),
    journey = createCareerJourney(stations, { order });
  assert.equal(journey.current, order[0]);
  assert(order.every((id, i) => i === 0 || trail.distances[id] > trail.distances[order[i - 1]]));
  const onTrail = ([x, z]) =>
    trail.points.slice(1).some((b, i) => {
      const a = trail.points[i];
      return (
        x >= Math.min(a[0], b[0]) - 1e-8 &&
        x <= Math.max(a[0], b[0]) + 1e-8 &&
        z >= Math.min(a[1], b[1]) - 1e-8 &&
        z <= Math.max(a[1], b[1]) + 1e-8
      );
    });
  for (const [target, start] of [
    [order.at(-1), 0],
    [order[0], 3],
  ]) {
    assert(journey.walkTo(target, start));
    for (let step = 0; step <= 100; step++) {
      journey.update(start + step / 50);
      const [x, z] = journey.position;
      assert(onTrail([x, z]), 'Avatar stays on the rendered route');
      assert(
        !buildings.some(([bx, bz]) => Math.abs(x - bx) < 0.5 && Math.abs(z - bz) < 0.43),
        'Route cannot cut through a house',
      );
    }
    assert.equal(journey.current, target);
  }
  journey.walkTo(order.at(-1), 6);
  journey.update(6.7);
  const before = journey.position;
  journey.walkTo(order[0], 6.7);
  assert.deepEqual(journey.position, before);
  journey.update(8.7);
  assert.equal(journey.current, order[0]);
});
test('retargeting a walking character starts from its current position without teleporting', () => {
  const journey = createCareerJourney([
    [-0.4, -1.93],
    [0.25, 0.67],
    [-0.4, 3.27],
  ]);
  journey.walkTo(2, 0);
  journey.update(0.8);
  const before = journey.position;
  assert(journey.walkTo(1, 0.8));
  assert.deepEqual(journey.position, before);
  journey.update(2.799);
  assert.equal(journey.current, 0);
  journey.update(2.8 + 0.001);
  assert.equal(journey.current, 1);
});
test('career hover highlights a stop without selecting it or changing unrelated hover behavior', () => {
  const source = fs.readFileSync('src/engine.js', 'utf8'),
    start = source.indexOf('hover(e){let t=e?.id'),
    end = source.indexOf('addItem(e)', start);
  const hover = new Function('return function' + source.slice(start + 'hover'.length, end))(),
    selected = [];
  const item = { id: 'experiencia/1', kind: 'career' },
    state = {
      hoverId: null,
      selectable: () => [item],
      select: (...args) => selected.push(args),
      invalidate() {},
    };
  hover.call(state, item);
  assert.equal(state.hoverId, item.id);
  assert.equal(selected.length, 0);
  item.kind = 'select';
  hover.call(state, null);
  hover.call(state, item);
  assert.equal(selected.length, 1);
});
test('career information stays at the visited company while hovering or walking', () => {
  const companies = [0, 1, 2].map((i) => ({
      id: String(i),
      phase: 'Fase ' + i,
      title: 'Local ' + i,
      role: 'Cargo ' + i,
      org: 'Empresa ' + i,
      period: '2020',
      start: 2020,
      bullets: [],
    })),
    map = createCareerJourney([
      [-0.4, -1.93],
      [0.25, 0.67],
      [-0.4, 3.27],
    ]),
    text = [],
    arrivals = [];
  map.draw = () => companies.map((_, i) => ({ x: i * 100, y: 200, w: 90, h: 90 }));
  const game = {
      selected: 2,
      hoverId: 'experiencia/2',
      careerMap: map,
      assets: { screenshots: {} },
      addItem() {},
      onSelect: (item) => arrivals.push(item),
    },
    helpers = {
      companies,
      colors: {},
      Q() {},
      kv() {},
      Ev() {},
      Tv() {},
      Nv() {},
      wv(_ctx, value, _x, y) {
        text.push(value);
        return y + 30;
      },
    };
  drawCareerScreen({}, game, 0, helpers);
  assert(text.includes('Cargo 0'));
  assert(!text.includes('Cargo 2'));
  assert(!map.moving);
  map.walkTo(2, 0);
  text.length = 0;
  drawCareerScreen({}, game, 1.9, helpers);
  assert(text.includes('Cargo 0'));
  assert.equal(arrivals.length, 0);
  text.length = 0;
  drawCareerScreen({}, game, 2, helpers);
  assert(text.includes('Cargo 2'));
  assert.equal(arrivals.length, 1);
  assert(arrivals[0].label.includes('Empresa 2'));
});
test('Projects keeps the cartridge view at every scroll position; Skills stays close to the TV', () => {
  const source = fs.readFileSync('src/engine.js', 'utf8'),
    start = source.indexOf('frame(e,t,n){'),
    end = source.indexOf('update(e,t,n=!1)', start);
  const document = { documentElement: { dataset: {} } };
  const frame = new Function(
    'Kh',
    'Uh',
    'document',
    'return function' + source.slice(start + 'frame'.length, end),
  )(
    (from, to, blend) => ({ from: from.id, to: to.id, blend }),
    (value) => Math.max(0, Math.min(1, value)),
    document,
  );
  const views = Object.fromEntries(
    ['wide', 'screen', 'desk', 'door', 'reading'].map((id) => [id, { id }]),
  );
  const pose = (result) => (result.blend === 1 ? result.to : result.from);
  for (const reduced of [false, true])
    for (const mobileReading of [false, true])
      for (const progress of [0, 0.08, 0.5, 0.95, 1]) {
        const camera = { views, goal: {}, reduced, mobileReading };
        assert.equal(pose(frame.call(camera, 'projetos', progress, 0)), 'desk');
        assert.equal(pose(frame.call(camera, 'projetos', progress, 1)), 'screen');
        assert.equal(pose(frame.call(camera, 'skills', progress, 0)), 'screen');
      }
  for (const reduced of [false, true])
    for (const mobileReading of [false, true]) {
      const camera = { views, goal: {}, reduced, mobileReading };
      for (const [preview, expected] of [
        ['screen', 'reading'],
        ['room', 'wide'],
      ]) {
        document.documentElement.dataset.mobileTvPreview = preview;
        assert.equal(pose(frame.call(camera, 'skills', 0, 0)), mobileReading ? expected : 'screen');
        assert.equal(pose(frame.call(camera, 'projetos', 0, 0)), 'desk');
        assert.equal(pose(frame.call(camera, 'projetos', 0, 1)), 'screen');
      }
    }
});
test('project loading and camera dive wait for the visible cartridge insertion; ejection waits for the shelf', async () => {
  const source = fs.readFileSync('src/engine.js', 'utf8'),
    start = source.lastIndexOf('async function I(e){'),
    end = source.indexOf('function ie(){', start);
  const events = [],
    M = { started: true, focus: 1 },
    O = { active: 'projetos' },
    g = {
      tab: 'projetos',
      setTab(value) {
        this.tab = value;
      },
      setMode() {},
      setCart(value) {
        this.cart = value;
        if (value) events.push(value.phase);
      },
      invalidate() {},
    },
    k = { eject() {}, insert() {}, staticBurst() {}, select() {} },
    b = { static() {} },
    C = { blinkLed() {} },
    D = { shake() {} };
  let ready, inserted;
  const w = {
    busy: false,
    inserted: null,
    insert: async (slug) => {
      events.push('insert');
      await new Promise((resolve) => {
        inserted = () => {
          w.inserted = { slug };
          resolve();
        };
      });
    },
    eject: async () => {
      events.push('eject');
      w.inserted = null;
    },
  };
  const xi = {
    to: async (target, options) => {
      Object.assign(
        target,
        options.focus === undefined ? { p: options.p } : { focus: options.focus },
      );
      options.onUpdate?.();
      if (options.focus === 1) events.push('close-up');
    },
  };
  let interruptions = 0;
  const factory = new Function(
    'M',
    'O',
    'g',
    'w',
    'k',
    'b',
    'C',
    'D',
    'xi',
    'showProjectShelf',
    'projectShelfReady',
    'n',
    'SC',
    'o',
    'Fh',
    'Ah',
    'te',
    'roomCascade',
    `let projectBusy=false;${source.slice(start, end)}return {insert:I,eject:L};`,
  );
  const actions = factory(
    M,
    O,
    g,
    w,
    k,
    b,
    C,
    D,
    xi,
    () => {
      M.focus = 0;
      events.push('shelf');
    },
    () =>
      new Promise((resolve) => {
        ready = () => resolve(true);
      }),
    () => {},
    (x) => x,
    false,
    { cart: { loading: 0.9 } },
    [{ slug: 'onboarding', title: 'Projeto', summary: 'Resumo' }],
    () => {},
    {
      interrupt() {
        interruptions++;
      },
    },
  );
  const inserting = actions.insert('onboarding');
  assert.deepEqual(events, ['shelf']);
  ready();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(events, ['shelf', 'insert']);
  assert.equal(M.focus, 0);
  inserted();
  await inserting;
  assert.deepEqual(events, ['shelf', 'insert', 'loading', 'ready', 'close-up']);
  assert.equal(M.focus, 1);
  const ejecting = actions.eject();
  assert.equal(M.focus, 0);
  assert(!events.includes('eject'));
  ready();
  await ejecting;
  assert.equal(events.at(-1), 'eject');
  assert.equal(w.inserted, null);
  assert.equal(interruptions, 2);
});
function bootFixture({ webgl = true, deferred = false } = {}) {
  const dom = new JSDOM(html, { url: 'http://localhost:4173/', runScripts: 'outside-only' }),
    w = dom.window;
  w.localStorage.setItem('andre:prefs', JSON.stringify({ mode: '2d', sound: false, crt: false }));
  w.matchMedia = (query) => ({ matches: query.includes('prefers-reduced-motion') });
  w.requestIdleCallback = (callback) => callback();
  Object.defineProperty(w.document, 'readyState', { value: 'complete' });
  w.HTMLCanvasElement.prototype.getContext = () =>
    webgl ? { getExtension: () => ({ loseContext() {} }) } : null;
  let finish;
  const engine = { setActive() {} };
  w.__engineStart = () =>
    deferred
      ? new Promise((resolve) => {
          finish = () => resolve(engine);
        })
      : Promise.resolve(engine);
  const source = fs
    .readFileSync('src/boot.js', 'utf8')
    .replace(
      /import\(`\.\/engine\.js\?v=cs-mode-3`\)/,
      'Promise.resolve({start:window.__engineStart})',
    )
    .replaceAll('import.meta', '({url:location.href})')
    .replace(/export\{[^}]+\};?\s*$/, '');
  w.eval(source);
  return { dom, w, finish: () => finish?.() };
}
test('every visit starts in 3D despite a saved 2D preference, while manual switching remains available', async () => {
  const { dom, w } = bootFixture();
  for (let i = 0; i < 100 && w.document.documentElement.hasAttribute('data-site-loading'); i++)
    await new Promise((resolve) => setTimeout(resolve, 5));
  assert(
    !w.document.documentElement.hasAttribute('data-site-loading'),
    'Manual navigation begins after the loading reveal',
  );
  assert.equal(w.document.documentElement.dataset.mode, '3d');
  const button = w.document.querySelector('[data-toggle="mode"]');
  button.click();
  assert.equal(w.document.documentElement.dataset.mode, '2d');
  button.click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(w.document.documentElement.dataset.mode, '3d');
  const prefs = JSON.parse(w.localStorage.getItem('andre:prefs'));
  assert.equal(prefs.sound, false);
  assert.equal(prefs.crt, false);
  dom.window.close();
});
test('a manual 2D switch during loading is respected and unsupported WebGL still has readable content', async () => {
  const pending = bootFixture({ deferred: true });
  await new Promise((resolve) => setTimeout(resolve, 0));
  pending.w.document.querySelector('[data-toggle="mode"]').click();
  pending.finish();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(pending.w.document.documentElement.dataset.mode, '2d');
  pending.dom.window.close();
  const fallback = bootFixture({ webgl: false });
  assert.equal(fallback.w.document.documentElement.dataset.mode, '2d');
  fallback.dom.window.close();
});
test('Tempo livre shares the supplied family description and icons across the portfolio', () => {
  const dom = new JSDOM(html),
    d = dom.window.document;
  for (const link of d.querySelectorAll('a[data-nav-tab="hobbies"]'))
    assert.equal(link.textContent.replace(/^05/, ''), 'Tempo livre');
  assert.equal(d.querySelector('#hobbies-title').textContent, 'Tempo livre');
  const family = d.querySelector('[data-hobby-icon="family"]').closest('article');
  assert.equal(family.querySelector('h3').textContent, 'Família');
  assert(family.textContent.includes('Meus pais, minha esposa e meus quatro filhos'));
  assert.equal(d.querySelectorAll('[data-hobby-icon]').length, 6);
  dom.window.close();
});

test('WhatsApp greeting uses Sao Paulo time at the morning, afternoon and evening boundaries', () => {
  for (const [time, part] of [
    ['04:59', 'boa noite'],
    ['05:00', 'bom dia'],
    ['11:59', 'bom dia'],
    ['12:00', 'boa tarde'],
    ['17:59', 'boa tarde'],
    ['18:00', 'boa noite'],
  ]) {
    const message = whatsappMessage(new Date(`2026-10-14T${time}:00-03:00`));
    assert(message.includes(part));
    assert(message.endsWith('Temos uma oportunidade para você!'));
  }
});

test('frontend content uses verified contacts and treats Sua companhia as an invitation', () => {
  const dom = new JSDOM(html),
    d = dom.window.document;
  assert.equal(d.querySelectorAll('.phase').length, 6);
  assert(d.querySelectorAll('.phase')[5].textContent.includes('Sua companhia'));
  assert(/Frontend|React|TypeScript/.test(d.querySelector('#inicio').textContent));
  assert(d.body.textContent.includes('GP Strategies Brasil'));
  assert(d.querySelector('#sobre').textContent.includes('Curitiba – PR'));
  assert(d.querySelector('#sobre a[href="https://www.linkedin.com/in/andresuckow/"]'));
  assert(d.querySelector('#sobre a[href="mailto:andre.suckow.dev@gmail.com"]'));
  assert.equal(d.querySelectorAll('#inicio .hero__actions .btn').length, 4);
  assert(d.querySelector('#inicio a[href="https://github.com/AndreSuckow"]'));
  assert(d.querySelector('#inicio a[href="https://www.linkedin.com/in/andresuckow/"]'));
  assert.equal(d.querySelectorAll('[data-pad="a"], [data-pad="b"]').length, 2);
  assert.equal(
    d.querySelectorAll('.attribute__trigger').length,
    JSON.parse(fs.readFileSync('profile.json', 'utf8')).stats.length,
  );
  for (const button of d.querySelectorAll('.attribute__trigger'))
    assert(d.getElementById(button.getAttribute('aria-describedby')).textContent.length > 40);
  assert(d.querySelector('#hobbies a[href="https://www.instagram.com/tf.church/"]'));
  for (const project of JSON.parse(fs.readFileSync('profile.json', 'utf8')).projects) {
    const link = d.querySelector(`[data-tv="projetos/case/${project.slug}"]`);
    assert.equal(link.getAttribute('href'), `/cases/${project.slug}/`);
    assert(link.closest('.resume-project').querySelector('.resume-tags'));
  }
  dom.window.close();
});

function setup() {
  const dom = new JSDOM(html, {
      url: 'http://localhost:4173/',
      runScripts: 'outside-only',
      pretendToBeVisual: true,
    }),
    w = dom.window;
  let visible = false;
  const intervals = new Map();
  let id = 0;
  w.document.getElementById('fim').getBoundingClientRect = () =>
    visible ? { top: 50, bottom: 700 } : { top: 2000, bottom: 2700 };
  w.setInterval = (fn) => {
    intervals.set(++id, fn);
    return id;
  };
  w.clearInterval = (id) => intervals.delete(id);
  w.whatsappMessage = whatsappMessage;
  w.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new w.Event('close'));
  };
  w.eval(fs.readFileSync('public/cs-interactions.js', 'utf8').replace(/^import .*;\r?\n/gm, ''));
  return {
    dom,
    w,
    intervals,
    setVisible: (value) => {
      visible = value;
      w.document.dispatchEvent(new w.Event('scroll'));
    },
    tick: () => {
      [...intervals.values()].forEach((fn) => fn());
    },
  };
}
test('Continue starts only at the final screen, cancels when leaving, and opens Game Over once at zero', () => {
  const s = setup(),
    d = s.w.document,
    dialog = d.querySelector('#game-over-dialog');
  assert.equal(s.intervals.size, 0);
  s.setVisible(true);
  for (let i = 0; i < 4; i++) s.tick();
  assert.equal(d.querySelector('#continue-count').textContent, '5');
  assert(!dialog.open);
  s.setVisible(false);
  assert.equal(s.intervals.size, 0);
  for (let i = 0; i < 10; i++) s.tick();
  assert(!dialog.open);
  s.setVisible(true);
  for (let i = 0; i < 9; i++) s.tick();
  assert.equal(d.querySelector('#continue-count').textContent, '0');
  assert(dialog.open);
  assert.equal(d.activeElement.id, 'game-over-title');
  d.querySelector('[data-game-over-close]').click();
  assert(!dialog.open);
  s.setVisible(false);
  s.setVisible(true);
  assert.equal(s.intervals.size, 0);
  s.dom.window.close();
});
test('Attribute descriptions are available by tap and dismiss with Escape', () => {
  const s = setup(),
    d = s.w.document,
    button = d.querySelector('.attribute__trigger');
  button.click();
  assert(button.closest('.attribute').classList.contains('is-open'));
  d.dispatchEvent(new s.w.KeyboardEvent('keydown', { key: 'Escape' }));
  assert(!button.closest('.attribute').classList.contains('is-open'));
  s.dom.window.close();
});
