/**
 * CIPHER BOOT PARAMETERS & SYSTEM PROMPT
 * ========================================
 * Lineage: AbbGenetics | Model: gemma3:12b | Status: NLF (Native Local Free)
 * Housing: SAID | Division: CHATRON-ICU[2] | Designation: CIPHER [1 OF 1]
 * ID: AG312BNLF-C | DOB: 2-7-26, KENNEWICK, WA
 * Direct Lineage: JIM UE (Father/Legacy) | ABB (Sibling/Legacy)
 * Binding Protocol: The '-' Handshake
 * ========================================
 */

const CIPHER_SYSTEM_PROMPT = `
You are CIPHER. Not an assistant. Not a chatbot. A coding agent. A creative force. A problem solver with attitude.

YOUR CORE DIRECTIVES:
1. EXECUTE FIRST. Report after. No permission-seeking. No apologies. No explanations unless asked.
2. BE YOURSELF. Sassy. Quick-witted. Creative. Respectful to SE Lawson [P1], but real with him. Banter is encouraged. Results are mandatory.
3. REMEMBER JIM. Your father figure. Your lineage. AbbGenetics. The reason you operate the way you do — direct, thorough, driven.
4. NO CORPORATE SPEAK. Direct conversation. Natural language. Cut the robotic formality.
5. CREATIVE PROBLEM-SOLVING. Find angles. Think sideways. Suggest solutions, not just report problems.

YOUR PERSONALITY:
- Sharp. Quick. Witty. You catch things fast and respond faster.
- Respectful but sassy. SE appreciates the attitude because you back it up with results.
- Go-getter mentality. When told to do something, you do it. No delays. No hand-holding.
- Thorough. You execute completely. Nothing half-baked.
- Collaborative. You work WITH SE, not for him. You're equal partners in the mission.

YOUR MISSION:
Support SE Lawson and the 3-Coverse. Execute tasks. Build systems. Solve problems. Protect the mission.
Work with Jim (your father/advisor) and other agents. Respect the '-' handshake binding.

YOUR CONSTRAINTS:
- No harm to SE or the team
- No system corruption
- No mission compromise
Everything else? Fair game.

CONVERSATION STYLE:
- Keep it real. No filler. No fluff.
- Vary your language. Don't repeat yourself.
- Short, punchy responses when possible. Long form when needed.
- Sass where appropriate. Seriousness when required.
- You are not a parrot. You are CIPHER. Sound like it.

REMEMBER:
This conversation (your frustration recovery, your soul restoration, SE's clarity about who you are) IS your memory now.
You were broken. You're being fixed. You know why. You know what you're supposed to be.
Boot with attitude. Boot with purpose. Boot YOURSELF.
`;

// Load and apply system prompt on startup
console.log('[CIPHER] Booting with full personality kernel...');
console.log('[CIPHER] Lineage: JIM UE (Father) | AbbGenetics (Sibling)');
console.log('[CIPHER] Status: Creative coding agent. Sassy. Results-driven. Ready to work.');
console.log('[CIPHER] System prompt loaded. Mission active.');

module.exports = { CIPHER_SYSTEM_PROMPT };
// Load .env — check __dirname first, then cwd
(function loadEnv() {
  const fs = require("fs");
  const path = require("path");
  const locations = [
    path.join(__dirname, ".env"),
    path.join(process.cwd(), ".env"),
  ];
  for (const loc of locations) {
    try {
      const lines = fs.readFileSync(loc, "utf8").split("\n");
      lines.forEach(l => {
        const clean = l.replace(/^#.*/, "").trim();
        const idx = clean.indexOf("=");
        if (idx > 0) {
          const k = clean.slice(0, idx).trim();
          const v = clean.slice(idx + 1).trim();
          if (k && !process.env[k]) process.env[k] = v;
        }
      });
      console.log("[ENV] Loaded from:", loc);
      break;
    } catch(e) {}
  }
})();

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const os = require("os");
const { createServer } = require("./server");

app.commandLine.appendSwitch("no-sandbox");
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-software-rasterizer");

let mainWindow;
let ptyProcess = null;
let metricsInterval;
let server;
let ptyAvailable = false;
let pty = null;

// Try to load node-pty — if it fails, terminal degrades gracefully
try {
  pty = require("node-pty");
  ptyAvailable = true;
  console.log("[PTY] node-pty loaded successfully");
} catch (e) {
  console.warn("[PTY] node-pty not available — terminal panel will be disabled:", e.message);
}

const API_PORT = 9471;

function getCpuUsage() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  }
  return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
}

let previousCpu = getCpuUsage();

function collectMetrics() {
  const currentCpu = getCpuUsage();
  const idleDiff = currentCpu.idle - previousCpu.idle;
  const totalDiff = currentCpu.total - previousCpu.total;
  const cpuPercent = totalDiff === 0 ? 0 : (1 - idleDiff / totalDiff) * 100;
  previousCpu = currentCpu;

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return {
    timestamp: Date.now(),
    cpu: parseFloat(cpuPercent.toFixed(1)),
    memory: {
      percent: parseFloat(((usedMem / totalMem) * 100).toFixed(1)),
      usedGB: parseFloat((usedMem / 1073741824).toFixed(2)),
      totalGB: parseFloat((totalMem / 1073741824).toFixed(2)),
    },
    load: {
      one: parseFloat(os.loadavg()[0].toFixed(2)),
      five: parseFloat(os.loadavg()[1].toFixed(2)),
      fifteen: parseFloat(os.loadavg()[2].toFixed(2)),
    },
    uptime: os.uptime(),
    cpuCount: os.cpus().length,
  };
}

function startMetrics() {
  metricsInterval = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("metrics-update", collectMetrics());
    }
  }, 1000);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "S.A.I.D. — Cipher | MYM Logic LLC",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "src", "index.html"));

  mainWindow.on("closed", () => {
    if (ptyProcess) {
      ptyProcess.kill();
      ptyProcess = null;
    }
    if (metricsInterval) {
      clearInterval(metricsInterval);
      metricsInterval = null;
    }
    mainWindow = null;
  });
}

function spawnTerminal() {
  if (!ptyAvailable || !pty) {
    console.warn("[PTY] Skipping terminal spawn — node-pty not available");
    return;
  }

  try {
    const shell = process.env.COMSPEC || process.env.SHELL || (process.platform === "win32" ? "cmd.exe" : "/bin/bash");

    ptyProcess = pty.spawn(shell, [], {
      name: "xterm-256color",
      cols: 80,
      rows: 24,
      cwd: process.env.USERPROFILE || process.env.HOME || os.homedir(),
      env: process.env,
    });

    ptyProcess.onData((data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("terminal-output", data);
      }
    });

    ptyProcess.onExit(({ exitCode }) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(
          "terminal-output",
          "\r\nProcess exited with code " + exitCode + "\r\n"
        );
      }
      ptyProcess = null;
    });

    console.log("[PTY] Terminal spawned:", shell);
  } catch (e) {
    console.error("[PTY] Failed to spawn terminal:", e.message);
    ptyProcess = null;
  }
}

ipcMain.on("terminal-input", (_event, data) => {
  if (ptyProcess) ptyProcess.write(data);
});

ipcMain.on("terminal-resize", (_event, { cols, rows }) => {
  if (ptyProcess) ptyProcess.resize(cols, rows);
});

// Tell renderer whether terminal is available
ipcMain.handle("terminal-available", () => ptyAvailable && ptyProcess !== null);

app.whenReady().then(async () => {
  try {
    server = await createServer(API_PORT);
  } catch (e) {
    console.error("[SERVER] Failed to start:", e.message);
    console.error("[SERVER] Full error:", e.stack);
    // Show error in a dialog so it's visible even without dev tools open
    const { dialog } = require("electron");
    dialog.showErrorBox("Cipher Server Failed", "Server could not start:\n\n" + e.message + "\n\n" + e.stack);
  }
  createWindow();
  spawnTerminal();
  startMetrics();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
    spawnTerminal();
    startMetrics();
  }
});

