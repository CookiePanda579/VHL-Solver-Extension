# VHL Solver Chrome Extension

A powerful Chrome extension designed to automatically solve word-input problems on VHL (VHL Central) learning platform.

## Features

- **Extract Questions**: Automatically detect and extract all questions from VHL pages
- **Auto-Solve**: Attempt to automatically solve word-input problems
- **Submit Answers**: Easily submit your answers with one click
- **Statistics**: View real-time stats about questions on the page
- **Multiple Question Types**: Support for word-input, multiple choice, drag-drop, and matching questions
- **Smart Detection**: Intelligently detects question types and input fields

## Installation

### For Development/Testing

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `VHLSolverExtension` folder
6. The extension is now installed and ready to use

### For Production

1. Package the extension as a `.crx` file
2. Submit to Chrome Web Store (pending approval)

## Usage

### Basic Usage

1. Navigate to a VHL page with questions
2. Click the VHL Solver extension icon in the Chrome toolbar
3. The popup will show available actions:
   - **📋 Get Questions**: Detects and lists all questions on the page
   - **⚡ Auto-Solve**: Attempts to automatically solve word-input problems
   - **✅ Submit Answers**: Submits all answers (finds and clicks submit button)

### Advanced Usage - Content Script API

If you want to use the extension programmatically, you can access the `VHLSolver` object directly in the console on VHL pages:

```javascript
// Get all questions on the page
const questions = VHLSolver.getAllQuestions();
console.log(questions);

// Get questions stats
const stats = VHLSolver.getQuestionStats();
console.log(stats);

// Solve a specific word-input question
const question = questions[0];
VHLSolver.solveWordInput(question, 'your_answer');

// Solve all word inputs with answers
VHLSolver.solveAllWordInputs(['answer1', 'answer2', 'answer3']);

// Auto-solve questions
const solved = VHLSolver.autoSolveWordInputs();
console.log(solved);

// Submit answers
VHLSolver.submitAnswers();
```

## File Structure

```
VHLSolverExtension/
├── manifest.json          # Chrome extension configuration
├── content-script.js      # Main solver logic (runs on VHL pages)
├── background.js          # Service worker for background tasks
├── popup.html             # Popup UI
├── popup.js               # Popup interactions
├── utils.js               # Utility helper functions
└── README.md              # This file
```

## Core Functions

### `VHLSolver.getAllQuestions()`
Returns an array of all questions found on the page with extracted data.

**Returns:**
```javascript
[
  {
    id: 0,
    text: "What is the verb form?",
    type: "word-input",
    inputFields: [
      {
        id: 0,
        element: HTMLInputElement,
        placeholder: "",
        value: ""
      }
    ],
    options: [],
    rawElement: HTMLElement
  },
  // ... more questions
]
```

### `VHLSolver.solveWordInput(question, answer)`
Solves a single word-input question by filling in the answer.

**Parameters:**
- `question`: Question object from `getAllQuestions()`
- `answer`: String or array of strings to fill in

**Returns:** Boolean indicating success

### `VHLSolver.solveAllWordInputs(answers)`
Solves multiple word-input questions with provided answers.

**Parameters:**
- `answers`: Array of answers corresponding to questions

**Returns:** Array of objects with solve results

### `VHLSolver.autoSolveWordInputs()`
Attempts to automatically solve word-input questions by extracting hints from question text.

**Returns:** Array of solved questions information

### `VHLSolver.getQuestionStats()`
Gets statistics about questions on the page.

**Returns:**
```javascript
{
  total: 10,
  byType: {
    "word-input": 7,
    "multiple-choice": 2,
    "drag-drop": 1
  },
  withAnswers: 2,
  empty: 8
}
```

### `VHLSolver.detectQuestionType(element)`
Determines the type of a question element.

**Returns:** One of:
- `"word-input"` - Text input field
- `"multiple-choice"` - Radio buttons or select
- `"drag-drop"` - Drag and drop interaction
- `"matching"` - Matching pairs
- `"unknown"` - Unknown type

### `VHLSolver.submitAnswers()`
Finds and clicks the submit button on the page.

**Returns:** Boolean indicating if submit button was found and clicked

## Utility Functions (utils.js)

### `VHLUtils.isValidWord(word)`
Validates if a string is a valid word format.

### `VHLUtils.calculateSimilarity(str1, str2)`
Calculates similarity between two words (0-1 scale).

### `VHLUtils.findBestMatch(input, options)`
Finds the best matching word from a list of options.

### `VHLUtils.isElementVisible(element)`
Checks if a DOM element is visible on the page.

## Supported Domains

- `vhlcentral.com`
- `*.vhlcentral.com`
- `*.vhlcampus.com`

## Permissions

- **scripting**: Allows injecting content scripts
- **activeTab**: Allows accessing current tab information
- **host_permissions**: Access to VHL domains for content injection

## Troubleshooting

### Extension not working on VHL page
1. Verify you're on a VHL domain (vhlcentral.com or vhlcampus.com)
2. Refresh the page (Ctrl/Cmd + R)
3. Check the browser console for errors (F12 → Console tab)

### Questions not being detected
1. VHL may have updated their DOM structure
2. Check the page structures in DevTools (F12)
3. Update the CSS selectors in `content-script.js` if needed

### Answers not being filled/submitted
1. Some questions may require manual matching
2. The submit button might have a different selector than expected
3. VHL may require CAPTCHA or additional verification

## Development

### Adding Support for New Question Types

1. Update `detectQuestionType()` in `content-script.js`
2. Add extraction logic in `extractQuestionData()`
3. Create solver logic if needed

### Debugging

1. Use `console.log()` or `console.table()` in content script
2. Open DevTools on VHL page: F12
3. Check Console tab for logs and errors
4. Use the `VHLSolver` object directly in console for testing

### Testing

1. Load the extension in developer mode
2. Navigate to a VHL page
3. Open DevTools (F12)
4. Use the content script API in the Console tab

## Limitations

- May not work on all VHL question types (especially custom implementations)
- If VHL updates their DOM structure, selectors may need updating
- Some security restrictions may prevent submission on certain pages
- Does not bypass CAPTCHA or other security measures

## Future Enhancements

- [ ] Machine learning for answer detection
- [ ] Dictionary integration for word validation
- [ ] Support for other language learning platforms
- [ ] Answer history and caching
- [ ] Custom settings and preferences
- [ ] Keyboard shortcuts
- [ ] Dark mode

## License

MIT License - Create, modify, and distribute freely

## Support

For issues or feature requests:
1. Check existing issues
2. Create a detailed bug report with:
   - VHL page URL
   - Question screenshot
   - Browser console errors
   - Steps to reproduce

## Disclaimer

This tool is for educational purposes. Use responsibly and in accordance with VHL's terms of service. The developer is not responsible for any consequences of using this extension.

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Developer:** VHL Solver Team
