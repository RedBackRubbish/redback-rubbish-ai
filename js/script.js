// js/script.js
// Tai AI Front-end logic – Pack v7

// --- DOM ELEMENTS --- //
const chatLog = document.getElementById("tai-chat-log");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const quickButtons = document.querySelectorAll("[data-text]");
const mascotWidget = document.querySelector(".mascot-widget");
const mascotHint = document.querySelector(".mascot-hint");

// Store conversation for better answers
let conversationHistory = [];

// --- HELPERS --- //
function scrollChatToBottom() {
  if (chatLog) {
    chatLog.scrollTop = chatLog.scrollHeight;
  }
}

function createBubble(role, text) {
  const bubble = document.createElement("div");
  bubble.className = `tai-bubble tai-${role}`;
  bubble.textContent = text;
  chatLog.appendChild(bubble);
  scrollChatToBottom();
  return bubble;
}

function setInputDisabled(disabled) {
  if (!chatInput || !sendBtn) return;
  chatInput.disabled = disabled;
  sendBtn.disabled = disabled;
}

// --- MAIN SEND FUNCTION --- //
async function sendToTai(text) {
  if (!text.trim()) return;

  // Show user message
  createBubble("user", text);

  // Lock input
  setInputDisabled(true);

  // “Thinking…” bubble
  const thinkingBubble = createBubble("thinking", "Tai is thinking...");

  try {
    const response = await fetch("/.netlify/functions/tai-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: text,
        history: conversationHistory,
      }),
    });

    let replyText = "Sorry, I'm having trouble right now. Please try again soon.";

    if (response.ok) {
      const data = await response.json();
      if (data && data.reply) {
        replyText = data.reply;
      }
    }

    // Remove thinking bubble
    if (thinkingBubble && thinkingBubble.parentNode) {
      thinkingBubble.parentNode.removeChild(thinkingBubble);
    }

    // Show Tai reply
    createBubble("tai", replyText);

    // Update history (keep last 20 turns)
    conversationHistory.push({ role: "user", content: text });
    conversationHistory.push({ role: "assistant", content: replyText });
    if (conversationHistory.length > 40) {
      conversationHistory = conversationHistory.slice(-40);
    }
  } catch (err) {
    console.error("Error talking to Tai:", err);

    if (thinkingBubble && thinkingBubble.parentNode) {
      thinkingBubble.parentNode.removeChild(thinkingBubble);
    }

    createBubble(
      "tai",
      "Something went wrong talking to the AI. Please check your internet and try again."
    );
  } finally {
    setInputDisabled(false);
    if (chatInput) {
      chatInput.value = "";
      chatInput.focus();
    }
  }
}

// --- EVENT LISTENERS --- //
if (sendBtn && chatInput) {
  sendBtn.addEventListener("click", () => {
    sendToTai(chatInput.value);
  });

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendToTai(chatInput.value);
    }
  });
}

// Quick question buttons (data-text)
if (quickButtons && quickButtons.length) {
  quickButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const text = btn.getAttribute("data-text") || "";
      if (text) {
        sendToTai(text);
      }
    });
  });
}

// Show a little “hint” when page first loads
window.addEventListener("load", () => {
  if (mascotHint) {
    mascotHint.textContent = "G'day, I'm Tai 🕷 – ask me anything about your rubbish removal!";
  }
});
