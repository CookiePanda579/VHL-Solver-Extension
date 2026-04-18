# VHL Solver - AI Solving Feature Guide

## Overview

The AI Solving feature uses OpenRouter's API to intelligently solve VHL word-input questions using advanced language models like GPT-4, GPT-3.5, Claude, and Mistral.

---

## Getting Started

### Step 1: Get Your OpenRouter API Key

1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Sign up for a free account
3. Go to Settings → API Keys
4. Copy your API key (starts with `sk-` or contains `or-`)

### Step 2: Add Your API Key to VHL Solver

1. Open a VHL page in Chrome
2. Click the **VHL Solver** extension icon
3. Click the **⚙️ Settings** button
4. Paste your OpenRouter API key in the input field
5. Click **💾 Save**

### Step 3: Test Your Connection

1. In the Settings panel, click **🧪 Test**
2. You should see "Valid API key ✓" message
3. Close the settings panel

### Step 4: Solve Questions

1. Click **🤖 AI Solve** button
2. The extension will:
   - Extract all questions from the page
   - Send them to OpenRouter for AI solving
   - Fill in the answers automatically
   - Show you the results

---

## Features

### Supported Models

Choose from multiple AI models via the Settings dropdown:

| Model | Speed | Accuracy | Cost | Best For |
|-------|-------|----------|------|----------|
| **GPT-3.5 Turbo** | ⚡⚡ Fast | ⭐⭐ Good | 💰 Cheap | Quick solving, everyday questions |
| **GPT-4** | ⚡ Moderate | ⭐⭐⭐ Excellent | 💰💰 Medium | Complex questions, accuracy matters |
| **Claude 2** | ⚡ Moderate | ⭐⭐⭐ Excellent | 💰💰 Medium | Alternative high-quality model |
| **Mistral 7B** | ⚡⚡ Fast | ⭐⭐ Good | 💰 Cheap | Open-source, privacy-focused |

### Key Capabilities

✅ Automatically extracts all questions from VHL pages  
✅ Sends questions to AI model for intelligent solving  
✅ Fills answers directly into input fields  
✅ Works with multiple AI models  
✅ Rate limiting to avoid API overload  
✅ Error handling for failed requests  
✅ Shows detailed results (solved, unsolved, errors)  

---

## How It Works

### Workflow

```
1. You click "🤖 AI Solve"
        ↓
2. Extension extracts questions using getAllQuestions()
        ↓
3. Questions sent to background service worker
        ↓
4. Worker makes API request to OpenRouter
        ↓
5. AI model (GPT-4, etc.) generates answers
        ↓
6. Answers returned to content script
        ↓
7. Content script fills answers into form fields
        ↓
8. Results displayed in popup
```

### API Integration

The `background.js` service worker handles all API communication:

```javascript
// Background script sends to OpenRouter
POST https://openrouter.ai/api/v1/chat/completions

Headers:
- Authorization: Bearer [YOUR_API_KEY]
- Content-Type: application/json

Body:
{
  model: "gpt-3.5-turbo",
  messages: [
    {
      role: "system",
      content: "You are a Spanish language teacher..."
    },
    {
      role: "user",
      content: "Spanish learning question: ..."
    }
  ],
  temperature: 0.3,
  max_tokens: 50
}
```

---

## Settings Panel

### API Key Input
- **Purpose**: Store your OpenRouter API key securely
- **Format**: Should start with `sk-` or contain `or-`
- **Security**: Key is stored locally in Chrome storage
- **Tip**: Use the 🤖 icon to toggle visibility

### Model Selection
- **Purpose**: Choose which AI model to use
- **Options**: GPT-3.5, GPT-4, Claude 2, Mistral 7B
- **Recommendation**: Start with GPT-3.5 (fast and cheap)
- **Change**: Takes effect immediately on next "🤖 AI Solve"

### Test Button (🧪)
- **Purpose**: Verify your API key works
- **Result**: Shows "Valid API key ✓" or error message
- **Use**: Before using AI Solve for the first time

### Save Button (💾)
- **Purpose**: Save API key to Chrome storage
- **Required**: Must save before using AI Solve
- **Result**: Confirmation message and status update

### Clear Button (🗑️)
- **Purpose**: Remove stored API key
- **Effect**: Settings will be empty next time
- **Use**: If switching keys or removing extension

---

## Pricing & Cost Management

### OpenRouter Pricing

Models have different costs per 1K tokens:

```
GPT-3.5 Turbo:    ~$0.001 per question
GPT-4:            ~$0.03 per question  
Claude 2:         ~$0.02 per question
Mistral 7B:       ~$0.0001 per question
```

### Estimated Costs

```
10 questions with GPT-3.5:  ~$0.01
50 questions with GPT-4:    ~$1.50
100 questions per Week:     ~$1-5 (mix of models)
```

### Cost Optimization Tips

1. **Use GPT-3.5** for most questions (cheapest & fast enough)
2. **Use GPT-4** only for complex questions
3. **Use Mistral** for very large batches (cheapest)
4. **Monitor usage**: Check OpenRouter dashboard regularly
5. **Set spending limits**: Optional on OpenRouter account

### Free Credits

- New OpenRouter accounts get **$5 free credits**
- Usually enough for 5,000+ GPT-3.5 questions
- Can be used to test before paying

---

## Usage Examples

### Example 1: Basic AI Solving

1. Go to a VHL page with word-input questions
2. Click extension icon
3. Click "🤖 AI Solve" button
4. Wait for completion message
5. Click "✅ Submit Answers"

### Example 2: Using Console for More Control

```javascript
// Get questions
const q = VHLSolver.getAllQuestions();

// Send to AI for solving
const aiResponse = await chrome.runtime.sendMessage({
  action: 'aiSolve',
  questions: q,
  model: 'gpt-4'  // Use GPT-4 for accuracy
});

// Check results
console.log('Solved:', aiResponse.results.solved.length);
console.log('Errors:', aiResponse.results.errors.length);
```

### Example 3: Switching Between Models Mid-Session

1. Open Settings
2. Change model selection
3. Click "🤖 AI Solve" again
4. New model will be used

---

## Troubleshooting

### Problem: "OpenRouter API key not configured"

**Solution:**
1. Click ⚙️ Settings
2. Paste your API key in the input
3. Click 💾 Save

### Problem: API Key Test Fails

**Solution:**
1. Verify key format (should start with `sk-` or contain `or-`)
2. Check if you copied the entire key
3. Ensure you're using a valid OpenRouter key (not ChatGPT)
4. Visit openrouter.ai and verify key in Settings

### Problem: "API error: 401 Unauthorized"

**Solution:**
1. Key might be expired or invalid
2. Generate a new key on OpenRouter
3. Save the new key in Settings

### Problem: Questions Not Solving

**Solution:**
1. Verify you're on a VHL page with word-input questions
2. Check if results show "unsolved" or "errors"
3. Try with GPT-4 model (more reliable)
4. Check console (F12) for detailed error messages

### Problem: Slow Response Time

**Solution:**
1. OpenRouter API can be slow (1-10 seconds per question)
2. Number of questions affects total time
3. Try GPT-3.5 for faster results
4. Batch smaller sets of questions

### Problem: Out of Free Credits

**Solution:**
1. Add payment method to OpenRouter
2. Or wait for new month's allocation
3. Use cheaper models like Mistral
4. Ask for free credits from OpenRouter support

---

## Advanced Features

### Prompt System

The AI receives optimized prompts:

```
System Message: "You are a Spanish language teacher helping 
students with VHL exercises. Provide accurate, concise answers. 
Reply with only the answer word or phrase, nothing else."

User Message: "Spanish learning question: [QUESTION_TEXT]"
```

### Temperature Setting

- **Current**: 0.3 (deterministic, consistent answers)
- **Why**: Lower temperature = more focused, fewer random variations
- **Effect**: Same question = same answer (mostly)

### Token Limits

- **Max tokens**: 50 per answer
- **Why**: Keeps answers concise and costs low
- **Effect**: Prevents long explanations, just the answer

### Rate Limiting

- **Delay**: 300ms between API requests
- **Why**: Prevents OpenRouter rate limiting
- **Effect**: 10 questions ≈ 3-4 seconds

---

## API Key Security

### How Your Key is Protected

✅ **Stored locally** - Only in your Chrome storage  
✅ **Not transmitted** - Except to OpenRouter.ai  
✅ **Not logged** - Extension doesn't store request logs  
✅ **Per-user** - Each user's key is isolated  

### Best Practices

1. **Keep key private** - Don't share screenshots/videos with key visible
2. **Use profile-specific keys** - Different keys per computer
3. **Monitor usage** - Check OpenRouter billing regularly
4. **Clear before uninstall** - Click 🗑️ Clear button
5. **Update regularly** - Rotate keys periodically

---

## Performance

### Speed Breakdown

```
Question extraction:     ~100-200ms  (depends on page)
API communication:       ~1-10 seconds per question
Answer filling:          ~100-500ms per question
Rate limiting delay:     ~300ms between questions

Total for 10 questions:  ~15-60 seconds
Total for 50 questions:  ~45-300 seconds
```

### Optimization Tips

1. **Batch questions**: Solve 5-20 at a time
2. **Use faster models**: GPT-3.5 is fastest
3. **Close other apps**: Free up bandwidth
4. **Use wired connection**: More stable than WiFi

---

## Limitations

⚠️ **Model Accuracy**: AI isn't always 100% correct  
⚠️ **Context**: Some questions need full page context  
⚠️ **Specialized**: Might struggle with very niche topics  
⚠️ **Multiple Choice**: Currently only solves word-input questions  
⚠️ **Rate Limits**: OpenRouter may rate limit high usage  

---

## FAQ

**Q: Is my API key safe?**  
A: Yes, it's stored locally and only sent to OpenRouter.

**Q: How much does it cost?**  
A: ~$0.001-0.03 per question depending on model.

**Q: Can I use my own API key?**  
A: Yes, only works with OpenRouter keys currently.

**Q: Can I use multiple keys?**  
A: Not currently, but could be added as a feature.

**Q: Does it work on all VHL pages?**  
A: Works on pages with word-input questions; other types not yet supported.

**Q: Can I see the AI responses?**  
A: Check console (F12) under "AI Solutions" in logs.

**Q: What if AI gets question wrong?**  
A: Manually edit the answer or try with a more powerful model (GPT-4).

**Q: Can I use this offline?**  
A: No, requires internet connection to reach OpenRouter API.

---

## Need Help?

### Check These First

1. **API Key Issues**: Verify key in Settings panel
2. **No Questions Found**: Refresh page and try again
3. **Slow Response**: More questions = longer wait
4. **Errors in Console**: Press F12 to see detailed messages

### Debug Mode

Run this in console (F12) while on VHL page:

```javascript
// Test API communication
const key = await chrome.storage.local.get('openrouterKey');
console.log('API Key stored:', !!key.openrouterKey);

// See all questions
const q = VHLSolver.getAllQuestions();
console.table(q);

// Manually test AI
await chrome.runtime.sendMessage({
  action: 'aiSolve',
  questions: VHLSolver.getAllQuestions(),
  model: 'gpt-3.5-turbo'
});
```

---

## Updates & Improvements

### Planned Features

- [ ] Support for multiple choice questions
- [ ] Matching question support
- [ ] Drag-and-drop support
- [ ] API key encryption (more secure)
- [ ] Usage analytics (credits spent, questions solved)
- [ ] Batch processing with progress bar
- [ ] Custom prompts per question type
- [ ] Response caching
- [ ] Alternative API providers

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Feature**: AI Solving with OpenRouter
