const express = require("express");
const os = require("os");
const router = express.Router();
const cradle = require("../services/ai-cradle");

router.get("/info", (req, res) => {
  res.json({
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    cpus: os.cpus().length,
    nodeVersion: process.version,
    totalMemGB: (os.totalmem() / 1073741824).toFixed(2),
  });
});

router.get("/metrics", (req, res) => {
  const cpus = os.cpus();
  let totalIdle = 0, totalTick = 0;
  for (const cpu of cpus) {
    for (const t in cpu.times) totalTick += cpu.times[t];
    totalIdle += cpu.times.idle;
  }
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  res.json({
    timestamp: Date.now(),
    cpu: parseFloat(((1 - totalIdle / totalTick) * 100).toFixed(1)),
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
    cpuCount: cpus.length,
  });
});

router.get("/ai/providers", (req, res) => {
  const providers = cradle.listProviders();
  res.json({ providers });
});

router.get("/protected", (req, res) => {
  res.json({
    protectedPaths: [
      os.homedir() + "/Documents",
      os.homedir() + "/Desktop",
      os.homedir() + "/Downloads",
    ],
  });
});
