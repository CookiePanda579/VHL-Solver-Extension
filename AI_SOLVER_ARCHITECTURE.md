# AI Solver - Architecture & Implementation

Complete technical documentation for the AI-powered question solving system.

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                         │
│                    (popup.html/popup.js)                    │
│                                                             │
│  [Settings] [AI Solve] [Auto-Solve] [Submit]              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    chrome.runtime.sendMessage
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│               Background Service Worker                     │
│                   (background.js)                           │
│                                                             │
│  ├─ Message Handlers                                       │
│  ├─ API Key Management                                     │
│  ├─ OpenRouter API Integration                             │
│  └─ AI Question Solving Logic                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ↓                  ↓                  ↓
    [Storage]       [OpenRouter API]    [Content Script]
 chrome.storage.local  (External)        (content-script.js)
                                              │
                    chrome.tabs.sendMessage
                                              │
                                              ↓
                                    ┌─────────────────────┐
                                    │   VHL Web Page      │
                                    │                     │
                                    │ [Question Fields]   │
                                    │ (Filled by script)  │
                                    └─────────────────────┘
```

---

## File Structure - AI Components

### New Files

#### `ai-solver.js`
- **Status**: Created but not actively used in current implementation
- **Purpose**: Utility module for AI-related functions
- **Location**: Added to project for future extensibility
- **Functions**:
  - `getApiKey()`, `saveApiKey()` - Storage management
  - `solveQuestions()`, `solveQuestion()` - Main solving logic
  - `buildPrompt()` - Prompt generation
  - `testApiKey()` - Validation

#### `AI_SOLVER_GUIDE.md`
- **Purpose**: User-facing guide for AI solving feature
- **Content**: Setup, usage, pricing, troubleshooting
- **Audience**: Educators and students

### Modified Files

#### `manifest.json`
```json
{
  "permissions": ["scripting", "activeTab", "storage"],
  "host_permissions": [
    "*://vhlcentral.com/*",
    "*://*.vhlcentral.com/*",
    "*://*.vhlcampus.com/*",
    "*://openrouter.ai/*"  // NEW: For API calls
  ]
}
```

**Changes:**
- Added `"storage"` permission - Persist API key
- Added `"*://openrouter.ai/*"` - Access OpenRouter API

#### `background.js`
```javascript
// NEW: Handles all OpenRouter API communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'aiSolve') {
    handleAISolve(request, sendResponse);  // NEW
  }
  if (request.action === 'saveApiKey') {
    // Save to chrome.storage.local
  }
  if (request.action === 'getApiKey') {
    // Retrieve from chrome.storage.local
  }
  if (request.action === 'testApiKey') {
    // Verify API key validity
  }
});
```

**New Functions:**
- `handleAISolve()` - Main AI solving handler
- `solveQuestionWithAI()` - Single question solving
- `buildPrompt()` - Generate AI-friendly prompts
- `testApiKey()` - Validate API key
- `getStoredApiKey()` - Retrieve saved key
- `delay()` - Rate limiting utility

#### `popup.html`
```html
<!-- NEW: Settings Section -->
<button id="settingsToggle" class="settings-toggle">⚙️ Settings</button>
<div id="settingsPanel" class="settings-panel">
  <input type="password" id="apiKeyInput" class="api-key-input">
  <select id="modelSelect" class="model-select">
    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
    <option value="gpt-4">GPT-4</option>
    <option value="claude-2">Claude 2</option>
    <option value="mistral-7b">Mistral 7B</option>
  </select>
  <button id="testKeyBtn" class="btn-test">🧪 Test</button>
  <button id="saveKeyBtn" class="btn-save">💾 Save</button>
  <button id="clearKeyBtn" class="btn-clear">🗑️ Clear</button>
</div>

<!-- NEW: AI Solve Button -->
<button id="aiSolveBtn" class="btn-secondary">🤖 AI Solve</button>
```

**New CSS Classes:**
- `.settings-toggle`, `.settings-panel` - Settings UI
- `.api-key-input`, `.model-select` - Input fields
- `.btn-test`, `.btn-save`, `.btn-clear` - Settings buttons
- `.key-status` - Status messages

#### `popup.js`
```javascript
// NEW: Settings Management
settingsToggle.addEventListener('click', () => {
  settingsPanel.classList.toggle('show');
  loadStoredSettings();
});

// NEW: API Key Operations
async function loadStoredSettings() { }
function showKeyStatus(message, type) { }
saveKeyBtn.addEventListener('click', async () => {
  await sendToBackground({ action: 'saveApiKey', key: apiKeyInput.value });
});

testKeyBtn.addEventListener('click', async () => {
  await sendToBackground({ action: 'testApiKey', key: apiKeyInput.value });
});

clearKeyBtn.addEventListener('click', async () => {
  await sendToBackground({ action: 'saveApiKey', key: '' });
});

// NEW: AI Solve Button
aiSolveBtn.addEventListener('click', async () => {
  // 1. Check if API key configured
  // 2. Get questions from content script
  // 3. Send to background for AI solving
  // 4. Fill answers via content script
  // 5. Display results
});

// NEW: Helper to send to background
async function sendToBackground(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) reject(error);
      else resolve(response);
    });
  });
}
```

#### `content-script.js`
```javascript
// NEW: Handle AI solve responses
case 'aiSolveResponse':
  handleAISolveResponse(request.results, sendResponse);
  break;

// NEW: Function to fill AI-solved answers
function handleAISolveResponse(results, sendResponse) {
  const questions = VHLSolver.getAllQuestions();
  const fillResults = [];

  // Match AI results to page questions
  // Fill answers into form fields
  // Return fill status
}
```

---

## Message Flow - AI Solving

### Step-by-Step Flow

```
STEP 1: User clicks "🤖 AI Solve"
├─ popup.js: Click event triggered
├─ popup.js: Check if API key stored
└─ popup.js: Get questions from content script

STEP 2: Extract Questions from Page
├─ content-script.js: sendMessage({ action: 'getQuestions' })
├─ VHLSolver.getAllQuestions() called
└─ popup.js: Receives questions array

STEP 3: Send to Background for AI Solving
├─ popup.js: sendMessage({ 
│     action: 'aiSolve', 
│     questions: [...], 
│     model: 'gpt-3.5-turbo'
│   })
├─ background.js: handleAISolve() called
└─ background.js: Processes questions

STEP 4: Background Solves Each Question
├─ background.js: solveQuestionWithAI(question, apiKey, model)
├─ Builds prompt from question text
├─ Makes fetch request to OpenRouter API
├─ Receives AI-generated answer
├─ Stores result in results array
└─ 300ms delay between questions (rate limiting)

STEP 5: Return Results to Background Handler
├─ background.js: Prepares results object
├─ background.js: Sends back to popup.js
└─ popup.js: Receives results { solved: [], unsolved: [], errors: [] }

STEP 6: Fill Answers on Page
├─ popup.js: sendMessage({ 
│     action: 'aiSolveResponse', 
│     results: {...} 
│   })
├─ content-script.js: handleAISolveResponse() called
├─ VHLSolver.solveWordInput() fills each answer
└─ popup.js: Receives confirmation

STEP 7: Display Results to User
├─ popup.js: Update status text
├─ popup.js: Show success/error message
├─ popup.js: Log results to console
└─ User can now submit with ✅ Submit Answers
```

---

## API Integration Details

### OpenRouter API Endpoint

```
URL: https://openrouter.ai/api/v1/chat/completions
Method: POST
```

### Request Format

```javascript
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "You are a Spanish language teacher helping 
                  students with VHL exercises. Provide accurate, 
                  concise answers to fill-in-the-blank questions. 
                  Reply with only the answer word or phrase, 
                  nothing else."
    },
    {
      "role": "user",
      "content": "Spanish learning question: [Question Text]"
    }
  ],
  "temperature": 0.3,      // Deterministic (consistent) responses
  "max_tokens": 50         // Short answers only
}
```

### Headers

```
Authorization: Bearer sk-or-v1-[YOUR_KEY]
Content-Type: application/json
HTTP-Referer: https://vhlsolver.extension
X-Title: VHL Solver
```

### Response Format

```javascript
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "los"  // The AI's answer
      }
    }
  ]
}
```

### Error Handling

```javascript
// Format validation
if (!apiKey.startsWith('sk-') && !apiKey.includes('or-')) {
  throw new Error('Invalid API key format');
}

// Response status
if (!response.ok) {
  const errorData = await response.json();
  throw new Error(`API error: ${errorData.error?.message}`);
}

// Missing required fields
if (!data.choices?.[0]?.message?.content) {
  throw new Error('Invalid API response format');
}
```

---

## Storage Management

### Chrome Storage API

Uses `chrome.storage.local` for persisting API key:

```javascript
// Save API key
chrome.storage.local.set({ openrouterKey: 'sk-or-v1-...' });

// Retrieve API key
chrome.storage.local.get(['openrouterKey'], (result) => {
  const key = result.openrouterKey;
});

// Clear API key
chrome.storage.local.set({ openrouterKey: '' });
```

### Storage Lifetime

- **Local Storage**: Persists until extension removed or cleared
- **Per User**: Each browser profile has separate storage
- **Per Extension**: Each extension has isolated storage
- **Security**: Only accessible from extension code

### Data Structure

```javascript
{
  openrouterKey: "sk-or-v1-abcd1234..."
}
```

---

## Rate Limiting & Performance

### Rate Limiting Implementation

```javascript
// 300ms delay between API requests
for (const question of wordInputQuestions) {
  // Solve question
  // ...
  
  // Wait before next request
  await delay(300);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**Why?**
- Prevents overwhelming the API
- Respects OpenRouter's rate limits
- Prevents local resource exhaustion
- Provides user feedback over time

### Performance Metrics

```
Per Question:
  Question extraction:    ~50-100ms
  API request:            ~1-10s (depends on model & server)
  Answer filling:         ~100-200ms
  Rate limiting delay:    ~300ms
  Total per question:     ~1-10s

Example Batch (10 questions):
  Total time:  ~10-100 seconds
  API calls:   Sequential (one at a time)
  Bandwidth:   Low (small payloads)
```

---

## Error Handling

### Error Scenarios

| Error | Source | Location | Recovery |
|-------|--------|----------|----------|
| API key not configured | User | popup.js | Show settings panel |
| Invalid API key format | User | popup.js (save) | Validate before save |
| API authentication failed | OpenRouter | background.js | Invalid key (test) |
| API rate limited | OpenRouter | background.js | Retry with backoff |
| Network error | Network | background.js | Catch & report |
| No questions found | Content page | popup.js | Check if VHL page |
| Question matching failed | Logic | content-script.js | Use fallback matching |

### Error Recovery

```javascript
try {
  // Try to solve
  const answer = await solveQuestionWithAI(question, apiKey, model);
} catch (error) {
  // Add to errors array
  results.errors.push({
    questionText: question.text,
    error: error.message
  });
  
  // Continue with next question
  continue;
}
```

---

## Testing the AI Solver

### Manual Testing

```javascript
// In console (F12) on VHL page:

// 1. Check stored API key
chrome.storage.local.get(['openrouterKey'], (r) => console.log(!!r.openrouterKey));

// 2. Get questions
const q = VHLSolver.getAllQuestions();
console.table(q);

// 3. Test AI solving
const response = await chrome.runtime.sendMessage({
  action: 'aiSolve',
  questions: q.slice(0, 3),  // First 3 questions
  model: 'gpt-3.5-turbo'
});
console.log(response);

// 4. Check results
console.table(response.results.solved);
console.table(response.results.errors);
```

### Unit Testing

```javascript
// Test API key validation
function testApiKeyValidation() {
  const validKeys = [
    'sk-or-v1-abcd',
    'sk-proj-xyz'
  ];
  
  const invalidKeys = [
    'invalid',
    'sk-no-dash-after',
    ''
  ];
  
  validKeys.forEach(key => {
    assert(isValidApiKey(key), `Should accept ${key}`);
  });
  
  invalidKeys.forEach(key => {
    assert(!isValidApiKey(key), `Should reject ${key}`);
  });
}

// Test prompt building
function testPromptBuilding() {
  const question = {
    text: 'Complete: Yo _____ (ir) a la escuela',
    type: 'word-input'
  };
  
  const prompt = buildPrompt(question);
  assert(prompt.includes('Spanish learning question'));
  assert(prompt.includes(question.text));
}
```

---

## Extending the AI Solver

### Adding a New AI Model

```javascript
// In manifest.json
// (No changes needed - OpenRouter handles models)

// In popup.html - Add option
<option value="new-model-name">New Model</option>

// In background.js - No changes needed
// Just use the new model name:
{
  model: "new-model-name",
  messages: [...]
}
```

### Adding Support for Multiple Choice

```javascript
// In background.js
async function solveMultipleChoice(question, apiKey, model) {
  const options = question.options.map(o => o.text).join('\n');
  
  const prompt = `Choose the correct answer:
${question.text}

Options:
${options}

Answer only with the option letter or number.`;

  // ... continue with API call
}
```

### Adding Dictionary Integration

```javascript
// Create languageModel.js
const LanguageModel = {
  async validateAnswer(answer) {
    // Check against dictionary API
    const response = await fetch(`https://dict-api.com/lookup?word=${answer}`);
    return response.ok;
  }
};

// In background.js
const answer = await solveQuestionWithAI(question, apiKey, model);
const isValid = await LanguageModel.validateAnswer(answer);
```

---

## Security Considerations

### API Key Protection

✅ **Stored locally**: Only in chrome.storage.local
✅ **Encrypted**: Chrome handles storage encryption
✅ **Not hardcoded**: User provides their own key
✅ **Not logged**: Extension doesn't log requests/responses
✅ **HTTPS only**: All API calls use HTTPS

### Best Practices Implementation

```javascript
// 1. Validate before storage
if (!key.startsWith('sk-') && !key.includes('or-')) {
  throw new Error('Invalid key format');
}

// 2. Don't log sensitive data
// ❌ WRONG: console.log('API Key:', apiKey);
// ✅ RIGHT: console.log('API Key stored'); 

// 3. Clear on uninstall (done by extension system)

// 4. HTTPS headers for API communication
fetch(url, {
  headers: {
    'HTTP-Referer': 'https://vhlsolver.extension',
    // Shows OpenRouter this is legitimate extension usage
  }
});
```

---

## Performance Optimization

### Current Optimizations

✅ Rate limiting (prevent overload)
✅ Short max_tokens (faster responses)
✅ Low temperature (deterministic)
✅ Promise-based concurrency
✅ Efficient prompt building

### Future Optimizations

- [ ] Response caching (same question = cached answer)
- [ ] Batch API requests (multiple questions per API call)
- [ ] Model-specific prompt optimization
- [ ] Fallback to auto-solve if API fails
- [ ] Parallel question processing (multiple models at once)

---

## Troubleshooting Guide - For Developers

### Issue: API calls not responding

```javascript
// Debug fetch call
const response = await fetch(url, options);
console.log('Status:', response.status);
console.log('Headers:', response.headers);
const data = await response.json();
console.log('Data:', data);
```

### Issue: API key not persisting

```javascript
// Check storage
chrome.storage.local.get(['openrouterKey'], (r) => {
  console.log('Stored:', r.openrouterKey);
});

// Verify save was called
chrome.storage.local.set({ openrouterKey: 'test' }, () => {
  console.log('Save callback triggered');
});
```

### Issue: Questions not filling

```javascript
// Check question matching
const questions = VHLSolver.getAllQuestions();
const solved = aiResponse.results.solved;

questions.forEach(q => {
  const match = solved.find(s => s.questionText === q.text);
  console.log(q.text, '→', match ? match.answer : 'NO MATCH');
});
```

---

## Code Quality Standards

### Adhered To

✅ Async/await (not callbacks)
✅ Error handling (try/catch)
✅ JSDoc comments (for functions)
✅ Consistent naming (camelCase)
✅ DRY principle (no code repetition)

### Future Improvements

- [ ] TypeScript for type safety
- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] Code coverage > 80%
- [ ] ESLint configuration

---

## Glossary

- **API Key**: Authentication token for OpenRouter
- **Rate Limiting**: Delay between requests to prevent overload
- **Prompt**: Input text sent to AI model
- **Token**: Unit of text (roughly 4 chars = 1 token)
- **Temperature**: Parameter controlling randomness (0-1)
- **Max Tokens**: Maximum length of API response
- **Message Flow**: Sequence of messages between extension components
- **Content Script**: JavaScript that runs on web pages
- **Service Worker**: Background process for extension
- **Storage**: Chrome's local data persistence system

---

**Version**: 1.0.0  
**Feature**: AI Solver with OpenRouter  
**Last Updated**: 2024
