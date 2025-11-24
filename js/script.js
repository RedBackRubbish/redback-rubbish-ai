// Tai front-end logic for Lil RedBack mascot AI
// Connects the floating Lil RedBack widget to your Netlify function
// at /.netlify/functions/tai-ai and gives friendly answers about
// RedBack Rubbish Removal only.

document.addEventListener('DOMContentLoaded', function () {
  const widget       = document.querySelector('.mascot-widget');
  if (!widget) return;

  const chatLog      = widget.querySelector('#tai-chat-log');
  const inputEl      = widget.querySelector('#tai-chat-input');
  const sendBtn      = widget.querySelector('#tai-chat-send');
  const quickButtons = widget.querySelectorAll('.mascot-quick-buttons button');

  let isSending = false;

  if (!chatLog || !inputEl || !sendBtn) return;

  function scrollToBottom() {
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function addMessage(text, who = 'tai', opts = {}) {
    const msg  = document.createElement('div');
    const role = who === 'user' ? 'user' : 'tai';
    msg.className = 'mascot-msg mascot-msg-' + role;
    if (opts.small) msg.classList.add('mascot-msg-small');

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;

    msg.appendChild(bubble);
    chatLog.appendChild(msg);
    scrollToBottom();
    return msg;
  }

  function setLoading(loading) {
    isSending = loading;
    sendBtn.disabled = loading;
    inputEl.disabled = loading;
  }

  function getFallbackReply(text) {
    const q = (text || '').toLowerCase();

    // Pricing & costs
    if (q.includes('price') || q.includes('cost') || q.includes('how much')) {
      return "For most jobs we price by trailer load. A full load starts from around $550 including GST, half loads from about $330, and smaller jobs can be less. For the most accurate price, send a couple of photos and your suburb to 0459 272 402 and we'll reply with a firm quote.";
    }

    // Service areas
    if (q.includes('area') || q.includes('suburb') || q.includes('where') || q.includes('service')) {
      return "We service Brisbane Southside and Logan, plus nearby surrounding suburbs. If you're unsure whether we come to you, send your suburb with a photo of the load and I'll confirm it for you.";
    }

    // Booking / same-day
    if (q.includes('book') || q.includes('booking') || q.includes('same-day') || q.includes('same day')) {
      return "To book, you can text photos of your rubbish and your suburb to 0459 272 402, or use the online Jobber booking form further down this page. We'll reply with a time window and confirmation. Same-day or next-day is often possible depending on our schedule.";
    }

    // What we take
    if (q.includes('what do you take') || q.includes('what you take') || q.includes('take?') || q.includes('rubbish')) {
      return "We take general household junk, garage and shed clear-outs, green waste, small furniture moves, gym equipment and more. We can't take asbestos, chemicals or anything hazardous – for those you'll need a licensed specialist.";
    }

    // A–B delivery
    if (q.includes('a-b') || q.includes('a to b') || q.includes('a 2 b') || q.includes('delivery')) {
      return "For simple A to B deliveries of small household loads, pricing starts from around $100 including GST. Send the pickup and drop-off suburbs plus a rough idea of the items and I'll help with an estimate.";
    }

    // Default safe reply
    return "I'm here to help with pricing, what we take, our service area and how to book with RedBack Rubbish Removal. For the fastest quote, send a few photos of your load and your suburb to 0459 272 402 and our family-run team will text you back, usually the same day.";
  }

  async function sendToTai(rawText) {
    const text = (rawText || '').trim();
    if (!text || isSending) return;

    addMessage(text, 'user');
    inputEl.value = '';
    setLoading(true);

    // Typing indicator
    const typingMsg = document.createElement('div');
    typingMsg.className = 'mascot-msg mascot-msg-tai mascot-msg-small';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = 'Tai is thinking...';
    typingMsg.appendChild(bubble);
    chatLog.appendChild(typingMsg);
    scrollToBottom();

    try {
      const res = await fetch('/.netlify/functions/tai-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        data = null;
      }

      typingMsg.remove();

      if (!res.ok || !data || typeof data.reply !== 'string') {
        const fallback = getFallbackReply(text);
        addMessage(fallback, 'tai');
      } else {
        addMessage(data.reply, 'tai');
      }
    } catch (err) {
      console.error('Network error talking to Tai:', err);
      typingMsg.remove();
      const fallback = getFallbackReply(text);
      addMessage(fallback, 'tai');
    } finally {
      setLoading(false);
      inputEl.focus();
    }
  }

  // Send via button
  sendBtn.addEventListener('click', function () {
    const value = inputEl.value.trim();
    if (!value) return;
    sendToTai(value);
  });

  // Send on Enter (no Shift)
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const value = inputEl.value.trim();
      if (!value) return;
      sendToTai(value);
    }
  });

  // Quick question buttons
  quickButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const text = btn.getAttribute('data-question') || btn.getAttribute('data-text') || '';
      if (!text) return;
      sendToTai(text);
    });
  });

  // Initial welcome message in the log
  addMessage(
    "Hi, I’m Tai — your Lil RedBack helper! Got junk? I’ve got muscles! Ask away…",
    'tai'
  );
});
