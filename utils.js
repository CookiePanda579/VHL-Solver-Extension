/**
 * VHL Solver Utilities
 * Helper functions for word detection, validation, and processing
 */

const VHLUtils = {
  /**
   * Common Spanish words for word-input problems (useful for auto-detection)
   */
  commonWords: {
    articles: ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas'],
    pronouns: ['yo', 'tú', 'él', 'ella', 'nosotros', 'vosotros', 'ellos', 'ellas'],
    prepositions: ['a', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'desde', 'durante', 'en', 'entre', 'hacia', 'hasta', 'para', 'por', 'según', 'sin', 'sobre', 'tras'],
    verbs: {
      ser: ['soy', 'eres', 'es', 'somos', 'sois', 'son'],
      estar: ['estoy', 'estás', 'está', 'estamos', 'estáis', 'están'],
      tener: ['tengo', 'tienes', 'tiene', 'tenemos', 'tenéis', 'tienen'],
      hacer: ['hago', 'haces', 'hace', 'hacemos', 'hacéis', 'hacen']
    }
  },

  /**
   * Extract potential Spanish words from question text
   */
  extractPotentialWords(text) {
    const words = text.match(/\b[á-ÿA-Zá-ÿ]+\b/g) || [];
    return words.filter(w => w.length > 2).map(w => w.toLowerCase());
  },

  /**
   * Validate if input is likely a valid word
   */
  isValidWord(word) {
    if (!word || typeof word !== 'string') return false;
    
    const trimmed = word.trim();
    
    // Must have at least 2 characters
    if (trimmed.length < 2) return false;
    
    // Should contain only letters (and accents)
    if (!/^[a-záéíóúñ\s'-]+$/i.test(trimmed)) return false;
    
    return true;
  },

  /**
   * Normalize word (remove accents, lowercase)
   */
  normalizeWord(word) {
    if (!word) return '';
    
    return word
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  },

  /**
   * Similarity check between two words (Levenshtein distance)
   */
  calculateSimilarity(str1, str2) {
    const s1 = this.normalizeWord(str1);
    const s2 = this.normalizeWord(str2);
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  },

  /**
   * Calculate Levenshtein distance
   */
  levenshteinDistance(s1, s2) {
    const costs = [];
    
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    
    return costs[s2.length];
  },

  /**
   * Find best matching word from options
   */
  findBestMatch(input, options) {
    let best = null;
    let bestScore = 0;
    
    options.forEach(option => {
      const score = this.calculateSimilarity(input, option);
      if (score > bestScore) {
        bestScore = score;
        best = option;
      }
    });
    
    return { word: best, score: bestScore };
  },

  /**
   * Extract verb conjugation hints from question
   */
  extractVerbHint(questionText) {
    const verbPatterns = [
      /conjugate\s+(\w+)/i,
      /form of\s+(\w+)/i,
      /verb\s+(\w+)/i
    ];
    
    for (let pattern of verbPatterns) {
      const match = questionText.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  },

  /**
   * Validate form element is interactive
   */
  isInteractiveElement(element) {
    if (!element) return false;
    
    const interactiveElements = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'];
    if (interactiveElements.includes(element.tagName)) return true;
    
    if (element.contentEditable === 'true') return true;
    
    return false;
  },

  /**
   * Check if element is visible
   */
  isElementVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    
    if (style.display === 'none' || 
        style.visibility === 'hidden' || 
        style.opacity === '0') {
      return false;
    }
    
    return element.offsetParent !== null;
  },

  /**
   * Log formatted message
   */
  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[VHL Solver ${timestamp}]`;
    
    if (type === 'error') {
      console.error(prefix, message);
    } else if (type === 'warn') {
      console.warn(prefix, message);
    } else {
      console.log(prefix, message);
    }
  }
};

// Export for use in content script if using modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VHLUtils;
}
