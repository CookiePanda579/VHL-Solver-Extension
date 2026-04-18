/**
 * VHL Solver - API Documentation and Examples
 * 
 * This file provides comprehensive examples and documentation for using
 * the VHL Solver Chrome Extension API.
 */

// ============================================================================
// SECTION 1: BASIC QUESTION EXTRACTION
// ============================================================================

/**
 * Example 1: Get all questions from the page
 */
function example_getAllQuestions() {
  const questions = VHLSolver.getAllQuestions();
  
  console.log(`Found ${questions.length} questions`);
  
  questions.forEach((q, index) => {
    console.log(`\nQuestion ${index + 1}:`);
    console.log(`  Type: ${q.type}`);
    console.log(`  Text: ${q.text}`);
    console.log(`  Input fields: ${q.inputFields.length}`);
  });
  
  return questions;
}

/**
 * Example 2: Filter questions by type
 */
function example_getQuestionsByType(type) {
  const allQuestions = VHLSolver.getAllQuestions();
  return allQuestions.filter(q => q.type === type);
}

// Usage:
// const wordInputQuestions = example_getQuestionsByType('word-input');
// const multipleChoice = example_getQuestionsByType('multiple-choice');

/**
 * Example 3: Get question statistics
 */
function example_getStats() {
  const stats = VHLSolver.getQuestionStats();
  
  console.log(`Total Questions: ${stats.total}`);
  console.log(`With Answers: ${stats.withAnswers}`);
  console.log(`Empty: ${stats.empty}`);
  
  console.log('\nQuestions by Type:');
  for (const [type, count] of Object.entries(stats.byType)) {
    console.log(`  ${type}: ${count}`);
  }
  
  return stats;
}

// ============================================================================
// SECTION 2: SOLVING WORD-INPUT QUESTIONS
// ============================================================================

/**
 * Example 4: Solve a single question
 */
function example_solveSingleQuestion(questionIndex, answer) {
  const questions = VHLSolver.getAllQuestions();
  const question = questions[questionIndex];
  
  if (!question) {
    console.error(`Question ${questionIndex} not found`);
    return false;
  }
  
  const success = VHLSolver.solveWordInput(question, answer);
  
  if (success) {
    console.log(`Successfully solved question ${questionIndex}: ${answer}`);
  } else {
    console.log(`Failed to solve question ${questionIndex}`);
  }
  
  return success;
}

// Usage:
// example_solveSingleQuestion(0, 'mi');  // Fill first question with 'mi'

/**
 * Example 5: Solve multiple questions with an array of answers
 */
function example_solveMultipleQuestions(answers) {
  const results = VHLSolver.solveAllWordInputs(answers);
  
  console.log(`Attempted to solve ${results.length} questions:`);
  
  results.forEach(result => {
    const status = result.solved ? '✓' : '✗';
    console.log(`  ${status} Question ${result.questionIndex}: "${result.answer}"`);
  });
  
  return results;
}

// Usage:
// const answers = ['mi', 'tu', 'su', 'nuestro'];
// example_solveMultipleQuestions(answers);

/**
 * Example 6: Auto-solve questions (extracts hints from question text)
 */
function example_autoSolveQuestions() {
  const solved = VHLSolver.autoSolveWordInputs();
  
  console.log(`Auto-solved ${solved.length} questions:`);
  
  solved.forEach(item => {
    console.log(`  Question: ${item.questionText}`);
    console.log(`  Answer: ${item.hint}`);
  });
  
  return solved;
}

// ============================================================================
// SECTION 3: ADVANCED QUESTION ANALYSIS
// ============================================================================

/**
 * Example 7: Analyze question structure
 */
function example_analyzeQuestion(questionIndex) {
  const questions = VHLSolver.getAllQuestions();
  const question = questions[questionIndex];
  
  if (!question) return null;
  
  console.log('===== QUESTION ANALYSIS =====');
  console.log(`Index: ${question.id}`);
  console.log(`Type: ${question.type}`);
  console.log(`Text: ${question.text}`);
  
  if (question.inputFields.length > 0) {
    console.log('\nInput Fields:');
    question.inputFields.forEach((field, i) => {
      console.log(`  Field ${i}:`);
      console.log(`    Placeholder: "${field.placeholder}"`);
      console.log(`    Current Value: "${field.value}"`);
      console.log(`    Tag: ${field.element.tagName}`);
    });
  }
  
  if (question.options.length > 0) {
    console.log('\nOptions:');
    question.options.forEach((opt, i) => {
      console.log(`  ${i}: ${opt.text}`);
    });
  }
  
  return question;
}

/**
 * Example 8: Get all word-input questions ready to solve
 */
function example_getReadyToSolveQuestions() {
  const questions = VHLSolver.getAllQuestions();
  
  const readyToSolve = questions.filter(q => {
    return q.type === 'word-input' && 
           q.inputFields.length > 0 && 
           q.inputFields.every(f => !f.value);
  });
  
  console.log(`${readyToSolve.length} questions ready to solve`);
  
  return readyToSolve;
}

/**
 * Example 9: Extract all question texts
 */
function example_extractAllQuestionTexts() {
  const questions = VHLSolver.getAllQuestions();
  
  const texts = questions.map(q => ({
    text: q.text,
    type: q.type
  }));
  
  console.table(texts);
  return texts;
}

// ============================================================================
// SECTION 4: FORM SUBMISSION
// ============================================================================

/**
 * Example 10: Submit answers
 */
function example_submitAnswers() {
  const success = VHLSolver.submitAnswers();
  
  if (success) {
    console.log('✓ Submit button found and clicked');
  } else {
    console.log('✗ Could not find submit button');
  }
  
  return success;
}

/**
 * Example 11: Solve and submit (workflow)
 */
async function example_solveAndSubmit(answers) {
  console.log('Step 1: Solving questions...');
  const results = VHLSolver.solveAllWordInputs(answers);
  console.log(`  Solved ${results.filter(r => r.solved).length} of ${results.length}`);
  
  // Wait a moment for DOM to update
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('Step 2: Submitting answers...');
  const submitted = VHLSolver.submitAnswers();
  
  if (submitted) {
    console.log('✓ Workflow complete!');
  } else {
    console.log('✗ Could not complete workflow');
  }
  
  return submitted;
}

// Usage:
// example_solveAndSubmit(['answer1', 'answer2', 'answer3']);

// ============================================================================
// SECTION 5: COMMUNICATION WITH EXTENSION
// ============================================================================

/**
 * Example 12: Send message to extension popup
 */
function example_messageExtension() {
  chrome.runtime.sendMessage(
    { action: 'log', message: 'Test message from page' },
    response => {
      if (response && response.success) {
        console.log('Message sent to background');
      }
    }
  );
}

/**
 * Example 13: Listen to messages from extension
 */
function example_setupMessageListener() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'solveQuestions') {
      console.log('Extension requested solving:', request.answers);
      const results = VHLSolver.solveAllWordInputs(request.answers);
      sendResponse({ success: true, results });
    }
  });
}

// ============================================================================
// SECTION 6: UTILITY FUNCTIONS USAGE
// ============================================================================

/**
 * Example 14: Use VHLUtils for word validation
 */
function example_validateWords() {
  const words = ['casa', 'el', 'x', 'español', '123'];
  
  console.log('Word Validation:');
  words.forEach(word => {
    const isValid = VHLUtils.isValidWord(word);
    console.log(`  "${word}": ${isValid ? '✓' : '✗'}`);
  });
}

/**
 * Example 15: Calculate word similarity
 */
function example_checkSimilarity() {
  const pairs = [
    ['casa', 'casas'],
    ['ir', 'va'],
    ['ser', 'está']
  ];
  
  console.log('Word Similarity:');
  pairs.forEach(([word1, word2]) => {
    const similarity = VHLUtils.calculateSimilarity(word1, word2);
    const percent = (similarity * 100).toFixed(0);
    console.log(`  "${word1}" vs "${word2}": ${percent}%`);
  });
}

/**
 * Example 16: Find best matching word
 */
function example_findBestWord() {
  const input = 'estava';  // Misspelled
  const options = ['está', 'estaba', 'estaré', 'estado'];
  
  const result = VHLUtils.findBestMatch(input, options);
  console.log(`Best match for "${input}": "${result.word}" (${(result.score * 100).toFixed(0)}%)`);
}

// ============================================================================
// SECTION 7: COMPLETE WORKFLOW EXAMPLES
// ============================================================================

/**
 * Example 17: Complete inspection and solve workflow
 */
function example_completeWorkflow() {
  console.log('=== VHL SOLVER WORKFLOW ===\n');
  
  // Step 1: Analyze page
  console.log('STEP 1: Analyzing page...');
  const stats = VHLSolver.getQuestionStats();
  console.log(`  Found ${stats.total} total questions`);
  
  // Step 2: Get questions
  console.log('\nSTEP 2: Extracting questions...');
  const questions = VHLSolver.getAllQuestions();
  const wordInputQuestions = questions.filter(q => q.type === 'word-input');
  console.log(`  Found ${wordInputQuestions.length} word-input questions`);
  
  // Step 3: Display questions
  console.log('\nSTEP 3: Available questions:');
  questions.forEach((q, i) => {
    console.log(`  ${i + 1}. [${q.type}] ${q.text.substring(0, 50)}...`);
  });
  
  // Step 4: Ready to solve
  console.log('\nREADY: Use VHLSolver.solveAllWordInputs(answers) to solve');
  console.log('Example: VHLSolver.solveAllWordInputs(["answer1", "answer2"])');
}

/**
 * Example 18: Batch solve and monitor
 */
function example_batchSolveMonitor(answersArray, interval = 500) {
  console.log('Starting batch solve with monitoring...');
  
  let index = 0;
  
  function solveNext() {
    if (index >= answersArray.length) {
      console.log('✓ All questions solved!');
      return;
    }
    
    const answer = answersArray[index];
    const questions = VHLSolver.getAllQuestions();
    const question = questions[index];
    
    if (question && question.type === 'word-input') {
      VHLSolver.solveWordInput(question, answer);
      console.log(`  [${index + 1}/${answersArray.length}] Solved: "${answer}"`);
    }
    
    index++;
    setTimeout(solveNext, interval);
  }
  
  solveNext();
}

// ============================================================================
// SECTION 8: DEBUGGING UTILITIES
// ============================================================================

/**
 * Example 19: Debug question structure
 */
function example_debugQuestions() {
  console.log('===== DEBUG INFO =====\n');
  
  const questions = VHLSolver.getAllQuestions();
  console.log(`Total Questions: ${questions.length}\n`);
  
  questions.forEach((q, i) => {
    console.group(`Question ${i + 1}`);
    console.log('Type:', q.type);
    console.log('Text:', q.text);
    console.log('Input Fields:', q.inputFields.length);
    console.log('Options:', q.options.length);
    console.log('Element HTML:', q.rawElement.outerHTML.substring(0, 100));
    console.groupEnd();
  });
}

/**
 * Example 20: Export questions as JSON
 */
function example_exportQuestionsJSON() {
  const questions = VHLSolver.getAllQuestions();
  
  const exported = questions.map(q => ({
    id: q.id,
    text: q.text,
    type: q.type,
    inputCount: q.inputFields.length,
    optionCount: q.options.length
  }));
  
  const json = JSON.stringify(exported, null, 2);
  console.log(json);
  
  // Copy to clipboard
  navigator.clipboard.writeText(json);
  console.log('✓ Copied to clipboard');
  
  return json;
}

// ============================================================================
// QUICK START GUIDE
// ============================================================================

/**
 * Quick start - run this to get started quickly
 */
function quickStart() {
  console.log('%c=== VHL SOLVER QUICK START ===', 'font-size: 16px; font-weight: bold;');
  
  // 1. Check if extension is loaded
  if (!window.VHLSolver) {
    console.error('❌ VHL Solver not loaded! Make sure you\'re on a VHL page.');
    return;
  }
  
  console.log('\n✓ VHL Solver is ready!\n');
  
  // 2. Get stats
  const stats = VHLSolver.getQuestionStats();
  console.log(`📊 Found ${stats.total} questions`);
  console.log(`   - Word Input: ${stats.byType['word-input'] || 0}`);
  console.log(`   - Multiple Choice: ${stats.byType['multiple-choice'] || 0}`);
  
  // 3. Show example questions
  console.log('\n📋 Example questions:');
  const questions = VHLSolver.getAllQuestions().slice(0, 3);
  questions.forEach((q, i) => {
    console.log(`   ${i + 1}. ${q.text.substring(0, 40)}...`);
  });
  
  // 4. Show next steps
  console.log('\n%c📝 Next Steps:', 'font-weight: bold;');
  console.log('   1. Run: const q = VHLSolver.getAllQuestions()');
  console.log('   2. Run: VHLSolver.solveAllWordInputs(["answer1", "answer2"])');
  console.log('   3. Run: VHLSolver.submitAnswers()');
  
  console.log('\n%c💡 More Examples:', 'font-weight: bold;');
  console.log('   - See API_EXAMPLES.js for 20+ complete examples');
  console.log('   - Documentation: README.md');
}

// Run quick start automatically when loaded in console
// quickStart();
