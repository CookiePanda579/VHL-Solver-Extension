// popup.js – VHL Solver (Claude + OpenRouter)

const apiKeyInput = document.getElementById("apiKey");
const toggleEye   = document.getElementById("toggleEye");
const saveKeyBtn  = document.getElementById("saveKey");
const orKeyInput  = document.getElementById("orKey");
const toggleOrEye = document.getElementById("toggleOrEye");
const saveORBtn   = document.getElementById("saveOR");
const statusDot   = document.getElementById("statusDot");
const statusText  = document.getElementById("statusText");
const solveBtn    = document.getElementById("solveBtn");
const progressWrap= document.getElementById("progressWrap");
const progressFill= document.getElementById("progressFill");
const logBox      = document.getElementById("logBox");
const footerBadge = document.getElementById("footerBadge");
const btnClaude   = document.getElementById("btnClaude");
const btnOR       = document.getElementById("btnOR");
const panelClaude = document.getElementById("panelClaude");
const panelOR     = document.getElementById("panelOR");
const orLink      = document.getElementById("orLink");
const modelChips  = document.querySelectorAll(".model-chip");

let activeTab     = null;
let provider      = "claude";
let selectedModel = "meta-llama/llama-3.3-70b-instruct:free";

/* ─── INIT ─── */
document.addEventListener("DOMContentLoaded", async () => {
  const s = await chrome.storage.local.get(["vhlApiKey","vhlProvider","vhlORKey","vhlORModel"]);
  if (s.vhlApiKey)  apiKeyInput.value = s.vhlApiKey;
  if (s.vhlORKey)   orKeyInput.value  = s.vhlORKey;
  if (s.vhlORModel) { selectedModel = s.vhlORModel; syncChips(selectedModel); }
  if (s.vhlProvider === "openrouter") switchProvider("openrouter");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTab = tab;
  const onVHL = tab?.url?.includes("vhlcentral.com");
  setStatus(onVHL ? "ok" : "err", onVHL ? "VHL page detected ✓" : "Navigate to a VHL activity");
  if (onVHL) solveBtn.disabled = false;
});

orLink.addEventListener("click", () => chrome.tabs.create({ url: "https://openrouter.ai/keys" }));

/* ─── PROVIDER SWITCH ─── */
btnClaude.addEventListener("click", () => switchProvider("claude"));
btnOR.addEventListener("click",     () => switchProvider("openrouter"));

function switchProvider(p) {
  provider = p;
  chrome.storage.local.set({ vhlProvider: p });
  if (p === "claude") {
    btnClaude.className = "provider-btn active-claude";
    btnOR.className     = "provider-btn";
    panelClaude.classList.add("visible");
    panelOR.classList.remove("visible");
    solveBtn.classList.remove("or-mode");
    footerBadge.textContent = "✦ Claude Sonnet";
    footerBadge.style.color = "var(--accent2)";
  } else {
    btnOR.className     = "provider-btn active-or";
    btnClaude.className = "provider-btn";
    panelOR.classList.add("visible");
    panelClaude.classList.remove("visible");
    solveBtn.classList.add("or-mode");
    const short = selectedModel.split("/").pop().replace(":free","");
    footerBadge.textContent = `⚡ ${short}`;
    footerBadge.style.color = "var(--or-light)";
  }
}

/* ─── MODEL CHIPS ─── */
modelChips.forEach(chip => {
  chip.addEventListener("click", () => {
    selectedModel = chip.dataset.model;
    syncChips(selectedModel);
    const short = selectedModel.split("/").pop().replace(":free","");
    footerBadge.textContent = `⚡ ${short}`;
    chrome.storage.local.set({ vhlORModel: selectedModel });
  });
});
function syncChips(model) {
  modelChips.forEach(c => c.classList.toggle("selected", c.dataset.model === model));
}

/* ─── EYE TOGGLES ─── */
toggleEye.addEventListener("click", () => {
  const show = apiKeyInput.type === "password";
  apiKeyInput.type = show ? "text" : "password";
  toggleEye.textContent = show ? "🙈" : "👁";
});
toggleOrEye.addEventListener("click", () => {
  const show = orKeyInput.type === "password";
  orKeyInput.type = show ? "text" : "password";
  toggleOrEye.textContent = show ? "🙈" : "👁";
});

/* ─── SAVE ─── */
saveKeyBtn.addEventListener("click", async () => {
  const key = apiKeyInput.value.trim();
  if (!key.startsWith("sk-ant-")) { showLog(); log("⚠ Key should start with sk-ant-", "err"); return; }
  await chrome.storage.local.set({ vhlApiKey: key });
  showLog(); log("Claude API key saved ✓", "ok");
});

saveORBtn.addEventListener("click", async () => {
  const key = orKeyInput.value.trim();
  if (!key) { showLog(); log("⚠ Please enter an OpenRouter API key", "err"); return; }
  await chrome.storage.local.set({ vhlORKey: key, vhlORModel: selectedModel });
  showLog(); log(`OpenRouter key saved ✓ (model: ${selectedModel.split("/").pop()})`, "ok");
});

/* ─── SOLVE ─── */
solveBtn.addEventListener("click", async () => {
  const s = await chrome.storage.local.get(["vhlApiKey","vhlORKey","vhlORModel"]);

  if (provider === "claude" && !s.vhlApiKey) { showLog(); log("Please save a Claude API key first.", "err"); return; }
  if (provider === "openrouter" && !s.vhlORKey) { showLog(); log("Please save an OpenRouter API key first.", "err"); return; }

  solveBtn.disabled = true;
  progressWrap.classList.add("show");
  showLog(); logBox.innerHTML = "";

  try {
    setStep(1, "active"); setProgress(15);
    const modelLabel = provider === "openrouter"
      ? (s.vhlORModel || selectedModel).split("/").pop().replace(":free","")
      : "Claude Sonnet";
    log(`Provider: ${modelLabel}`);
    log("Scanning page for questions...");

    await chrome.scripting.executeScript({ target: { tabId: activeTab.id }, files: ["content.js"] }).catch(() => {});

    const scrapeResp = await sendToTab({ action: "scrapeQuestions" });
    const questions  = scrapeResp?.questions || [];

    if (!questions.length) { log("No questions found. Make sure you're on an activity page.", "err"); setProgress(0); solveBtn.disabled = false; return; }
    log(`Found ${questions.length} question(s) ✓`, "ok");
    setStep(1, "done");

    setStep(2, "active"); setProgress(45);
    log("Sending to AI...");

    const aiResp = await chrome.runtime.sendMessage({
      action: "solveWithAI",
      payload: { provider, apiKey: s.vhlApiKey, orKey: s.vhlORKey, orModel: s.vhlORModel || selectedModel, questions }
    });

    if (!aiResp.success) { log(`AI error: ${aiResp.error}`, "err"); setProgress(0); solveBtn.disabled = false; return; }

    log(`Got ${aiResp.data.length} answer(s) ✓`, "ok");
    setStep(2, "done");

    setStep(3, "active"); setProgress(80);
    log("Filling in answers...");
    await sendToTab({ action: "fillAnswers", answers: aiResp.data });
    setStep(3, "done"); setProgress(100);
    log(`Done! ${aiResp.data.length} answers filled ✓`, "ok");
    aiResp.data.forEach(a => log(`  [${a.id}] → ${a.answer}`));

  } catch (err) { log(`Error: ${err.message}`, "err"); setProgress(0); }
  solveBtn.disabled = false;
});

/* ─── HELPERS ─── */
function showLog() { logBox.classList.add("show"); }
function setStatus(type, msg) { statusDot.className = `status-dot ${type}`; statusText.textContent = msg; }
function setProgress(pct) { progressFill.style.width = pct + "%"; }
function setStep(n, state) {
  const icons = { active: "⟳", done: "✓", "": "○" };
  const el = document.getElementById(`step${n}`);
  if (!el) return;
  el.className = `step ${state}`;
  el.querySelector(".step-icon").textContent = icons[state] || "○";
}
function log(msg, type = "") {
  const e = document.createElement("div");
  e.className = `log-entry ${type}`; e.textContent = msg;
  logBox.appendChild(e); logBox.scrollTop = logBox.scrollHeight;
}
function sendToTab(message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(activeTab.id, message, resp => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(resp);
    });
  });
}
