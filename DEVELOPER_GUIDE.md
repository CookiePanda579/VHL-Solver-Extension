# VHL Solver - Developer Guide

Complete guide for developers who want to understand, extend, and customize the VHL Solver Chrome Extension.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [Core Components](#core-components)
4. [Extension Communication](#extension-communication)
5. [Adding New Features](#adding-new-features)
6. [Debugging Guide](#debugging-guide)
7. [Testing](#testing)
8. [Performance Optimization](#performance-optimization)

---

## Architecture Overview

### High-Level Flow

```
User navigates to VHL page
        ↓
manifest.json loads extension
        ↓
content-script.js injects into page
        ↓
popup.js awaits user action
        ↓
User clicks button → Message sent to content script
        ↓
VHLSolver performs action → Result returned to popup
        ↓
UI updates with results
```

### Components Communication

```
┌─────────────┐
│  popup.js   │ ← User Interface
└──────┬──────┘
       │ (chrome.tabs.sendMessage)
       ↓
┌──────────────────────┐
│ content-script.js    │ ← Main Solver Logic (VHLSolver object)
│ + utils.js           │
└──────┬───────────────┘
       │
       ↓
┌─────────────┐
│ VHL Page    │ ← DOM Manipulation
│ (VHL DOM)   │
└─────────────┘
```

---

## File Structure

### manifest.json
- **Purpose**: Chrome extension configuration
- **Key Sections**:
  - `manifest_version`: Always 3 for modern extensions
  - `permissions`: What the extension can access
  - `host_permissions`: Domains where content script runs
  - `content_scripts`: Configuration for page injection

### content-script.js
- **Purpose**: Main solver logic that runs on VHL pages
- **Key Object**: `VHLSolver`
- **Runs In**: VHL web pages (isolated context)
- **Can Access**: VHL page DOM directly

### popup.html & popup.js
- **Purpose**: Extension popup UI
- **popup.html**: Layout and styling
- **popup.js**: Event listeners and communication
- **Runs In**: Extension context (not page context)
- **Cannot**: Access page DOM directly (must use messaging)

### background.js
- **Purpose**: Service worker for background tasks
- **Runs In**: Extension background context
- **Can**: Handle cross-tab communication, timers, etc.

### utils.js
- **Purpose**: Helper utilities for word processing
- **Includes**: Spell checking, word similarity, validation functions
- **Available**: In both content script and popup contexts

---

## Core Components

### VHLSolver Object (content-script.js)

The main object that provides all solving functionality:

```javascript
VHLSolver = {
  // Question extraction
  getAllQuestions()              // Get all questions
  extractQuestionData()          // Extract single question
  detectQuestionType()           // Determine question type
  
  // Solving
  solveWordInput()               // Fill single question
  solveAllWordInputs()           // Fill multiple questions
  autoSolveWordInputs()          // Auto-detect and solve
  
  // Submission
  submitAnswers()                // Find and click submit
  
  // Analytics
  getQuestionStats()             // Get question statistics
  extractAnswerHint()            // Extract hints from text
}
```

### Message API

Communication between popup and content script:

```javascript
// From popup.js (requesting action):
chrome.tabs.sendMessage(tabId, {
  action: 'getQuestions' | 'solveWordInputs' | 'autoSolve' | 'submitAnswers' | 'getStats',
  answers: [...],  // Optional: array of answers
  ...
}, (response) => {
  // Handle response
});

// From content-script.js (receiving and responding):
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getQuestions') {
    sendResponse({ questions: VHLSolver.getAllQuestions() });
  }
});
```

---

## Extension Communication

### Popup → Content Script

```javascript
// In popup.js
const response = await chrome.tabs.sendMessage(tabId, {
  action: 'solveWordInputs',
  answers: ['answer1', 'answer2']
});
console.log(response.results);  // Process results
```

### Content Script → Popup

```javascript
// In content-script.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Process request
  const result = VHLSolver.getAllQuestions();
  sendResponse({ questions: result });
});
```

### Background Script Communication

```javascript
// In background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'log') {
    console.log(request.message);
    sendResponse({ success: true });
  }
});

// From any context
chrome.runtime.sendMessage({ action: 'log', message: 'Test' });
```

---

## Adding New Features

### Example 1: Add Support for Drag-and-Drop Questions

**Step 1**: Update `detectQuestionType()` in content-script.js

```javascript
detectQuestionType(element) {
  // ... existing code ...
  
  // Add drag-drop detection
  if (element.querySelector('[draggable="true"]') ||
      element.innerHTML.includes('drag') && element.innerHTML.includes('drop')) {
    return 'drag-drop';
  }
}
```

**Step 2**: Add solver method in VHLSolver

```javascript
solveDragDrop(question, answers) {
  const draggables = question.rawElement.querySelectorAll('[draggable="true"]');
  const dropZones = question.rawElement.querySelectorAll('[class*="drop"]');
  
  draggables.forEach((drag, index) => {
    const target = dropZones[index];
    if (target) {
      // Simulate drag-drop
      this.simulateDragDrop(drag, target);
    }
  });
}

simulateDragDrop(source, target) {
  const dataTransfer = new DataTransfer();
  const dragEvent = new DragEvent('dragstart', { 
    dataTransfer,
    bubbles: true,
    cancelable: true 
  });
  
  source.dispatchEvent(dragEvent);
  target.dispatchEvent(new DragEvent('drop', {
    dataTransfer,
    bubbles: true,
    cancelable: true
  }));
}
```

**Step 3**: Add message handler in popup

```javascript
// In popup.js
const dragDropBtn = document.getElementById('dragDropBtn');
dragDropBtn.addEventListener('click', async () => {
  const response = await sendToContentScript({ 
    action: 'solveDragDrop',
    answers: ['answer1', 'answer2']
  });
});
```

### Example 2: Add Answer Caching

**Step 1**: Create cache module

```javascript
// cacheManager.js
const CacheManager = {
  store: {},
  
  save(pageUrl, questions, answers) {
    this.store[pageUrl] = { questions, answers, timestamp: Date.now() };
    this.saveToLocalStorage();
  },
  
  load(pageUrl) {
    return this.store[pageUrl] || null;
  },
  
  saveToLocalStorage() {
    localStorage.setItem('vhlSolverCache', JSON.stringify(this.store));
  },
  
  loadFromLocalStorage() {
    const cached = localStorage.getItem('vhlSolverCache');
    this.store = cached ? JSON.parse(cached) : {};
  }
};
```

**Step 2**: Integrate into content script

```javascript
// In content-script.js
CacheManager.loadFromLocalStorage();

// When solving
const pageUrl = window.location.href;
VHLSolver.solveAllWordInputs(answers);
CacheManager.save(pageUrl, questions, answers);
```

### Example 3: Add Keyboard Shortcuts

**Step 1**: Update manifest.json

```json
{
  "commands": {
    "auto-solve": {
      "suggested_key": {
        "default": "Ctrl+Shift+S",
        "mac": "Command+Shift+S"
      },
      "description": "Auto-solve current questions"
    }
  }
}
```

**Step 2**: Handle in background.js

```javascript
chrome.commands.onCommand.addListener((command) => {
  if (command === 'auto-solve') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'autoSolve' });
    });
  }
});
```

---

## Debugging Guide

### Enable Detailed Logging

**In content-script.js:**

```javascript
// Add at top
const DEBUG = true;

function log(...args) {
  if (DEBUG) console.log('[VHL Solver]', ...args);
}

// Replace console.log calls:
log('Found questions:', questions);
```

### Browser DevTools

1. **Open DevTools**: Press F12 on VHL page
2. **View Content Script Logs**: Console tab
3. **Inspect Elements**: Elements tab (search for question containers)
4. **Check Messages**: Applications tab → Storage → Cookies/Local Storage

### Test Selectors

```javascript
// Test if selectors are working
document.querySelectorAll('[data-reactroot] .question-block').length

// Test question detection
VHLSolver.getAllQuestions().forEach((q, i) => {
  console.log(`Q${i}: ${q.type} - "${q.text.substring(0, 30)}..."`);
});

// Test solving
const q = VHLSolver.getAllQuestions()[0];
VHLSolver.solveWordInput(q, 'test-answer');
```

### Network Debugging

```javascript
// Monitor XHR requests (if VHL uses API calls)
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch request:', args[0]);
  return originalFetch.apply(this, args);
};
```

---

## Testing

### Manual Testing Checklist

- [ ] Extension loads on VHL page
- [ ] Popup opens when extension icon clicked
- [ ] Get Questions button populates stats
- [ ] Auto-Solve fills visible questions
- [ ] Submit button clicks successfully
- [ ] Works on different question types
- [ ] Multiple questions can be solved
- [ ] Errors are handled gracefully

### Automated Testing Setup

```javascript
// test.js - Can be run in DevTools console
async function runTests() {
  const tests = [
    testGetQuestions,
    testDetectTypes,
    testSolveWordInput,
    testSubmit
  ];
  
  for (let test of tests) {
    try {
      await test();
      console.log(`✓ ${test.name}`);
    } catch (e) {
      console.error(`✗ ${test.name}:`, e.message);
    }
  }
}

function testGetQuestions() {
  const q = VHLSolver.getAllQuestions();
  if (q.length === 0) throw new Error('No questions found');
}

function testDetectTypes() {
  const q = VHLSolver.getAllQuestions();
  const hasWordInput = q.some(qu => qu.type === 'word-input');
  if (!hasWordInput && q.length > 0) {
    throw new Error('No word-input questions detected');
  }
}

// runTests();
```

---

## Performance Optimization

### Current Performance

- Question extraction: ~5-50ms (depends on page complexity)
- Solving a question: ~1-5ms per question
- Submit: ~10-20ms

### Optimization Techniques

**1. Debounce polling:**

```javascript
let debounceTimer;
function debouncedGetQuestions() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    VHLSolver.getAllQuestions();
  }, 300);
}
```

**2. Cache DOM queries:**

```javascript
const questionCache = new Map();

function getCachedQuestions() {
  const cacheKey = 'questions';
  if (questionCache.has(cacheKey)) {
    return questionCache.get(cacheKey);
  }
  
  const questions = VHLSolver.getAllQuestions();
  questionCache.set(cacheKey, questions);
  return questions;
}
```

**3. Lazy load detection:**

```javascript
const wordInputCache = null;

function getWordInputQuestions() {
  if (!wordInputCache) {
    wordInputCache = VHLSolver.getAllQuestions()
      .filter(q => q.type === 'word-input');
  }
  return wordInputCache;
}
```

### Memory Management

```javascript
// Clear references when done
function cleanup() {
  questionCache.clear();
  wordInputCache = null;
}

// Use WeakMap for element references
const elementCache = new WeakMap();
```

---

## Extending with External APIs

### Example: Dictionary Integration

```javascript
// Add to utils.js
const DictionaryAPI = {
  async getDefinition(word) {
    const response = await fetch(
      `https://api.example.com/definition?word=${word}`
    );
    return response.json();
  },
  
  async checkSpelling(word) {
    const response = await fetch(
      `https://api.example.com/spell?word=${word}`
    );
    return response.json();
  }
};

// Use in VHLSolver
async autoSolveWordInputs() {
  // Check if auto-suggested answer is in dictionary
  const hint = this.extractAnswerHint(question.text);
  const isValid = await DictionaryAPI.checkSpelling(hint);
  
  if (isValid) {
    this.solveWordInput(question, hint);
  }
}
```

---

## Best Practices

1. **Always handle errors gracefully** - VHL pages may differ
2. **Use try-catch blocks** - Prevent extension from crashing
3. **Log important steps** - Help with debugging
4. **Test on multiple questions** - Ensure robustness
5. **Validate user input** - Prevent invalid data
6. **Optimize DOM queries** - Use specific selectors
7. **Cache when appropriate** - Improve performance
8. **Clean up resources** - Prevent memory leaks

---

## Common Issues & Solutions

### Issue: "Content script not available on this page"
**Solution**: Check that URL matches in manifest.json `host_permissions`

### Issue: "Elements found but not solving"
**Solution**: Check if element is actually interactive with `isElementVisible()` and `isInteractiveElement()`

### Issue: "Submit button not found"
**Solution**: The selector may have changed. Update `submitAnswers()` with correct selector

### Issue: "Performance degradation"
**Solution**: Implement caching and debouncing as shown in Performance Optimization section

---

## Contributing

When adding new features:

1. Follow existing code style
2. Add comments for complex logic
3. Update README.md with new features
4. Test on actual VHL pages
5. Handle edge cases
6. Update API_EXAMPLES.js with examples

---

**Last Updated**: 2024  
**Version**: 1.0.0
