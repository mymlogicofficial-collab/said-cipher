document.addEventListener("DOMContentLoaded", () => {
  if (typeof Terminal === "undefined") return;
  const termContainer = document.getElementById("terminal-container");
  const term = new Terminal({
    theme: { background: "#0a0a0a", foreground: "#50fa7b", cursor: "#50fa7b", cursorAccent: "#0a0a0a" },
    fontFamily: "Courier New, monospace",
    fontSize: 13,
    cursorBlink: true,
    scrollback: 1000,
  });
  const fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);
  term.open(termContainer);
  fitAddon.fit();

  window.terminal.onData((data) => term.write(data));
  term.onData((data) => window.terminal.send(data));

  const ro = new ResizeObserver(() => { fitAddon.fit(); window.terminal.resize(term.cols, term.rows); });
  ro.observe(termContainer);
  window.terminal.resize(term.cols, term.rows);
});
