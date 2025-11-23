// Tai front-end logic for Redback site
const messagesEl = document.getElementById('chatMessages');
const inputEl = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const quickButtons = document.querySelectorAll('.quick');

if (messagesEl && inputEl && sendBtn) {
  function addMessage(text, type) {
    const wrapper = document.createElement('div');
    wrapper.className = `msg ${type}`;
    const span = document.createElement('span');
    span.textContent = text;
    wrapper.appendChild(span);
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setLoading(isLoading) {
    sendBtn.disabled = isLoading;
    inputEl.disabled = isLoading;
  }

  function getFallbackReply(text) {
    const q = text.toLowerCase();

    if (q.includes('price') || q.includes('cost') || q.includes('how much')) {
      return "For most jobs we price by trailer load. A full load is usually in the $X–$Y range depending on the rubbish type and tipping fees. Send photos to 0459 272 402 and I'll give you a fast, exact quote.";
    }

    if (q.includes('area') || q.includes('suburb') || q.includes('where') || q.includes('service')) {
      return "We service Brisbane Southside & Logan and nearby suburbs. If you're unsure, send your suburb with a photo to 0459 272 402 and I'll confirm for you.";
    }

    if (q.includes('book') || q.includes('quote') || q.includes('same-day')) {
      return "To book, just text photos of your rubbish to 0459 272 402 with your suburb and preferred day. We'll reply with a same-day quote and a time window.";
    }

    if (q.includes('what do you take') || q.includes('what you take') || q.includes('take?')) {
      return "We take general household junk, garage clean-outs, green waste, furniture, whitegoods, cardboard, and more. We can't take asbestos, chemicals or anything hazardous.";
    }

    return "I'm here to help with pricing, service areas, what we take, and how to book. For the fastest quote, text photos of your rubbish to 0459 272 402.";
  }

  async function sendToTai(userText) {
    addMessage(userText, 'user');
    inputEl.value = '';
    setLoading(true);

    const typingMsg = document.createElement('div');
    typingMsg.className = 'msg typing';
    const span = document.createElement('span');
    span.textContent = 'Tai is thinking...';
    typingMsg.appendChild(span);
    messagesEl.appendChild(typingMsg);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      const res = await fetch('/.netlify/functions/tai-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        // Not JSON (e.g. HTML error) – fall back
        data = null;
      }

      typingMsg.remove();

      if (!res.ok || !data || !data.reply) {
        // Use our built-in fallback replies instead of failing
        const fallback = getFallbackReply(userText);
        addMessage(fallback, 'ai');
      } else {
        addMessage(data.reply, 'ai');
      }
    } catch (err) {
      console.error('Network error talking to Tai:', err);
      typingMsg.remove();
      const fallback = getFallbackReply(userText);
      addMessage(fallback, 'ai');
    } finally {
      setLoading(false);
      inputEl.disabled = false;
      inputEl.focus();
    }
  }

  sendBtn.addEventListener('click', () => {
    const text = inputEl.value.trim();
    if (!text) return;
    sendToTai(text);
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = inputEl.value.trim();
      if (!text) return;
      sendToTai(text);
    }
  });

  quickButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-text');
      if (!text) return;
      sendToTai(text);
    });
  });

  // Initial welcome
  addMessage("Hi, I'm Tai. Ask me about pricing, what we take, our service area, or how to book a same-day job.", 'ai');
}
