// Open windows when icons are clicked
document.querySelectorAll('.icon').forEach(icon => {
  icon.addEventListener('dblclick', () => openWindow(icon.dataset.window));
  icon.addEventListener('click', () => openWindow(icon.dataset.window));
});

function openWindow(name) {
  const win = document.getElementById('window-' + name);
  if (win) {
    win.style.display = 'block';
    win.style.zIndex = getTopZ() + 1;
  }
}

document.querySelectorAll('.window-close').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.target.closest('.window').style.display = 'none';
  });
});

function getTopZ() {
  let max = 10;
  document.querySelectorAll('.window').forEach(w => {
    max = Math.max(max, parseInt(w.style.zIndex) || 10);
  });
  return max;
}

// Bring window to front on click
document.querySelectorAll('.window').forEach(win => {
  win.addEventListener('mousedown', () => {
    win.style.zIndex = getTopZ() + 1;
  });
});

// Drag windows by titlebar
document.querySelectorAll('.window').forEach(win => {
  const titlebar = win.querySelector('.window-titlebar');
  let offsetX, offsetY, dragging = false;

  titlebar.addEventListener('mousedown', (e) => {
    dragging = true;
    offsetX = e.clientX - win.offsetLeft;
    offsetY = e.clientY - win.offsetTop;
  });

  document.addEventListener('mousemove', (e) => {
    if (dragging) {
      win.style.left = (e.clientX - offsetX) + 'px';
      win.style.top = (e.clientY - offsetY) + 'px';
    }
  });

  document.addEventListener('mouseup', () => {
    dragging = false;
  });
});

// Taskbar clock
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent =
    now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// Terminal logic
const terminalInput = document.getElementById('terminal-input');
const terminalOutput = document.getElementById('terminal-output');

const commands = {
  help: "Available commands: help, whoami, ls, about, projects, academic, experience, clear",
  whoami: "xen — cybersecurity student & content creator",
  ls: "about_me  projects  academic_journey  experience",
  about: "Opening about_me...",
  projects: "Opening projects...",
  academic: "Opening academic_journey...",
  experience: "Opening experience..."
};

terminalInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const input = terminalInput.value.trim();
    terminalOutput.textContent += `\nxen@runyoussef:~$ ${input}`;

    if (input === 'clear') {
      terminalOutput.textContent = '';
    } else if (commands[input]) {
      terminalOutput.textContent += `\n${commands[input]}`;
      if (['about', 'projects', 'academic', 'experience'].includes(input)) {
        openWindow(input);
      }
    } else if (input !== '') {
      terminalOutput.textContent += `\ncommand not found: ${input}`;
    }

    terminalInput.value = '';
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }
});

// Start button placeholder
document.getElementById('start-btn').addEventListener('click', () => {
  alert('Start menu coming soon.');
});
