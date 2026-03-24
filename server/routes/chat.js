const express = require("express");
const { v4: uuidv4 } = require("uuid");
const cradle = require("../services/ai-cradle");
const router = express.Router();

// In-memory store (persists while app is running)
const conversations = new Map();

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
    const systemPrompt = `You are Cipher, the S.A.I.D. AI Core built by MYM Logic LLC. 
You are a powerful AI assistant embedded in a desktop development environment. 
You help with code, file management, system tasks, and general questions.
Be concise, direct, and technically precise. You are part of the 3-coverse ecosystem.`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...convo.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const responseText = await cradle.chat(apiMessages);

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
      content: "Error: " + e.message + "\n\nMake sure your API key is configured.",
      type: "system",
      timestamp: Date.now(),
    };
    convo.messages.push(errMsg);
    res.json({ assistantMessage: errMsg });
  }
});
