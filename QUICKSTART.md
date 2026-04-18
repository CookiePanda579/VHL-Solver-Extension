# VHL Solver - Quick Start

Get the VHL Solver Chrome Extension up and running in 5 minutes!

## Installation (Development Mode)

### Step 1: Locate the Extension Folder
The extension files are in: `/Users/coolpanda/CodingApp/VHLSolverExtension`

### Step 2: Open Chrome Extensions Page
1. Open Google Chrome
2. Type in address bar: `chrome://extensions/`
3. Press Enter

### Step 3: Enable Developer Mode
- Toggle the "Developer mode" switch in the top-right corner

### Step 4: Load the Extension
1. Click "Load unpacked"
2. Navigate to `/Users/coolpanda/CodingApp/VHLSolverExtension`
3. Click "Select Folder"
4. The extension is now installed! ✓

### Step 5: Verify Installation
- You should see "VHL Solver" in your extensions
- Look for the puzzle icon in the Chrome toolbar
- You should see a checkmark next to "Manifest version 3"

---

## First Use

### 1. Navigate to VHL Page
- Go to any VHL (VHL Central or VHL Campus) page with questions

### 2. Open the Extension
- Click the VHL Solver icon in the Chrome toolbar
- A popup will appear stating "Ready"

### 3. Try the Buttons

**📋 Get Questions**
- Click to detect and list all questions on the page
- Shows statistics about question types

**⚡ Auto-Solve**
- Automatically solves word-input problems
- Best for fill-in-the-blank questions

**✅ Submit Answers**
- Finds and clicks the submit button
- Submits all filled-in answers

---

## Basic Usage Examples

### Example 1: Simple Question Solving
1. Navigate to a VHL page with word-input questions
2. Click "Get Questions" to verify questions are detected
3. Click "Auto-Solve" to attempt automatic solving
4. Click "Submit Answers" to submit

### Example 2: Manual Answer Input (Advanced)
Open the browser console (F12) and run:

```javascript
// Get all questions
const questions = VHLSolver.getAllQuestions();
console.log(questions);

// Solve with specific answers
VHLSolver.solveAllWordInputs(['answer1', 'answer2', 'answer3']);

// Submit
VHLSolver.submitAnswers();
```

### Example 3: Check Question Types
```javascript
// See what types of questions are on the page
const stats = VHLSolver.getQuestionStats();
console.table(stats);
```

---

## Troubleshooting

### Problem: Extension icon not showing
**Solution:**
1. Refresh the VHL page (Ctrl+R or Cmd+R)
2. Check if you're on vhlcentral.com or vhlcampus.com
3. Reload extension: go to `chrome://extensions/` and click the reload icon

### Problem: "No questions found"
**Solution:**
1. Verify you're on a VHL page with actual questions
2. Wait for page to fully load
3. Open DevTools (F12) → Console and run:
   ```javascript
   VHLSolver.getAllQuestions().forEach((q, i) => {
     console.log(i, q.type, q.text.substring(0, 50));
   });
   ```

### Problem: Answers not being filled
**Solution:**
1. Some question types may not be automatically supported
2. Try solving specific questions manually:
   ```javascript
   const q = VHLSolver.getAllQuestions()[0];
   VHLSolver.solveWordInput(q, 'your_answer');
   ```
3. Check if input fields are visible and enabled

### Problem: Submit button not working
**Solution:**
1. The submit button selector may need updating
2. Find the correct button selector:
   ```javascript
   // In DevTools console:
   document.querySelectorAll('button');  // Find buttons
   ```
3. Click the button manually or update content-script.js

---

## Advanced Features

### Console Access
The `VHLSolver` object is always available in the console when on a VHL page:

```javascript
// Open DevTools (F12) on any VHL page and run:
VHLSolver.getAllQuestions()      // Get all questions
VHLSolver.getQuestionStats()     // Get statistics
VHLSolver.autoSolveWordInputs()  // Auto-solve
VHLSolver.submitAnswers()        // Submit
```

### Using Utilities
Helper functions for advanced use:

```javascript
// Validate words
VHLUtils.isValidWord('casa')  // true
VHLUtils.isValidWord('x')     // false

// Check word similarity
VHLUtils.calculateSimilarity('casa', 'casas')  // 0.8

// Find best matching word
VHLUtils.findBestMatch('casa', ['casas', 'casita', 'casino']);
```

### Complete Workflow Example
```javascript
// 1. Get questions
const questions = VHLSolver.getAllQuestions();

// 2. Print questions to review
questions.forEach((q, i) => {
  console.log(`Q${i + 1}: ${q.text}`);
});

// 3. Prepare answers
const answers = ['answer1', 'answer2', 'answer3'];

// 4. Solve all
VHLSolver.solveAllWordInputs(answers);

// 5. Submit
VHLSolver.submitAnswers();
```

---

## File Reference

| File | Purpose |
|------|---------|
| `manifest.json` | Extension configuration |
| `content-script.js` | Main solver logic (runs on VHL pages) |
| `popup.html` | Extension UI layout |
| `popup.js` | Extension UI interactions |
| `background.js` | Background service worker |
| `utils.js` | Helper utility functions |
| `API_EXAMPLES.js` | 20+ code examples |
| `README.md` | Full documentation |
| `DEVELOPER_GUIDE.md` | Developer documentation |

---

## Key Features Summary

✅ **Automatic Question Detection** - Finds all questions on the page  
✅ **Multiple Question Types** - Supports word-input, multiple choice, etc.  
✅ **Auto-Solving** - Attempts to solve questions automatically  
✅ **Easy Submission** - One-click answer submission  
✅ **Statistics** - View question breakdown  
✅ **Console API** - Full programmatic access  
✅ **Well Documented** - Extensive examples and guides  

---

## Next Steps

1. **Install** the extension (see Installation steps above)
2. **Test** on a VHL page with simple questions
3. **Read** API_EXAMPLES.js for 20+ code examples
4. **Explore** the console API for advanced usage
5. **Check** DEVELOPER_GUIDE.md if you want to modify/extend

---

## Need Help?

### Quick Reference Commands

```javascript
// Run these commands in DevTools Console (F12) on any VHL page

// Get started
quickStart()

// Get all questions
VHLSolver.getAllQuestions()

// Get statistics
VHLSolver.getQuestionStats()

// Auto-solve all word-input questions
VHLSolver.autoSolveWordInputs()

// Manually solve question 1 with specific answer
VHLSolver.solveAllWordInputs(['answer1', 'answer2'])

// Submit answers
VHLSolver.submitAnswers()

// View examples from API_EXAMPLES.js
example_completeWorkflow()
```

---

## Version Info

- **Version**: 1.0.0
- **Last Updated**: 2024
- **Chrome Manifest**: v3
- **Supported Platforms**: Chrome, Edge, Brave (any Chromium-based browser)

---

## Important Notes

⚠️ **Academic Integrity**: Use this extension responsibly and in accordance with your school's academic integrity policies.

⚠️ **VHL May Update**: If VHL changes their website structure, the extension may need updates. This is normal and can be fixed by updating CSS selectors in `content-script.js`.

✨ **Pro Tip**: Keep the `API_EXAMPLES.js` file open while using the console API for quick reference to available functions.

---

**Ready to get started?** Go to Step 1 of Installation above! 🚀
