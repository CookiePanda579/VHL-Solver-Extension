/**
 * VHL Solver Background Service Worker
 * Handles background tasks and communication between components
 */

// Import AI Solver (if using modules)
// import AISolver from './ai-solver.js';

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received:', request);
  
  // Handle AI solving requests
  if (request.action === 'aiSolve') {
    handleAISolve(request, sendResponse);
    return true;  // Will respond asynchronously
  }
  
  // Handle API key operations
  if (request.action === 'saveApiKey') {
    chrome.storage.local.set({ openrouterKey: request.key }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'getApiKey') {
    chrome.storage.local.get(['openrouterKey'], (result) => {
      sendResponse({ key: result.openrouterKey || null });
    });
    return true;
  }
  
  if (request.action === 'testApiKey') {
    testApiKey(request.key).then(success => {
      sendResponse({ success });
    });
    return true;
  }
  
  // Handle other actions
  switch (request.action) {
    case 'log':
      console.log('Content log:', request.message);
      sendResponse({ success: true });
      break;
    
    default:
      sendResponse({ error: 'Unknown action' });
  }
});

/**
 * Handle AI solving via OpenRouter
 */
async function handleAISolve(request, sendResponse) {
  try {
    const apiKey = await getStoredApiKey();
    
    if (!apiKey) {
      sendResponse({ 
        success: false, 
        error: 'OpenRouter API key not configured' 
      });
      return;
    }

    // Validate API key format
    if (!apiKey.startsWith('sk-') && !apiKey.includes('or-')) {
      sendResponse({ 
        success: false, 
        error: 'Invalid API key format' 
      });
      return;
    }

    const questions = request.questions || [];
    const model = request.model || 'gpt-3.5-turbo';

    // Input questions should already be filtered, but ensure we only process word-input
    const wordInputQuestions = questions.filter(q => 
      q.type === 'word-input' || q.type === 'fill-blank'
    );

    const results = {
      solved: [],
      unsolved: [],
      errors: []
    };

    if (wordInputQuestions.length === 0) {
      sendResponse({ success: true, results });
      return;
    }

    // Process questions in parallel with controlled concurrency
    // Process up to 3 questions simultaneously to balance speed and API limits
    const batchSize = 3;
    for (let i = 0; i < wordInputQuestions.length; i += batchSize) {
      const batch = wordInputQuestions.slice(i, i + batchSize);
      const promises = batch.map(question => 
        solveQuestionWithAI(question, apiKey, model)
          .then(answer => ({ question, answer, success: true, error: null }))
          .catch(error => ({ question, answer: null, success: false, error }))
      );

      try {
        const batchResults = await Promise.all(promises);
        
        // Process batch results
        batchResults.forEach(result => {
          if (result.success && result.answer) {
            results.solved.push({
              questionText: result.question.text,
              answer: result.answer,
              questionId: result.question.id
            });
          } else if (result.success && !result.answer) {
            results.unsolved.push({
              questionText: result.question.text,
              questionId: result.question.id
            });
          } else {
            results.errors.push({
              questionText: result.question.text,
              error: result.error?.message || 'Unknown error',
              questionId: result.question.id
            });
          }
        });

        // Small delay between batches (not between individual questions)
        if (i + batchSize < wordInputQuestions.length) {
          await delay(100);
        }
      } catch (error) {
        console.error('Batch processing error:', error);
        // Continue to next batch even if one fails
      }
    }

    sendResponse({ 
      success: true, 
      results: results 
    });

  } catch (error) {
    console.error('AI Solve error:', error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}

/**
 * Solve a single question using OpenRouter API
 */
async function solveQuestionWithAI(question, apiKey, model) {
  const prompt = buildPrompt(question);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://vhlsolver.extension',
        'X-Title': 'VHL Solver'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a Spanish language teacher helping students with VHL exercises. Provide accurate, concise answers to fill-in-the-blank questions. Reply with only the answer word or phrase, nothing else.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const answer = data.choices[0].message.content.trim();
      return answer;
    }

    return null;
  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    throw error;
  }
}

/**
 * Build prompt for the question
 */
function buildPrompt(question) {
  let text = question.text.trim();
  
  if (!text.includes('_') && !text.includes('[')) {
    text += '\n(Complete the above)';
  }

  return `Spanish learning question: ${text}`;
}

/**
 * Test if API key is valid
 */
async function testApiKey(apiKey) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://vhlsolver.extension',
        'X-Title': 'VHL Solver'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 10
      })
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Get stored API key from storage
 */
function getStoredApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['openrouterKey'], (result) => {
      resolve(result.openrouterKey || null);
    });
  });
}

/**
 * Utility to delay execution
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle tab changes
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log('Tab activated:', activeInfo.tabId);
});
