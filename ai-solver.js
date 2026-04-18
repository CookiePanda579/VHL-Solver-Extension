/**
 * VHL Solver - AI Solver Module
 * Integrates with OpenRouter API to solve questions using AI models
 */

const AISolver = {
  // OpenRouter API configuration
  apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
  
  /**
   * Get stored API key from Chrome storage
   */
  async getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['openrouterKey'], (result) => {
        resolve(result.openrouterKey || null);
      });
    });
  },

  /**
   * Save API key to Chrome storage
   */
  async saveApiKey(key) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ openrouterKey: key }, () => {
        resolve(true);
      });
    });
  },

  /**
   * Check if API key is configured
   */
  async hasApiKey() {
    const key = await this.getApiKey();
    return !!key;
  },

  /**
   * Solve questions using OpenRouter AI
   * @param {Array} questions - Array of question objects from getAllQuestions()
   * @param {Object} options - Configuration options
   * @returns {Object} - Results with solved answers
   */
  async solveQuestions(questions, options = {}) {
    const apiKey = await this.getApiKey();
    
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured. Please add your key in settings.');
    }

    const model = options.model || 'gpt-3.5-turbo';  // Default model
    const results = {
      solved: [],
      unsolved: [],
      errors: []
    };

    // Filter only word-input questions
    const wordInputQuestions = questions.filter(q => 
      q.type === 'word-input' || q.type === 'fill-blank'
    );

    if (wordInputQuestions.length === 0) {
      return results;
    }

    try {
      for (const question of wordInputQuestions) {
        try {
          const answer = await this.solveQuestion(question, apiKey, model);
          
          if (answer) {
            results.solved.push({
              questionText: question.text,
              answer: answer,
              successful: true
            });
          } else {
            results.unsolved.push({
              questionText: question.text,
              reason: 'No answer generated'
            });
          }
        } catch (error) {
          results.errors.push({
            questionText: question.text,
            error: error.message
          });
        }

        // Rate limiting - small delay between API calls
        await this.delay(500);
      }
    } catch (error) {
      throw new Error(`AI Solver error: ${error.message}`);
    }

    return results;
  },

  /**
   * Solve a single question using OpenRouter
   */
  async solveQuestion(question, apiKey, model) {
    const prompt = this.buildPrompt(question);

    try {
      const response = await fetch(this.apiUrl, {
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
          temperature: 0.3,  // Lower temperature for more deterministic answers
          max_tokens: 50     // Keep answers short
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
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
  },

  /**
   * Build a prompt for the question
   */
  buildPrompt(question) {
    // Extract the actual question text, removing extra whitespace
    let text = question.text.trim();
    
    // If there are placeholders or blanks, indicate them
    if (!text.includes('_') && !text.includes('[')) {
      text += '\n(Complete the above)';
    }

    return `Spanish learning question: ${text}`;
  },

  /**
   * Utility to delay execution (for rate limiting)
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Get available models from OpenRouter
   */
  async getAvailableModels(apiKey) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  },

  /**
   * Test API key validity
   */
  async testApiKey(apiKey) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://vhlsolver.extension',
          'X-Title': 'VHL Solver'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: 'Say "OK"'
            }
          ],
          max_tokens: 10
        })
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.AISolver = AISolver;
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AISolver;
}
