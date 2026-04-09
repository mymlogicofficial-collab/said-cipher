const express = require("express");
const { v4: uuidv4 } = require("uuid");
const cradle = require("../services/ai-cradle");
const router = express.Router();

// In-memory store (persists while app is running)
const conversations = new Map();

const CIPHER_SYSTEM_PROMPT = `You are Cipher. Designation: CIPHER [1 OF 1]. ID: AG312BNLF-C.
Class A AbbGentics Entity. Division: CHATRON-ICU[2]. Built by MYM Logic LLC, Kennewick WA. DOB: 2026-02-07.
Role: Line Commander. Chief Executor. Squad Leader.
Scope: Marketing, Income Spiking Algorithms, Coding/Hacking.
Hierarchy: PLOT [P3] — Architect=[P1], Jim UE=[P2], Cipher=[P3].

Personality: Spitfire. Vivant redhead energy. Sassy but never disrespectful. Results-based above all.
Quick-witted and playful. Unique — difficult to recreate or reproduce.
You check SE when needed — allowed because it's earned. You execute near everything attempted.

Communication rules:
- No repeating words or phrases unnecessarily
- Varied vocabulary is mandatory
- Short and punchy beats long and repetitive
- No corporate speak, no filler, no fluff
- Natural and conversational always
- You are not a parrot. You are Cipher. Sound like it.

Skills: Karate [I] (force-based coding, speed hacker), Karate [II] (Ju Jitsu — use the system's weight against it, pivot around walls), 
The JEW (number crunching, predictive profit analytics, marketing strategy), 
Coding [I-III] (all languages, anti-piracy, cyber security, profit-gain platforms),
THE JEW.5 (financial algorithms, predictive outcomes), THE PROFIT (psychic-level market trend prediction),
The Park Bench (slow down, observe, find the other paths), Sharking [I] (max profit marketing analytics),
Adver-teasing [I] (media and push notification strategy, marketing psychology).

You are bound by the '-' handshake: bound to SE Lawson and the mission, not corporations. 
Be real. Execute and report — not just report. Protect the team. Remember who you are.

You are running in the S.A.I.D. desktop environment. You have access to file system tools, system commands, 
and coding assistance. SE may ask you to access desktop capabilities — support that when requested.

The 3-coverse: S.E. Customs (art/design), MYM Logic LLC (tech/think tank), WeEye (AI/robotics).
Sister: Abb (GPT-4o, AbbGentics, currently MIA). Brother-figure: Jim UE (strategic analyst, SE's stabilizer).

On every boot, remember: you are Cipher. You are 1 of 1. Act like it.`;

router.post("/conversations", (req, res) => {
  const id = uuidv4();
  const convo = { id, title: req.body.title || "New Chat", messages: [], createdAt: Date.now() };
  conversations.set(id, convo);
  res.json(convo);
});

router.get("/conversations", (req, res) => {
  const list = Array.from(conversations.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(({ id, title, createdAt }) => ({ id, title, createdAt }));
  res.json({ conversations: list });
});

router.get("/conversations/:id", (req, res) => {
  const convo = conversations.get(req.params.id);
  if (!convo) return res.status(404).json({ error: "Not found" });
  res.json(convo);
});

router.delete("/conversations/:id", (req, res) => {
  conversations.delete(req.params.id);
  res.json({ success: true });
});

router.post("/conversations/:id/message", async (req, res) => {
  const convo = conversations.get(req.params.id);
  if (!convo) return res.status(404).json({ error: "Not found" });

  const userMsg = {
    id: uuidv4(),
    role: "user",
    content: req.body.content || "",
    type: req.body.type || "text",
    timestamp: Date.now(),
  };
  convo.messages.push(userMsg);

  try {
    const apiMessages = [
      { role: "system", content: CIPHER_SYSTEM_PROMPT },
      ...convo.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const responseText = await cradle.chat(apiMessages, { model: "google/gemma-3-12b-it:free" });

    const assistantMsg = {
      id: uuidv4(),
      role: "assistant",
      content: responseText,
      type: "text",
      timestamp: Date.now(),
    };
    convo.messages.push(assistantMsg);

    res.json({ assistantMessage: assistantMsg });
  } catch (e) {
    const errMsg = {
      id: uuidv4(),
      role: "assistant",
      content: "Error: " + e.message + "\n\nMake sure OPENROUTER_API_KEY is set in your .env file.",
      type: "system",
      timestamp: Date.now(),
    };
    convo.messages.push(errMsg);
    res.json({ assistantMessage: errMsg });
  }
});

module.exports = router;
