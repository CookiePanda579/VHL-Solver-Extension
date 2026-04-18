/**
 * VHL Solver Content Script
 * Runs on VHL pages to extract and solve word-input problems
 */

// Main object containing all solver functionality
const VHLSolver = {
  // Get all INPUT BOX questions from the current page (word-input/fill-blank only)
  // This function returns ONLY questions with text input fields, filtering out:
  // - Multiple choice questions
  // - Drag-and-drop questions  
  // - Matching questions
  // - Other non-input question types
  getAllQuestions() {
    const questions = [];
    
    // Look for common VHL question containers
    const questionElements = document.querySelectorAll(
      '[data-reactroot] .question-block, ' +
      '.activity-item, ' +
      '[class*="question"], ' +
      '[id*="question"]'
    );

    questionElements.forEach((element, index) => {
      const question = this.extractQuestionData(element, index);
      // Only include word-input type questions (input boxes)
      if (question && (question.type === 'word-input' || question.type === 'fill-blank')) {
        questions.push(question);
      }
    });

    return questions;
  },

  // Extract structured data from a single question element
  extractQuestionData(element, index) {
    const question = {
      id: index,
      text: '',
      type: '',
      inputFields: [],
      options: [],
      rawElement: element
    };

    // Get question text
    const textElement = element.querySelector(
      '[class*="question-text"], ' +
      '[class*="prompt"], ' +
      'p, ' +
      'h3, ' +
      'h4'
    );
    
    if (textElement) {
      question.text = textElement.textContent.trim();
    }

    // Detect question type
    question.type = this.detectQuestionType(element);

    // Get input fields for fill-in-the-blank
    if (question.type === 'word-input' || question.type === 'fill-blank') {
      const inputs = element.querySelectorAll(
        'input[type="text"], ' +
        'textarea, ' +
        '[contenteditable="true"]'
      );
      
      inputs.forEach((input, idx) => {
        question.inputFields.push({
          id: idx,
          element: input,
          placeholder: input.placeholder || '',
          value: input.value || ''
        });
      });
    }

    // Get multiple choice options
    if (question.type === 'multiple-choice') {
      const options = element.querySelectorAll(
        'label, ' +
        '[role="option"], ' +
        '[class*="choice"], ' +
        '[class*="option"]'
      );
      
      options.forEach((opt, idx) => {
        question.options.push({
          id: idx,
          text: opt.textContent.trim(),
          element: opt
        });
      });
    }

    return question.text ? question : null;
  },

  // Detect the type of question
  detectQuestionType(element) {
    const html = element.innerHTML.toLowerCase();
    
    if (element.querySelector('input[type="text"]') || 
        element.querySelector('textarea') ||
        element.querySelector('[contenteditable="true"]')) {
      return 'word-input';
    }
    
    if (element.querySelector('input[type="radio"]') || 
        element.querySelector('input[type="checkbox"]')) {
      return 'multiple-choice';
    }
    
    if (html.includes('drag') || html.includes('drop')) {
      return 'drag-drop';
    }
    
    if (html.includes('match') || element.querySelector('[class*="match"]')) {
      return 'matching';
    }
    
    return 'unknown';
  },

  // Solve a specific word-input question
  solveWordInput(question, answer) {
    if (!question.inputFields || question.inputFields.length === 0) {
      console.warn('No input fields found in question');
      return false;
    }

    let success = false;
    
    question.inputFields.forEach((field, index) => {
      const input = field.element;
      const answerText = Array.isArray(answer) ? answer[index] : answer;

      if (input && answerText) {
        // Handle different input types
        if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
          input.value = answerText;
          // Trigger input events to notify React/Vue
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          success = true;
        } else if (input.contentEditable === 'true') {
          input.textContent = answerText;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          success = true;
        }
      }
    });

    return success;
  },

  // Solve all word-input questions with provided answers
  solveAllWordInputs(answers) {
    const questions = this.getAllQuestions();
    const results = [];

    questions.forEach((question, index) => {
      if (question.type === 'word-input' || question.type === 'fill-blank') {
        const answer = answers[index];
        if (answer) {
          const success = this.solveWordInput(question, answer);
          results.push({
            questionIndex: index,
            solved: success,
            answer: answer
          });
        }
      }
    });

    return results;
  },

  // Auto-fill all available word-input questions
  autoSolveWordInputs() {
    const questions = this.getAllQuestions();
    const solvedQuestions = [];

    questions.forEach((question) => {
      if (question.type === 'word-input' || question.type === 'fill-blank') {
        // Try to extract hint from question text
        const hint = this.extractAnswerHint(question.text);
        if (hint) {
          this.solveWordInput(question, hint);
          solvedQuestions.push({
            questionText: question.text,
            hint: hint
          });
        }
      }
    });

    return solvedQuestions;
  },

  // Try to extract answer hints from question text
  extractAnswerHint(questionText) {
    // Look for patterns like "Complete: _____" or "Fill in: _____"
    const patterns = [
      /(?:Complete|Fill in|Provide|Enter):\s*([^\.\?]+)/i,
      /\(([^\)]+)\)/,
      /\[([^\]]+)\]/,
    ];

    for (let pattern of patterns) {
      const match = questionText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  },

  // Submit all answers on the page
  submitAnswers() {
    const submitButton = document.querySelector(
      'button[type="submit"], ' +
      '[class*="submit"], ' +
      '[class*="check"], ' +
      'button:contains("Submit"), ' +
      'button:contains("Check")'
    );

    if (submitButton) {
      submitButton.click();
      return true;
    }

    return false;
  },

  // Get question statistics
  getQuestionStats() {
    const questions = this.getAllQuestions();
    const stats = {
      total: questions.length,
      byType: {},
      withAnswers: 0,
      empty: 0
    };

    questions.forEach((q) => {
      stats.byType[q.type] = (stats.byType[q.type] || 0) + 1;
      
      if (q.inputFields && q.inputFields.some(f => f.value)) {
        stats.withAnswers++;
      } else {
        stats.empty++;
      }
    });

    return stats;
  }
};

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getQuestions':
      sendResponse({ questions: VHLSolver.getAllQuestions() });
      break;
    
    case 'solveWordInputs':
      const results = VHLSolver.solveAllWordInputs(request.answers);
      sendResponse({ success: true, results: results });
      break;
    
    case 'autoSolve':
      const autoResults = VHLSolver.autoSolveWordInputs();
      sendResponse({ success: true, solved: autoResults });
      break;
    
    case 'aiSolveResponse':
      // Handle AI solve results from background script
      handleAISolveResponse(request.results, sendResponse);
      break;
    
    case 'submitAnswers':
      const submitted = VHLSolver.submitAnswers();
      sendResponse({ success: submitted });
      break;
    
    case 'getStats':
      sendResponse({ stats: VHLSolver.getQuestionStats() });
      break;
    
    default:
      sendResponse({ error: 'Unknown action' });
  }
});

/**
 * Handle AI solve results by filling answers into the page
 */
function handleAISolveResponse(results, sendResponse) {
  const questions = VHLSolver.getAllQuestions();
  const fillResults = [];

  if (results.solved && results.solved.length > 0) {
    results.solved.forEach((solvedItem) => {
      // Find matching question by text
      const matchingQuestion = questions.find(q => 
        q.text === solvedItem.questionText
      );

      if (matchingQuestion) {
        const success = VHLSolver.solveWordInput(matchingQuestion, solvedItem.answer);
        fillResults.push({
          text: solvedItem.questionText,
          answer: solvedItem.answer,
          filled: success
        });
      }
    });
  }

  sendResponse({ 
    success: true, 
    filled: fillResults,
    errors: results.errors || [],
    unsolved: results.unsolved || []
  });
}

// Make VHLSolver available in console for debugging
window.VHLSolver = VHLSolver;

console.log('VHL Solver content script loaded');
