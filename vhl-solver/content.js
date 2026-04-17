// content.js – VHL page scraper & answer filler

(function () {
  // Avoid double-injection
  if (window.__vhlSolverInjected) return;
  window.__vhlSolverInjected = true;

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrapeQuestions") {
      const questions = scrapeAllQuestions();
      sendResponse({ questions });
    } else if (request.action === "fillAnswers") {
      fillAnswers(request.answers);
      sendResponse({ filled: true });
    } else if (request.action === "ping") {
      sendResponse({ alive: true });
    }
  });

  /* ─── SCRAPE ─── */
  function scrapeAllQuestions() {
    const questions = [];

    // VHL uses various activity wrappers
    const activityContainers = document.querySelectorAll(
      '.activity-item, .question-item, [class*="question"], [data-question-id], ' +
      '.vhlbk-activity, .hw-activity, .activity_item, li.item'
    );

    activityContainers.forEach((el, idx) => {
      const q = parseQuestion(el, idx);
      if (q) questions.push(q);
    });

    // Fallback: find inputs/selects directly if no containers found
    if (questions.length === 0) {
      document.querySelectorAll('input[type="text"], select, textarea').forEach((input, idx) => {
        const container = input.closest('li, div, p, td') || input.parentElement;
        const q = parseQuestion(container, idx);
        if (q && !questions.find(x => x.id === q.id)) questions.push(q);
      });
    }

    return questions;
  }

  function parseQuestion(el, fallbackIdx) {
    if (!el) return null;

    // Determine ID
    const id = el.dataset?.questionId
      || el.dataset?.itemId
      || el.id
      || `q-${fallbackIdx}`;

    // Get visible text (question prompt)
    const questionText = getQuestionText(el);
    if (!questionText && !el.querySelector('input, select, textarea')) return null;

    // Determine type
    const hasSelect = el.querySelector('select');
    const hasText = el.querySelector('input[type="text"], textarea');
    const hasRadio = el.querySelector('input[type="radio"]');
    const hasCheckbox = el.querySelector('input[type="checkbox"]');

    let type = "unknown";
    let options = [];

    if (hasSelect) {
      type = "dropdown";
      options = Array.from(hasSelect.options)
        .filter(o => o.value && o.value !== "" && o.value !== "0")
        .map(o => o.text.trim());
    } else if (hasRadio) {
      type = "multiple_choice";
      options = Array.from(el.querySelectorAll('input[type="radio"]'))
        .map(r => {
          const label = r.nextElementSibling?.textContent
            || el.querySelector(`label[for="${r.id}"]`)?.textContent
            || r.value;
          return label?.trim();
        })
        .filter(Boolean);
    } else if (hasCheckbox) {
      type = "checkbox";
      options = Array.from(el.querySelectorAll('input[type="checkbox"]'))
        .map(c => {
          const label = c.nextElementSibling?.textContent
            || el.querySelector(`label[for="${c.id}"]`)?.textContent
            || c.value;
          return label?.trim();
        })
        .filter(Boolean);
    } else if (hasText) {
      type = "fill_in_blank";
    }

    // Surrounding context (sentence with blank)
    const context = el.textContent?.replace(/\s+/g, " ").trim().slice(0, 300) || "";

    return { id, type, question: questionText || context.slice(0, 150), options, context };
  }

  function getQuestionText(el) {
    const promptEl = el.querySelector(
      '.question-text, .prompt, .question-prompt, .activity-prompt, ' +
      '[class*="prompt"], [class*="question-text"], p, span.text'
    );
    return promptEl?.textContent?.trim()
      || el.querySelector('label')?.textContent?.trim()
      || "";
  }

  /* ─── FILL ─── */
  function fillAnswers(answers) {
    if (!Array.isArray(answers)) return;

    answers.forEach(({ id, answer }) => {
      // Find element by data-question-id or id
      let container =
        document.querySelector(`[data-question-id="${id}"]`) ||
        document.querySelector(`[data-item-id="${id}"]`) ||
        document.getElementById(id);

      // Fallback: match by index for q-N ids
      if (!container && id?.startsWith("q-")) {
        const idx = parseInt(id.replace("q-", ""));
        const all = document.querySelectorAll(
          '.activity-item, .question-item, [class*="question"], li.item, ' +
          'input[type="text"], select'
        );
        container = all[idx] || null;
      }

      if (!container) return;

      fillContainer(container, answer);
    });

    // Flash success indicator
    showBanner(`✅ ${answers.length} answers filled!`);
  }

  function fillContainer(container, answer) {
    // Dropdown
    const select = container.tagName === "SELECT" ? container : container.querySelector("select");
    if (select) {
      const match = Array.from(select.options).find(
        o => o.text.trim().toLowerCase() === answer.trim().toLowerCase()
      );
      if (match) {
        select.value = match.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
      return;
    }

    // Text input / textarea
    const input = container.tagName === "INPUT" ? container
      : container.querySelector('input[type="text"], textarea');
    if (input) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, "value"
      )?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, answer);
      } else {
        input.value = answer;
      }
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    // Radio
    const radios = container.querySelectorAll('input[type="radio"]');
    if (radios.length) {
      radios.forEach(r => {
        const label = r.nextElementSibling?.textContent?.trim()
          || container.querySelector(`label[for="${r.id}"]`)?.textContent?.trim()
          || r.value;
        if (label?.toLowerCase() === answer.trim().toLowerCase()) {
          r.checked = true;
          r.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    }
  }

  function showBanner(msg) {
    const existing = document.getElementById("vhl-solver-banner");
    if (existing) existing.remove();

    const banner = document.createElement("div");
    banner.id = "vhl-solver-banner";
    banner.textContent = msg;
    Object.assign(banner.style, {
      position: "fixed", top: "20px", right: "20px", zIndex: "999999",
      background: "#1a1a2e", color: "#00f5d4", fontFamily: "monospace",
      fontSize: "14px", padding: "12px 20px", borderRadius: "8px",
      boxShadow: "0 4px 20px rgba(0,245,212,0.3)", border: "1px solid #00f5d4"
    });
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 4000);
  }
})();
