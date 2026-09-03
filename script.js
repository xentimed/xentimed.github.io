/* ============================================================
   Virtual file system — edit file/folder names and txt content here
   ============================================================ */

// Helpers to build nodes compactly
const file = (name, content) => ({ type: 'file', name, content });
const dir  = (name, children) => ({ type: 'dir',  name, children });
const app  = (name, target)   => ({ type: 'app',  name, target });

const FS_ROOT = dir('/', [

  file('about_me.txt', `whoami

I'm Youssef Tamyachte. Cybersecurity student.

I'm building this site as a home base for my work: capturing what I learn, the
projects I build, and the rabbit holes I go down along the way.`),

  file('academic_journey.txt', `academic_journey

Currently studying cybersecurity, focusing on offensive security, Linux systems,
and networking fundamentals.

A running timeline of my coursework, certifications, and focus areas will live
here as the journey progresses.`),

  dir('projects', [
    dir('musiorg', [
      file('readme.txt', `Project: musiorg

A terminal-UI music organizer. Scans a music directory, reads genre tags from
audio metadata, and sorts everything into per-genre subfolders — with
collision-safe file moving and duplicate detection built in.

Fully keyboard-driven and re-run safe.

Stack: Python · Textual · Mutagen
Repo : github.com/xentimed/musiorg

>>> Open the repo in the built-in browser (double-click 'Open in Browser' above).`)
    ]),
    dir('openpod', [
      file('readme.txt', `Project: openpod

Open-source Android-based firmware that turns an old smartphone into a
dedicated, private, offline music player with a classic iPod-style UI.

No streaming, no ads, no Google. Currently in early development, built on
LineageOS/AOSP.

Stack: Android · LineageOS/AOSP · Flutter/Dart (planned)
Repo : github.com/xentimed/openpod

>>> Open the repo in the built-in browser (double-click 'Open in Browser' above).`)
    ])
  ]),

  dir('experience', [
    dir('open-source-contributions', [
      file('readme.txt', `Experience: open-source contributions

A summary of issues I've fixed and features I've contributed to open-source
Linux and security tooling.

Will include the repos, PRs, and what each contribution taught me.`)
    ])
  ]),

  app('console', 'terminal')
]);

/* ---- helpers ---- */
function getNode(pathArr, from = FS_ROOT) {
  let node = from;
  for (const seg of pathArr) {
    if (node.type !== 'dir') return null;
    node = node.children.find(c => c.name === seg);
    if (!node) return null;
  }
  return node;
}

const ICONS = { dir: '📁', file: '📄', app: '🖥️' };
const titleOf = (name) =>
  name.replace(/_/g, ' ').replace(/\.txt$/, '').replace(/\.exe$/, '');

/* ---- Live repos (browser mirror) --------------------------------------- */
const REPOS = {
  musiorg: {
    owner: 'xentimed', name: 'musiorg',
    tag: 'Python · Textual · Mutagen',
    blurb: 'A terminal-UI music organizer that sorts your library by genre.'
  },
  openpod: {
    owner: 'xentimed', name: 'openpod',
    tag: 'Android · LineageOS · Flutter',
    blurb: 'Turn an old smartphone into a private, offline music player.'
  }
};

function repoForPath(pathArr) {
  if (!pathArr.length) return null;
  const name = pathArr[pathArr.length - 1];
  const node = getNode(pathArr);
  return (node && node.type === 'dir' && REPOS[name]) ? { ...REPOS[name] } : null;
}

/* ============================================================
   Window manager
   ============================================================ */
const windows = document.querySelectorAll('.window');
// All windows start closed (hidden) — opening adds them to the taskbar
windows.forEach(w => w.classList.add('closed'));
const taskbarWindows = document.getElementById('taskbar-windows');
const startBtn = document.getElementById('start-btn');
const startMenu = document.getElementById('start-menu');

let zTop = 10;
function getTopZ() {
  let max = 10;
  windows.forEach(w => max = Math.max(max, parseInt(w.style.zIndex) || 10));
  return max;
}
const MAXIMIZED_Z = 80; // above gadgets(15), taskbar(30) and start menu(45)
function focusWindow(win) {
  win.classList.add('focused');
  win.style.zIndex = getTopZ() + 1;
  windows.forEach(o => { if (o !== win) o.classList.remove('focused'); });
}
function updateTaskbarButtons() {
  taskbarWindows.innerHTML = '';
  windows.forEach(win => {
    if (win.classList.contains('closed')) return;
    const btn = document.createElement('button');
    btn.className = 'taskbar-window' + (win.classList.contains('active') ? ' active' : '');
    btn.textContent = win.dataset.title || win.id;
    btn.title = win.dataset.title;
    btn.addEventListener('click', () => {
      if (win.classList.contains('active')) minimizeWindow(win);
      else showWindow(win);
    });
    taskbarWindows.appendChild(btn);
  });
}
function showWindow(win) {
  win.classList.remove('closed', 'minimized');
  win.classList.add('active');
  win.style.display = 'block';
  focusWindow(win);
  updateTaskbarButtons();
}
function minimizeWindow(win) {
  win.classList.add('minimized', 'closed');
  win.classList.remove('active');
  win.style.display = 'none';
  const vis = [...windows].filter(w => !w.classList.contains('closed') && w !== win);
  if (vis.length) focusWindow(vis[vis.length - 1]);
  updateTaskbarButtons();
}
function closeWindow(win) {
  win.classList.add('closed');
  win.classList.remove('active');
  win.style.display = 'none';
  const vis = [...windows].filter(w => !w.classList.contains('closed') && w !== win);
  if (vis.length) focusWindow(vis[vis.length - 1]);
  updateTaskbarButtons();
  // closing the console ends the session — next open starts fresh with the fetch banner
  if (win.id === 'window-terminal') {
    const out = document.getElementById('terminal-output');
    if (out) out.innerHTML = '';
  }
}
function toggleMaximize(win) {
  if (win.classList.contains('maximized')) {
    win.classList.remove('maximized');
    win.style.top = win.dataset.restoreTop || '';
    win.style.left = win.dataset.restoreLeft || '';
    win.style.width = win.dataset.restoreWidth || '';
    win.style.height = win.dataset.restoreHeight || '';
    showWindow(win);
  } else {
    win.dataset.restoreTop = win.style.top;
    win.dataset.restoreLeft = win.style.left;
    win.dataset.restoreWidth = win.style.width || win.offsetWidth + 'px';
    win.dataset.restoreHeight = win.style.height;
    win.classList.add('maximized');
    showWindow(win);
    win.style.zIndex = MAXIMIZED_Z; // rise above the gadget sidebar
  }
}

windows.forEach(win => {
  win.addEventListener('mousedown', () => focusWindow(win));
  const btnClose = win.querySelector('.btn-close');
  const btnMin = win.querySelector('.btn-min');
  const btnMax = win.querySelector('.btn-max');
  if (btnClose) btnClose.addEventListener('click', e => {
    e.stopPropagation(); closeWindow(win);
  });
  if (btnMin) btnMin.addEventListener('click', e => {
    e.stopPropagation(); minimizeWindow(win);
  });
  if (btnMax) btnMax.addEventListener('click', e => {
    e.stopPropagation(); toggleMaximize(win);
  });

  const titlebar = win.querySelector('.window-titlebar');
  let ox, oy, dragging = false;
  titlebar.addEventListener('mousedown', e => {
    if (e.target.closest('.window-controls')) return;
    if (win.classList.contains('maximized')) return;
    dragging = true;
    ox = e.clientX - win.offsetLeft;
    oy = e.clientY - win.offsetTop;
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const x = Math.max(-win.offsetWidth + 80, Math.min(e.clientX - ox, window.innerWidth - 40));
    const y = Math.max(0, Math.min(e.clientY - oy, window.innerHeight - 34));
    win.style.left = x + 'px';
    win.style.top = y + 'px';
  });
  document.addEventListener('mouseup', () => { dragging = false; });
});

/* ============================================================
   Explorer
   ============================================================ */
const explorerWindow = document.getElementById('window-explorer');
const explorerList = document.getElementById('explorer-list');
const addrBar = document.getElementById('addr-bar');
let historyStack = [];
let explorerPath = [];

function renderExplorer() {
  const node = getNode(explorerPath);
  if (!node) return;
  addrBar.textContent = 'C:\\' + (explorerPath.length ? explorerPath.join('\\') : '');
  explorerList.innerHTML = '';

  const repo = repoForPath(explorerPath);
  if (repo) {
    const action = document.createElement('div');
    action.className = 'explorer-row explorer-action';
    action.innerHTML = `<span class="row-icon">🌐</span><span class="row-name">Open in Browser — ${repo.name}</span>`;
    action.addEventListener('dblclick', () => openRepo(repo));
    action.title = 'Open the live repository in the built-in browser';
    explorerList.appendChild(action);
    const sep = document.createElement('hr');
    sep.style.margin = '2px 0';
    sep.style.border = 'none';
    sep.style.borderTop = '1px solid #808080';
    explorerList.appendChild(sep);
  }

  const entries = [...node.children].sort((a, b) => {
    if (a.type === 'dir' && b.type !== 'dir') return -1;
    if (a.type !== 'dir' && b.type === 'dir') return 1;
    return a.name.localeCompare(b.name);
  });

  entries.forEach(entry => {
    const row = document.createElement('div');
    row.className = 'explorer-row';
    const fullPath = [...explorerPath, entry.name];
    row.innerHTML = `<span class="row-icon">${ICONS[entry.type]}</span><span class="row-name">${entry.name}</span>`;

    row.addEventListener('click', () => {
      explorerList.querySelectorAll('.explorer-row').forEach(r => r.classList.remove('selected'));
      row.classList.add('selected');
    });

    if (entry.type === 'dir') {
      row.addEventListener('dblclick', () => {
        historyStack.push([...explorerPath]);
        explorerPath = fullPath;
        renderExplorer();
      });
    } else {
      row.addEventListener('dblclick', () => openEntry(fullPath));
    }
    explorerList.appendChild(row);
  });

  if (!entries.length) {
    explorerList.innerHTML = '<div class="explorer-row" style="color:#808080">This folder is empty.</div>';
  }
}

function navigateInto(name) {
  const node = getNode(explorerPath);
  if (!node || node.type !== 'dir') return;
  const child = node.children.find(c => c.name === name);
  if (!child) return;
  if (child.type === 'dir') {
    historyStack.push([...explorerPath]);
    explorerPath = [...explorerPath, name];
    renderExplorer();
  } else {
    openEntry([...explorerPath, name]);
  }
}

function openEntry(pathArr) {
  const node = getNode(pathArr);
  if (!node) return;
  if (node.type === 'dir') { explorerPath = pathArr; renderExplorer(); showWindow(explorerWindow); }
  else if (node.type === 'file') openNotepad(node.name, node.content);
  else if (node.type === 'app') openApp(node.target);
}

document.getElementById('btn-back').addEventListener('click', () => {
  if (historyStack.length) {
    explorerPath = historyStack.pop();
    renderExplorer();
  }
});
document.getElementById('btn-up').addEventListener('click', () => {
  if (explorerPath.length) {
    historyStack.push([...explorerPath]);
    explorerPath = explorerPath.slice(0, -1);
    renderExplorer();
  }
});

/* ============================================================
   Notepad
   ============================================================ */
function openNotepad(name, content) {
  document.getElementById('notepad-title').textContent = name;
  document.getElementById('notepad-content').textContent = content;
  showWindow(document.getElementById('window-notepad'));
}

function openFolderRoot(name) {
  // open explorer at an existing top-level dir
  const child = FS_ROOT.children.find(c => c.name === name);
  if (child && child.type === 'dir') {
    explorerPath = [name];
    historyStack = [];
    renderExplorer();
    showWindow(explorerWindow);
  }
}

function openTopNode(name) {
  const child = FS_ROOT.children.find(c => c.name === name);
  if (child) openEntry([name]);
}

/* ============================================================
   Browser (repo mirror)
   ============================================================ */
const browserWindow = document.getElementById('window-browser');
const browserBody = document.getElementById('browser-body');
const browserAddress = document.getElementById('browser-address');
const browserHistory = [];
const browserStack = [];
let browserIndex = -1;

const ghHost = (repo) => `https://github.com/${repo.owner}/${repo.name}`;

function showBrowserPage(repo) {
  // push onto history for back/forward
  if (browserHistory[browserIndex] && browserHistory[browserIndex].name === repo.name) {
    // refresh of current
  } else {
    browserIndex++;
    browserHistory.length = browserIndex;
    browserHistory[browserIndex] = repo;
  }
  renderBrowser(repo);
}

async function renderBrowser(repo) {
  showWindow(browserWindow);
  browserAddress.value = ghHost(repo);
  browserBody.innerHTML = loadingPage();
  try {
    const info = await fetchJson(`https://api.github.com/repos/${repo.owner}/${repo.name}`);
    const readme = await fetchReadme(repo.owner, repo.name);
    browserBody.innerHTML = repoPage(info, readme);
  } catch (err) {
    browserBody.innerHTML = errorPage(err);
  }
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchReadme(owner, name) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${name}/readme`);
  if (!res.ok) return null;
  const json = await res.json();
  try { return decodeURIComponent(escape(atob(json.content))); }
  catch { return atob(json.content); }
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function loadingPage() {
  return `<div class="browser-note">Loading repository…<br>
    <span style="color:#808080">fetching data from api.github.com</span></div>`;
}

function errorPage(err) {
  return `<div class="browser-note browser-error">
    <b>Unable to load repository.</b><br>${esc(err.message || err)}
    <br><span style="color:#808080">Check your connection or the GitHub API rate limit.</span></div>`;
}

function infoRow(label, value) {
  return `<span class="infok"><b>${esc(label)}</b> ${esc(value)}</span>`;
}

function repoPage(info, readme) {
  const lang = info.language || '—';
  const lic = (info.license && info.license.spdx_id) || '—';
  const stars = fmtNum(info.stargazers_count), forks = fmtNum(info.forks_count);
  const topics = (info.topics || []).slice(0, 6);
  const topicHtml = topics.map(t => `<span class="topic">${esc(t)}</span>`).join(' ');

  const md = readme ? mdToHtml(readme) : '<p class="muted">No README found.</p>';

  return `<div class="browser-content">
    <header class="repo-header">
      <div class="repo-title">${esc(info.full_name)}</div>
      <div class="repo-desc">${esc(info.description || '')}</div>
      ${topicHtml}
      <div class="repo-meta">
        ${infoRow('⭐', stars)} ${infoRow('⑂', forks)} ${infoRow('●', lang)} ${infoRow('📜', lic)}
      </div>
      <a class="open-on-gh" href="${esc(ghHost(repoFromAddress()))}" target="_blank" rel="noopener">Open on GitHub ↗</a>
    </header>
    <hr>
    <div class="readme"><h3>README</h3>${md}</div>
  </div>`;
}

function repoFromAddress() {
  const v = browserAddress.value.replace(/^https?:\/\/(www\.)?github\.com\//i, '').split('/');
  if (v.length >= 2 && v[0] && v[1]) return { owner: v[0], name: v[1] };
  return browserHistory[browserIndex] || { owner: 'xentimed', name: 'musiorg' };
}

function fmtNum(n) { return n == null ? '0' : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

function openRepo(repo) {
  showBrowserPage(repo);
}

document.getElementById('browser-back').addEventListener('click', () => {
  if (browserIndex > 0) { browserIndex--; renderBrowser(browserHistory[browserIndex]); }
});
document.getElementById('browser-forward').addEventListener('click', () => {
  if (browserIndex < browserHistory.length - 1) { browserIndex++; renderBrowser(browserHistory[browserIndex]); }
});
document.getElementById('browser-refresh').addEventListener('click', () => {
  if (browserHistory[browserIndex]) renderBrowser(browserHistory[browserIndex]);
});
function goAddress() {
  const repo = repoFromAddress();
  if (repo && repo.owner && repo.name) showBrowserPage(repo);
}
document.getElementById('browser-go').addEventListener('click', goAddress);
browserAddress.addEventListener('keydown', e => { if (e.key === 'Enter') goAddress(); });

/* ---- tiny markdown → HTML renderer ---- */
function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let inCode = false, codeBuf = [];
  let list = null;
  const flushList = () => { if (list) { out.push(`<${list}>`); list = null; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith('```')) {
      if (inCode) { out.push(`<pre><code>${esc(codeBuf.join('\n'))}</code></pre>`); codeBuf = []; inCode = false; }
      else inCode = true;
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) { flushList(); const lvl = h[1].length; out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`); continue; }
    if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) { flushList(); out.push('<hr>'); continue; }
    if (/^\s*[-*]\s+/.test(line)) {
      if (list !== 'ul') { flushList(); list = 'ul'; out.push('<ul>'); }
      out.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ''))}</li>`); continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      if (list !== 'ol') { flushList(); list = 'ol'; out.push('<ol>'); }
      out.push(`<li>${inline(line.replace(/^\s*\d+[.)]\s+/, ''))}</li>`); continue;
    }
    flushList();
    if (line.trim() === '') { out.push('<p>'); continue; }
    out.push(`<p>${inline(line)}</p>`);
  }
  flushList();
  if (inCode) out.push(`<pre><code>${esc(codeBuf.join('\n'))}</code></pre>`);
  return out.join('');
}

function inline(s) {
  let t = esc(s);
  // inline code
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  // images
  t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, '');
  // links
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  // bold
  t = t.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  // italic
  t = t.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<i>$2</i>');
  return t;
}

/* ============================================================
   Desktop icons (rendered from FS root)
   ============================================================ */
const iconArea = document.getElementById('icon-area');

function renderDesktopIcons() {
  iconArea.innerHTML = '';
  FS_ROOT.children.forEach(node => {
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.dataset.name = node.name;
    icon.dataset.type = node.type;
    icon.innerHTML = `<div class="icon-img">${ICONS[node.type]}</div><div class="icon-label">${node.name}</div>`;
    icon.title = node.name;

    icon.addEventListener('click', () => {
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
      icon.classList.add('selected');
    });
    icon.addEventListener('contextmenu', e => e.preventDefault());
    icon.addEventListener('dblclick', () => openEntry([node.name]));
    iconArea.appendChild(icon);
  });
}
renderDesktopIcons();

// close selection when clicking empty desktop
document.getElementById('desktop').addEventListener('click', e => {
  if (window.__marqueeJustUsed) { window.__marqueeJustUsed = false; return; }
  if (e.target.id === 'desktop' || e.target.id === 'icon-area') {
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
  }
});

/* ============================================================
   Start menu (rendered from FS root)
   ============================================================ */
const startItems = document.getElementById('start-items');
FS_ROOT.children.forEach(node => {
  const item = document.createElement('div');
  item.className = 'start-item';
  item.dataset.name = node.name;
  item.innerHTML = `<span class="s-icon">${ICONS[node.type]}</span> ${titleOf(node.name)}`;
  item.addEventListener('click', () => {
    startMenu.classList.remove('open');
    startBtn.classList.remove('active');
    openEntry([node.name]);
  });
  startItems.appendChild(item);
});
const hr = document.createElement('hr');
const shutdown = document.createElement('div');
shutdown.className = 'start-item';
shutdown.id = 'start-shutdown';
shutdown.innerHTML = `<span class="s-icon">⏻</span> Shut Down…`;
shutdown.addEventListener('click', () => {
  startMenu.classList.remove('open');
  startBtn.classList.remove('active');
  windows.forEach(w => closeWindow(w));
});
startItems.appendChild(hr);
startItems.appendChild(shutdown);

startBtn.addEventListener('click', () => {
  startMenu.classList.toggle('open');
  startBtn.classList.toggle('active', startMenu.classList.contains('open'));
});
document.addEventListener('click', e => {
  if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) {
    startMenu.classList.remove('open');
    startBtn.classList.remove('active');
  }
});

/* ============================================================
   Terminal
   ============================================================ */
function openApp(name) {
  const win = document.getElementById('window-' + name);
  if (win) showWindow(win);
  if (name === 'terminal') maybeBanner();
}

const terminalInput = document.getElementById('terminal-input');
const terminalOutput = document.getElementById('terminal-output');

const PT_USER = '<span class="c-user">user</span>';
const PT_HOST = '<span class="c-host">@run</span>';
const PT_PATH = '<span class="c-path">:~</span>';
const PT_DOLLAR = '<span class="c-dollar">$</span>';
const PROMPT = `<span class="prompt">${PT_USER}${PT_HOST}${PT_PATH}${PT_DOLLAR}</span> `;

function push(html) {
  const d = document.createElement('div');
  d.className = 't-line';
  d.innerHTML = html;
  terminalOutput.appendChild(d);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}
function text(cls, s) {
  const d = document.createElement('div');
  d.className = 't-line' + (cls ? ' ' + cls : '');
  d.textContent = s;
  terminalOutput.appendChild(d);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function typeOf(node) {
  if (node.type === 'dir') return '<span class="t-dir">' + esc(node.name) + '</span>';
  if (node.type === 'app') return '<span class="t-warn">' + esc(node.name) + '</span>';
  return esc(node.name);
}

function lsNames() {
  return FS_ROOT.children.map(typeOf).join('  ');
}

function findFileContent(arg) {
  const parts = arg.split('/').filter(Boolean);
  const node = getNode(parts);
  return node && node.type === 'file' ? node.content : null;
}

const HELP = [
  '<span class="t-muted">Available commands:</span>',
  '<span class="t-dir">  help</span>            show this help',
  '<span class="t-dir">  whoami</span>          who you are',
  '<span class="t-dir">  ls</span>              list files in the current directory',
  '<span class="t-dir">  cat &lt;file&gt;</span>        open a .txt file (e.g. cat about_me.txt)',
  '<span class="t-dir">  open &lt;name&gt;</span>       open a file, folder, or app',
  '<span class="t-dir">  projects</span>          browse the projects folder',
  '<span class="t-dir">  experience</span>        browse the experience folder',
  '<span class="t-dir">  date</span>              print the current date and time',
  '<span class="t-dir">  fastfetch</span>         show the system info banner',
  '<span class="t-dir">  clear</span>             clear the screen'
].join('<br>');

/* fastfetch-style banner (mirrors ~/.config/fastfetch/config.jsonc) */
const FF_LOGO = [
  "          .",
  "         / \\",
  "        /   \\",
  "       /\\    \\",
  "      /       \\",
  "     /         \\",
  "    /    .-.    \\",
  "   /    |   |   _\\",
  "  /   _.'   '._   \\",
  " /_.-'         '-._\\"
].join('\n');

// Tokyo Night palette — colors 0..15 from the kitty.conf / fastfetch colors block
const FF_PALETTE = [
  '#15161e', '#f7768e', '#9ece6a', '#e0af68', '#7aa2f7', '#bb9af7', '#7dcfff', '#a9b1d6',
  '#414868', '#f7768e', '#9ece6a', '#e0af68', '#7aa2f7', '#bb9af7', '#7dcfff', '#c0caf5'
];
const FF_START = Date.now();

function fmtUptime() {
  const s = Math.floor((Date.now() - FF_START) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return (h ? h + 'h ' : '') + (h || m ? m + 'm ' : '') + sec + 's';
}
function fsEntries(node = FS_ROOT) {
  return node.children.reduce((n, c) => n + 1 + (c.type === 'dir' ? fsEntries(c) : 0), 0);
}

function maybeBanner() {
  if (!terminalOutput.childElementCount) banner();
}

function banner() {
  const wrap = document.createElement('div');
  wrap.className = 'ffetch';

  const logo = document.createElement('pre');
  logo.className = 'ff-logo';
  logo.textContent = FF_LOGO;
  wrap.appendChild(logo);

  const info = document.createElement('div');
  info.className = 'ff-info';
  const row = (k, v) => `<div class="ff-row"><span class="ff-key">${k}</span>${v}</div>`;
  const chips = (i) => FF_PALETTE.slice(i, i + 8)
    .map(c => `<span class="ff-chip" style="background:${c}"></span>`).join('');
  info.innerHTML =
    '<div class="ff-title">user@run</div>' +
    row('os', 'static web') +
    row('kernel', 'html &middot; css &middot; js') +
    row('packages', `${fsEntries()} files`) +
    row('shell', 'xsh') +
    row('terminal', 'kitty') +
    row('wm', 'win7 desktop') +
    row('uptime', fmtUptime()) +
    row('media', 'none') +
    `<div class="ff-colors"><div class="ff-crow">${chips(0)}</div><div class="ff-crow">${chips(8)}</div></div>`;
  wrap.appendChild(info);

  terminalOutput.appendChild(wrap);
  text('t-muted', "Type 'help' to see available commands.");
}

const COMMANDS = {
  help: () => { push(HELP); return null; },
  whoami: () => text(null, 'Youssef Tamyachte — cybersecurity student'),
  ls: () => { push(lsNames()); return null; },
  date: () => text(null, new Date().toString()),
  fastfetch: () => { banner(); return null; },
  neofetch: () => { banner(); return null; },
  projects: () => { openFolderRoot('projects'); text(null, 'Opening projects…'); return null; },
  experience: () => { openFolderRoot('experience'); text(null, 'Opening experience…'); return null; }
};

terminalInput.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const input = terminalInput.value.trim();
  push(`${PROMPT}${esc(input)}`);

  if (input === 'clear') {
    terminalOutput.innerHTML = '';
  } else if (input.startsWith('cat ')) {
    const arg = input.slice(4).trim();
    const content = findFileContent(arg);
    if (content) { openNotepad(arg.split('/').pop(), content); text('t-ok', `Opening ${arg}…`); }
    else text('t-err', `cat: ${arg}: No such file or directory`);
  } else if (input.startsWith('open ')) {
    const arg = input.slice(5).trim();
    const node = getNode([arg]);
    if (node) { openEntry([arg]); text('t-ok', `Opening ${arg}…`); }
    else text('t-err', `open: ${arg}: No such file or folder`);
  } else if (COMMANDS[input]) {
    COMMANDS[input]();
  } else if (input !== '') {
    text('t-err', `command not found: ${input} (try 'help')`);
  }

  terminalInput.value = '';
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
});

banner();

/* ============================================================
   Taskbar clock
   ============================================================ */
function updateClock() {
  document.getElementById('clock').textContent =
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

/* Gadgets are initialized above; windows stay closed until the user opens them. */

/* ============================================================
   Clock flyout (taskbar clock menu)
   ============================================================ */
const clockEl = document.getElementById('clock');
const clockPopup = document.getElementById('clock-popup');
const clockTimeEl = document.getElementById('clock-popup-time');
const clockDateEl = document.getElementById('clock-popup-date');

const popView = (() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; })();

function clockPopupVisible() {
  return clockPopup && !clockPopup.hasAttribute('hidden');
}

function toggleClockPopup(show) {
  if (!clockPopup) return;
  if (show === undefined) show = clockPopupVisible();
  if (show) {
    popView.y = new Date().getFullYear();
    popView.m = new Date().getMonth();
    clockPopup.removeAttribute('hidden');
    clockEl.classList.add('pressed');
  } else {
    clockPopup.setAttribute('hidden', '');
    clockEl.classList.remove('pressed');
  }
  renderClockPopup();
}

function renderClockPopup() {
  if (!clockPopupVisible()) return;
  const now = new Date();
  clockTimeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  clockDateEl.textContent = now.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const { y, m } = popView;
  const grid = document.getElementById('clock-cal-grid');
  const label = document.getElementById('clock-cal-label');
  const today = new Date();
  const first = new Date(y, m, 1);
  const startDow = first.getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();

  let html = ['S','M','T','W','T','F','S'].map(d => `<div class="cal-cell cal-dow">${d}</div>`).join('');
  for (let i = startDow - 1; i >= 0; i--) html += `<div class="cal-cell cal-other">${prevDays - i}</div>`;
  for (let d = 1; d <= days; d++) {
    const is = d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
    html += `<div class="cal-cell${is ? ' cal-today' : ''}">${d}</div>`;
  }
  let cells = startDow + days;
  for (let i = cells, nx = 1; i % 7 !== 0; i++, nx++) html += `<div class="cal-cell cal-other">${nx}</div>`;
  label.textContent = `${first.toLocaleString('en', { month: 'long' })} ${y}`;
  grid.innerHTML = html;
}

clockEl.addEventListener('click', e => {
  e.stopPropagation();
  toggleClockPopup(!clockPopupVisible());
});
document.getElementById('clock-cal-prev').addEventListener('click', e => {
  e.stopPropagation();
  popView.m--; if (popView.m < 0) { popView.m = 11; popView.y--; } renderClockPopup();
});
document.getElementById('clock-cal-next').addEventListener('click', e => {
  e.stopPropagation();
  popView.m++; if (popView.m > 11) { popView.m = 0; popView.y++; } renderClockPopup();
});
document.addEventListener('click', e => {
  if (clockPopupVisible() && !e.target.closest('#clock-popup') && !e.target.closest('#clock')) {
    toggleClockPopup(false);
  }
});

// keep the big clock ticking while open
setInterval(() => { if (clockPopupVisible()) renderClockPopup(); }, 1000);

/* ============================================================
   Gadgets (Win7 widgets)
   ============================================================ */

// clock ticks
(function buildTicks() {
  const g = document.getElementById('a-ticks');
  if (!g) return;
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0;
    const a = (i * 6 - 90) * Math.PI / 180;
    const r1 = major ? 41 : 44;
    const r2 = 47;
    const x1 = 50 + r1 * Math.cos(a), y1 = 50 + r1 * Math.sin(a);
    const x2 = 50 + r2 * Math.cos(a), y2 = 50 + r2 * Math.sin(a);
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', x1); l.setAttribute('y1', y1);
    l.setAttribute('x2', x2); l.setAttribute('y2', y2);
    l.setAttribute('class', major ? 'a-tick-major' : 'a-tick');
    g.appendChild(l);
  }
})();

function tickAnalogClock() {
  const now = new Date();
  const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds();
  const hDeg = (h + m / 60) * 30;
  const mDeg = (m + s / 60) * 6;
  const sDeg = s * 6;
  const hr = document.getElementById('a-hour');
  const mn = document.getElementById('a-minute');
  const sc = document.getElementById('a-second');
  if (hr) hr.setAttribute('transform', `rotate(${hDeg} 50 50)`);
  if (mn) mn.setAttribute('transform', `rotate(${mDeg} 50 50)`);
  if (sc) sc.setAttribute('transform', `rotate(${sDeg} 50 50)`);
  const dig = document.getElementById('analog-digital');
  if (dig) dig.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(tickAnalogClock, 1000);
tickAnalogClock();

// notes (persisted)
const notesArea = document.getElementById('notes-area');
const NOTES_KEY = 'xen_notes';
notesArea.value = localStorage.getItem(NOTES_KEY) || '';
notesArea.addEventListener('input', () => {
  localStorage.setItem(NOTES_KEY, notesArea.value);
});

// close gadgets
document.querySelectorAll('.gadget-close').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.gadget').remove();
  });
});

/* ============================================================
   Sliding puzzle gadget (3x3)
   ============================================================ */
(function initPuzzle() {
  const grid = document.getElementById('puzzle-grid');
  const movesEl = document.getElementById('puzzle-moves');
  const stateEl = document.getElementById('puzzle-state');
  if (!grid) return;

  let tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0]; // 0 = blank
  let blank = 8;
  let moves = 0;

  function solved() {
    return tiles.every((t, i) => t === (i === 8 ? 0 : i + 1));
  }

  function shuffle() {
    for (let i = 0; i < 200; i++) {
      const n = neighbours(blank);
      const pick = n[Math.floor(Math.random() * n.length)];
      [tiles[blank], tiles[pick]] = [tiles[pick], tiles[blank]];
      blank = pick;
    }
    moves = 0;
    render();
  }

  function neighbours(idx) {
    const r = Math.floor(idx / 3), c = idx % 3;
    const out = [];
    if (r > 0) out.push(idx - 3);
    if (r < 2) out.push(idx + 3);
    if (c > 0) out.push(idx - 1);
    if (c < 2) out.push(idx + 1);
    return out;
  }

  function click(idx) {
    if (!neighbours(blank).includes(idx)) return;
    [tiles[blank], tiles[idx]] = [tiles[idx], tiles[blank]];
    blank = idx;
    moves++;
    render();
  }

  function render() {
    grid.innerHTML = '';
    tiles.forEach((v, i) => {
      const d = document.createElement('div');
      if (v === 0) {
        d.className = 'p-tile p-blank';
        d.textContent = '';
      } else {
        d.className = 'p-tile';
        d.textContent = v;
        d.addEventListener('click', () => click(i));
      }
      grid.appendChild(d);
    });
    movesEl.textContent = `moves: ${moves}`;
    stateEl.textContent = solved() ? '✓ Solved!' : '';
  }

  document.getElementById('puzzle-shuffle').addEventListener('click', shuffle);

  // random starting position so it isn't solved on load
  shuffle();
})();

/* ============================================================
   Shell polish: titlebar icons, system menus, wallpaper
   ============================================================ */
(function shellPolish() {
  const desktop = document.getElementById('desktop');
  const iconArea = document.getElementById('icon-area');
  const displayWin = document.getElementById('window-display');
  const ctxMenu = document.getElementById('ctx-menu');
  const winGlyphs = { explorer: '📁', notepad: '📄', browser: '🌐', console: '🖥️', display: '🎨' };

  /* ---------- context menu engine ---------- */
  function closeCtx() {
    ctxMenu.hidden = true;
    ctxMenu.innerHTML = '';
  }
  function openCtx(x, y, items) {
    ctxMenu.innerHTML = '';
    items.forEach(it => {
      if (it.sep) {
        const d = document.createElement('div');
        d.className = 'ctx-sep';
        ctxMenu.appendChild(d);
      } else {
        const b = document.createElement('button');
        b.className = 'ctx-item' + (it.head ? ' ctx-head' : '') + (it.disabled ? ' ctx-disabled' : '');
        b.textContent = it.label;
        b.disabled = !!it.disabled;
        if (!it.disabled) {
          b.addEventListener('click', () => { closeCtx(); it.action && it.action(); });
        }
        ctxMenu.appendChild(b);
      }
    });
    ctxMenu.hidden = false;
    // keep on-screen
    const r = ctxMenu.getBoundingClientRect();
    ctxMenu.style.left = Math.max(2, Math.min(x, window.innerWidth - r.width - 4)) + 'px';
    ctxMenu.style.top  = Math.max(2, Math.min(y, window.innerHeight - r.height - 4)) + 'px';
  }
  document.addEventListener('mousedown', e => {
    if (!ctxMenu.hidden && !ctxMenu.contains(e.target)) closeCtx();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCtx(); });
  window.addEventListener('blur', closeCtx);
  document.addEventListener('scroll', closeCtx, true);

  /* ---------- titlebar icons + system menus ---------- */
  function systemMenuFor(win, x, y) {
    const maxed = win.classList.contains('maximized');
    openCtx(x, y, [
      { head: true, label: win.dataset.title || win.id },
      { sep: true },
      { label: maxed ? 'Restore' : 'Maximize', action: () => toggleMaximize(win) },
      { label: 'Minimize', action: () => minimizeWindow(win) },
      { sep: true },
      { label: 'Close', action: () => closeWindow(win) }
    ]);
  }

  windows.forEach(win => {
    const tb = win.querySelector('.window-titlebar');
    if (!tb) return;
    // icon button on the left of the title
    const key = win.id.replace('window-', '');
    const ico = document.createElement('span');
    ico.className = 'win-ico';
    ico.textContent = winGlyphs[key] || '🗀';
    ico.title = 'System menu';
    tb.insertBefore(ico, tb.firstChild);
    ico.addEventListener('mousedown', e => e.stopPropagation()); // don't start a titlebar drag
    ico.addEventListener('click', e => {
      e.stopPropagation();
      const r = ico.getBoundingClientRect();
      systemMenuFor(win, r.left, r.bottom + 2);
    });
    ico.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
      systemMenuFor(win, e.clientX, e.clientY);
    });
    // right-click titlebar -> system menu
    tb.addEventListener('contextmenu', e => {
      if (e.target.closest('.window-controls') || e.target.closest('.win-ico')) return;
      e.preventDefault();
      systemMenuFor(win, e.clientX, e.clientY);
    });
    // double-click titlebar -> maximize/restore (like real Windows)
    tb.addEventListener('dblclick', e => {
      if (e.target.closest('.window-controls') || e.target.closest('.win-ico')) return;
      toggleMaximize(win);
    });
  });

  /* ---------- desktop + icon right-click menus ---------- */
  document.getElementById('desktop').addEventListener('contextmenu', e => {
    const icon = e.target.closest('.desktop-icon');
    if (icon) {
      e.preventDefault();
      // select the icon under the cursor
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
      icon.classList.add('selected');
      const name = icon.dataset.name;
      openCtx(e.clientX, e.clientY, [
        { head: true, label: name },
        { sep: true },
        { label: 'Open', action: () => openEntry([name]) },
        { label: 'Cut', disabled: true },
        { label: 'Copy', disabled: true },
        { label: 'Delete', disabled: true }
      ]);
      return;
    }
    if (e.target.id === 'desktop' || e.target.id === 'icon-area') {
      e.preventDefault();
      openCtx(e.clientX, e.clientY, [
        { label: 'Arrange Icons', action: arrangeIcons },
        { label: 'Refresh', action: () => { renderDesktopIcons(); } },
        { sep: true },
        { label: 'Display Properties…', action: () => showWindow(displayWin) },
        { sep: true },
        { label: 'New folder', disabled: true },
        { label: 'Paste', disabled: true }
      ]);
    }
  });

  function arrangeIcons() {
    const icons = [...iconArea.children];
    icons.sort((a, b) => {
      const ad = (a.dataset.type === 'dir' ? 0 : 1);
      const bd = (b.dataset.type === 'dir' ? 0 : 1);
      return ad - bd || a.dataset.name.localeCompare(b.dataset.name);
    });
    icons.forEach(i => i.remove());
    icons.forEach(i => iconArea.appendChild(i));
  }

  /* ---------- wallpaper presets + Display Properties ---------- */
  const WALLPAPERS = [
    { id: 'teal',  name: 'Classic Teal', css: '#008080' },
    { id: 'sea',   name: 'Deep Sea',     css: 'radial-gradient(1200px 800px at 70% 20%, #0a9a9a 0%, #005a5a 60%, #003f3f 100%)' },
    { id: 'dusk',  name: 'Dusk',         css: 'linear-gradient(160deg, #1b2a6b 0%, #2b1b6b 55%, #0d0a1f 100%)' },
    { id: 'midnight', name: 'Midnight',  css: 'radial-gradient(900px 600px at 30% 30%, #1c2340 0%, #0b0e1c 75%)' },
    { id: 'tokyo', name: 'Tokyo Night',  css: 'linear-gradient(180deg, #1a1b26 0%, #10111a 60%, #0a0b12 100%)' },
    { id: 'grid',  name: 'Teal Grid',    css: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 28px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 28px), #007070' },
    { id: 'dots',  name: 'Polka',        css: 'radial-gradient(rgba(255,255,255,0.10) 1.5px, transparent 2.5px) 0 0 / 22px 22px, #006666' },
    { id: 'graphite', name: 'Graphite',  css: 'linear-gradient(180deg, #3a3f4b 0%, #23262e 100%)' }
  ];
  const WALL_KEY = 'runy_wallpaper';
  let wallId = localStorage.getItem(WALL_KEY) || 'teal';
  function applyWall() {
    const w = WALLPAPERS.find(x => x.id === wallId) || WALLPAPERS[0];
    desktop.style.background = w.css;
  }
  function buildWallGrid() {
    const grid = document.getElementById('wall-grid');
    if (!grid) return;
    grid.innerHTML = '';
    WALLPAPERS.forEach(w => {
      const s = document.createElement('div');
      s.className = 'wall-swatch' + (w.id === wallId ? ' selected' : '');
      s.innerHTML = `<div class="wall-preview" style="background:${w.css}"></div><span class="wall-name">${w.name}</span>`;
      s.addEventListener('click', () => {
        wallId = w.id;
        grid.querySelectorAll('.wall-swatch').forEach(x => x.classList.remove('selected'));
        s.classList.add('selected');
        applyWall();
      });
      grid.appendChild(s);
    });
  }
  applyWall();
  buildWallGrid();
  const propsOk = document.getElementById('props-ok');
  const propsCancel = document.getElementById('props-cancel');
  if (propsOk) propsOk.addEventListener('click', () => {
    localStorage.setItem(WALL_KEY, wallId);
    closeWindow(displayWin);
  });
  if (propsCancel) propsCancel.addEventListener('click', () => {
    wallId = localStorage.getItem(WALL_KEY) || 'teal';
    applyWall();
    buildWallGrid();
    closeWindow(displayWin);
  });
  // closing the window with X = cancel (revert to saved wallpaper)
  const displayClose = displayWin.querySelector('.btn-close');
  if (displayClose) displayClose.addEventListener('click', () => {
    wallId = localStorage.getItem(WALL_KEY) || 'teal';
    applyWall();
    buildWallGrid();
  });

  /* ---------- marquee selection on the desktop ---------- */
  let mq = null;
  const mqEl = document.createElement('div');
  mqEl.id = 'marquee';
  desktop.appendChild(mqEl);

  function startMarquee(e) {
    if (e.button !== 0) return;
    if (!(e.target.id === 'desktop' || e.target.id === 'icon-area')) return;
    // only when clicking empty desktop space
    mq = { x: e.clientX, y: e.clientY, active: false };
    document.body.style.userSelect = 'none';
  }
  function moveMarquee(e) {
    if (!mq) return;
    const dx = e.clientX - mq.x, dy = e.clientY - mq.y;
    if (!mq.active && Math.hypot(dx, dy) > 5) mq.active = true;
    if (mq.active) {
      const dr = desktop.getBoundingClientRect();
      const x = Math.min(mq.x, e.clientX) - dr.left;
      const y = Math.min(mq.y, e.clientY) - dr.top;
      const w = Math.abs(dx), h = Math.abs(dy);
      mqEl.style.cssText = `display:block;left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
    }
  }
  function endMarquee(e) {
    if (!mq) return;
    document.body.style.userSelect = '';
    if (mq.active) {
      const dr = desktop.getBoundingClientRect();
      const x = Math.min(mq.x, e.clientX) - dr.left;
      const y = Math.min(mq.y, e.clientY) - dr.top;
      const w = Math.abs(e.clientX - mq.x), h = Math.abs(e.clientY - mq.y);
      document.querySelectorAll('.desktop-icon').forEach(ic => {
        const r = ic.getBoundingClientRect();
        const icl = r.left - dr.left, ict = r.top - dr.top;
        const hit = !(icl + r.width < x || icl > x + w || ict + r.height < y || ict > y + h);
        ic.classList.toggle('selected', hit);
      });
      window.__marqueeJustUsed = true;
      setTimeout(() => { window.__marqueeJustUsed = false; }, 0);
    }
    mqEl.style.display = 'none';
    mq = null;
  }
  desktop.addEventListener('mousedown', startMarquee);
  window.addEventListener('mousemove', moveMarquee);
  window.addEventListener('mouseup', endMarquee);
})();
