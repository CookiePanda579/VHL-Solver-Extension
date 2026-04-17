// background.js – VHL Solver (Claude + OpenRouter)

const SYSTEM_PROMPT = `You are a language tutor helping a student with VHL Central exercises.
Respond ONLY with a valid JSON array. No markdown, no explanation, no preamble.
Each element must be an object: { "id": <question id>, "answer": <answer string> }
For fill-in-the-blank: provide the exact word(s) to fill in.
For multiple choice: provide the exact text of the correct option.
For dropdown: provide the exact option text.
For matching: provide the matching text.
Answer in the target language of the exercise (Spanish, French, etc.).`;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "solveWithAI") {
    const { provider, apiKey, orKey, orModel, questions } = request.payload;

    const handler = provider === "openrouter"
      ? handleOpenRouterRequest({ orKey, orModel, questions })
      : handleClaudeRequest({ apiKey, questions });

    handler
      .then(result => sendResponse({ success: true, data: result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

/* --- CLAUDE --- */
async function handleClaudeRequest({ apiKey, questions }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(questions) }]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Claude API error ${response.status}`);
  }

  const data = await response.json();
  const raw = data.content?.find(b => b.type === "text")?.text || "[]";
  return parseJSON(raw);
}

/* --- OPENROUTER --- */
async function handleOpenRouterRequest({ orKey, orModel, questions }) {
  const model = orModel || "meta-llama/llama-3.3-70b-instruct:free";

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${orKey}`,
      "HTTP-Referer": "https://vhlcentral.com",
      "X-Title": "VHL Solver"
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: buildPrompt(questions) }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenRouter error ${response.status}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || "[]";
  return parseJSON(raw);
}

/* --- SHARED --- */
function buildPrompt(questions) {
  const lines = questions.map(q => {
    let desc = `[ID: ${q.id}] Type: ${q.type}\nQuestion: ${q.question}`;
    if (q.options?.length) desc += `\nOptions: ${q.options.join(" | ")}`;
    if (q.context) desc += `\nContext: ${q.context}`;
    return desc;
  });
  return `Solve these VHL language exercise questions:\n\n${lines.join("\n\n")}`;
}

function parseJSON(raw) {
  const clean = raw.replace(/```json|```/gi, "").trim();
  const match = clean.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Model did not return a JSON array. Try a different model.");
  return JSON.parse(match[0]);
}
