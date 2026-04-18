/**
 * VHL Solver Popup Script
 * Handles UI interactions and communicates with content script
 */

// DOM elements
const getQuestionsBtn = document.getElementById('getQuestionsBtn');
const autoSolveBtn = document.getElementById('autoSolveBtn');
const aiSolveBtn = document.getElementById('aiSolveBtn');
const submitBtn = document.getElementById('submitBtn');
const statusText = document.getElementById('statusText');
const messageDiv = document.getElementById('message');
const statsContainer = document.getElementById('statsContainer');
const statsContent = document.getElementById('statsContent');

// Settings elements
const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
const apiKeyInput = document.getElementById('apiKeyInput');
const modelSelect = document.getElementById('modelSelect');
const testKeyBtn = document.getElementById('testKeyBtn');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const clearKeyBtn = document.getElementById('clearKeyBtn');
const keyStatus = document.getElementById('keyStatus');

// Helper function to show messages
function showMessage(text, type = 'info') {
  messageDiv.textContent = text;
  messageDiv.className = `message show ${type}`;
  
  setTimeout(() => {
    messageDiv.classList.remove('show');
  }, 4000);
}

// Helper function to update status
function updateStatus(text) {
  statusText.textContent = text;
}

// Helper function to display stats
function displayStats(stats) {
  if (!stats) return;
  
  let html = '';
  html += `<div class="stat-row">
    <span class="stat-label">Total Questions:</span>
    <span class="stat-value">${stats.total}</span>
  </div>`;
  
  html += `<div class="stat-row">
    <span class="stat-label">With Answers:</span>
    <span class="stat-value">${stats.withAnswers}</span>
  </div>`;
  
  html += `<div class="stat-row">
    <span class="stat-label">Empty:</span>
    <span class="stat-value">${stats.empty}</span>
  </div>`;
  
  for (const [type, count] of Object.entries(stats.byType)) {
    html += `<div class="stat-row">
      <span class="stat-label">${type}:</span>
      <span class="stat-value">${count}</span>
    </div>`;
  }
  
  statsContent.innerHTML = html;
  statsContainer.style.display = 'block';
}

// Get current active tab
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Send message to content script
async function sendToContentScript(message) {
  const tab = await getCurrentTab();
  
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// Send message to background script
async function sendToBackground(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// ============================================================================
// SETTINGS MANAGEMENT
// ============================================================================

// Toggle settings panel
settingsToggle.addEventListener('click', () => {
  settingsPanel.classList.toggle('show');
  loadStoredSettings();
});

// Load stored settings
async function loadStoredSettings() {
  try {
    const response = await sendToBackground({ action: 'getApiKey' });
    if (response && response.key) {
      apiKeyInput.value = response.key;
      showKeyStatus('Key loaded ✓', 'valid');
    } else {
      apiKeyInput.value = '';
      keyStatus.classList.remove('show');
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Show key status
function showKeyStatus(message, type) {
  keyStatus.textContent = message;
  keyStatus.className = `key-status show ${type}`;
}

// Save API key
saveKeyBtn.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  
  if (!key) {
    showMessage('Please enter an API key', 'error');
    return;
  }

  if (!key.startsWith('sk-') && !key.includes('or-')) {
    showMessage('Invalid API key format. Should start with "sk-" or contain "or-"', 'error');
    return;
  }

  try {
    saveKeyBtn.disabled = true;
    updateStatus('Saving key...');
    
    const response = await sendToBackground({ 
      action: 'saveApiKey', 
      key: key 
    });
    
    if (response && response.success) {
      showMessage('API key saved successfully!', 'success');
      showKeyStatus('Key saved ✓', 'valid');
      updateStatus('Ready');
    }
  } catch (error) {
    showMessage(`Error saving key: ${error.message}`, 'error');
    updateStatus('Error');
  } finally {
    saveKeyBtn.disabled = false;
  }
});

// Test API key
testKeyBtn.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  
  if (!key) {
    showMessage('Please enter an API key first', 'error');
    return;
  }

  try {
    testKeyBtn.disabled = true;
    updateStatus('Testing API key...');
    
    const response = await sendToBackground({ 
      action: 'testApiKey', 
      key: key 
    });
    
    if (response && response.success) {
      showMessage('API key is valid! ✓', 'success');
      showKeyStatus('Valid API key ✓', 'valid');
      updateStatus('Ready');
    } else {
      showMessage('API key test failed. Check your key.', 'error');
      showKeyStatus('Invalid API key', 'invalid');
      updateStatus('Invalid key');
    }
  } catch (error) {
    showMessage(`Error testing key: ${error.message}`, 'error');
    updateStatus('Error');
  } finally {
    testKeyBtn.disabled = false;
  }
});

// Clear API key
clearKeyBtn.addEventListener('click', async () => {
  try {
    clearKeyBtn.disabled = true;
    await sendToBackground({ action: 'saveApiKey', key: '' });
    
    apiKeyInput.value = '';
    keyStatus.classList.remove('show');
    showMessage('API key cleared', 'info');
    updateStatus('Ready');
  } catch (error) {
    showMessage(`Error clearing key: ${error.message}`, 'error');
  } finally {
    clearKeyBtn.disabled = false;
  }
});

// ============================================================================
// QUESTION SOLVING
// ============================================================================

// Get all questions from the page
getQuestionsBtn.addEventListener('click', async () => {
  try {
    updateStatus('Loading questions...');
    getQuestionsBtn.disabled = true;
    
    const response = await sendToContentScript({ action: 'getQuestions' });
    
    if (response.questions && response.questions.length > 0) {
      displayStats({
        total: response.questions.length,
        withAnswers: 0,
        empty: response.questions.length,
        byType: response.questions.reduce((acc, q) => {
          acc[q.type] = (acc[q.type] || 0) + 1;
          return acc;
        }, {})
      });
      
      updateStatus(`Found ${response.questions.length} questions`);
      showMessage(`Found ${response.questions.length} questions on this page`, 'info');
      
      console.log('Questions:', response.questions);
    } else {
      updateStatus('No questions found');
      showMessage('No questions found on this page', 'error');
    }
  } catch (error) {
    updateStatus('Error loading questions');
    showMessage(`Error: ${error.message}`, 'error');
    console.error('Error:', error);
  } finally {
    getQuestionsBtn.disabled = false;
  }
});

// Auto-solve word input questions
autoSolveBtn.addEventListener('click', async () => {
  try {
    updateStatus('Auto-solving questions...');
    autoSolveBtn.disabled = true;
    
    const response = await sendToContentScript({ action: 'autoSolve' });
    
    if (response.solved && response.solved.length > 0) {
      updateStatus(`Solved ${response.solved.length} questions`);
      showMessage(`Successfully solved ${response.solved.length} questions!`, 'success');
      
      console.log('Solved:', response.solved);
    } else {
      updateStatus('No solvable questions found');
      showMessage('Could not find solvable questions', 'info');
    }
  } catch (error) {
    updateStatus('Error solving questions');
    showMessage(`Error: ${error.message}`, 'error');
    console.error('Error:', error);
  } finally {
    autoSolveBtn.disabled = false;
  }
});

// AI Solve questions
aiSolveBtn.addEventListener('click', async () => {
  try {
    // First check if API key is configured
    const keyResponse = await sendToBackground({ action: 'getApiKey' });
    if (!keyResponse || !keyResponse.key) {
      showMessage('Please add your OpenRouter API key in Settings first', 'error');
      settingsPanel.classList.add('show');
      return;
    }

    updateStatus('AI Solving questions...');
    aiSolveBtn.disabled = true;
    
    // Get questions from content script
    const questionsResponse = await sendToContentScript({ action: 'getQuestions' });
    
    if (!questionsResponse.questions || questionsResponse.questions.length === 0) {
      showMessage('No questions found on this page', 'error');
      updateStatus('No questions found');
      return;
    }

    // Send to background for AI solving
    const aiResponse = await sendToBackground({
      action: 'aiSolve',
      questions: questionsResponse.questions,
      model: modelSelect.value
    });

    if (!aiResponse.success) {
      showMessage(`AI Error: ${aiResponse.error}`, 'error');
      updateStatus('AI Solve failed');
      return;
    }

    // Now fill the answers in the content script
    const fillResponse = await sendToContentScript({
      action: 'aiSolveResponse',
      results: aiResponse.results
    });

    if (fillResponse.success && fillResponse.filled.length > 0) {
      updateStatus(`AI solved and filled ${fillResponse.filled.length} questions`);
      showMessage(`✓ AI solved and filled ${fillResponse.filled.length} questions!`, 'success');
      
      console.log('AI Solutions:', aiResponse.results);
      console.log('Filled answers:', fillResponse.filled);
    } else {
      const solved = aiResponse.results?.solved?.length || 0;
      const errors = aiResponse.results?.errors?.length || 0;
      updateStatus(`AI completed: ${solved} solved, ${errors} errors`);
      showMessage(`AI processing complete (${solved} solved, ${errors} errors)`, 'info');
    }

  } catch (error) {
    updateStatus('AI Solve error');
    showMessage(`Error: ${error.message}`, 'error');
    console.error('Error:', error);
  } finally {
    aiSolveBtn.disabled = false;
  }
});

// Submit answers
submitBtn.addEventListener('click', async () => {
  try {
    updateStatus('Submitting answers...');
    submitBtn.disabled = true;
    
    const response = await sendToContentScript({ action: 'submitAnswers' });
    
    if (response.success) {
      updateStatus('Answers submitted!');
      showMessage('Answers submitted successfully!', 'success');
    } else {
      updateStatus('Could not find submit button');
      showMessage('Could not find submit button on this page', 'error');
    }
  } catch (error) {
    updateStatus('Error submitting answers');
    showMessage(`Error: ${error.message}`, 'error');
    console.error('Error:', error);
  } finally {
    submitBtn.disabled = false;
  }
});

// Load stats on popup open
(async () => {
  try {
    updateStatus('Initializing...');
    const response = await sendToContentScript({ action: 'getStats' });
    if (response.stats) {
      displayStats(response.stats);
      updateStatus('Ready');
    }
  } catch (error) {
    console.log('Content script not available on this page');
    updateStatus('Not on a VHL page');
  }
})();
