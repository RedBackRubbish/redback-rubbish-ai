// Tai front-end logic – simple, clean, and ready for AI
// Talks to Netlify function at /.netlify/functions/tai-ai
// Falls back to smart scripted answers if anything fails.

document.addEventListener("DOMContentLoaded", () => {
  /* --------------------
     Mobile bottom bar hide/show near booking section
  --------------------- */
  const mobileBar = document.querySelector(".mobile-cta-bar");
  const bookSection = document.getElementById("book-quote");

  function updateMobileBar() {
    if (!mobileBar || !bookSection) return;
    const rect = bookSection.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (inView) {
      mobileBar.classList.add("mobile-cta-hidden");
    } else {
      mobileBar.classList.remove("mobile-cta-hidden");
    }
  }

  window.addEventListener("scroll", updateMobileBar);
  window.addEventListener("resize", updateMobileBar);
  updateMobileBar();

  /* --------------------
     Tai chat widget wiring
  --------------------- */
  const widget = document.getElementById("tai-widget");
  if (!widget) return;

  const messagesEl = document.getElementById("tai-messages");
  const inputEl = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const quickButtons = widget.querySelectorAll(".quick");

  if (!messagesEl || !inputEl || !sendBtn) return;

  let isSending = false;

  function addMessage(text, who = "ai", extraClass = "") {
    const wrapper = document.createElement("div");
    wrapper.className = "msg " + who;
    if (extraClass) wrapper.classList.add(extraClass);

    const span = document.createElement("span");
    span.textContent = text;
    wrapper.appendChild(span);

    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return wrapper;
  }

  function setLoading(loading) {
    isSending = loading;
    sendBtn.disabled = loading;
    inputEl.disabled = loading;
  }

  function getFallbackReply(text) {
    const q = (text || "").toLowerCase();

    // Pricing & costs
    if (q.includes("price") || q.includes("cost") || q.includes("how much")) {
      return "For most jobs we price by trailer load. A full load starts from around $550 including GST, half loads from about $330, and smaller jobs can be less. For the most accurate price, send a couple of photos and your suburb to 0459 272 402 and we'll reply with a firm quote.";
    }

    // Service areas
    if (q.includes("area") || q.includes("suburb") || q.includes("where") || q.includes("service")) {
      return "We service Brisbane Southside and Logan, plus nearby surrounding suburbs. If you're unsure whether we come to you, send your suburb with a photo of the load and I'll confirm it for you.";
    }

    // Booking / same-day
    if (q.includes("book") || q.includes("booking") || q.includes("same-day") || q.includes("same day")) {
      return "To book, you can text photos of your rubbish and your suburb to 0459 272 402, or use the online Jobber booking form further down this page. We'll reply with a time window and confirmation. Same-day or next-day is often possible depending on our schedule.";
    }

    // What we take
    if (q.includes("what do you take") || q.includes("what you take") || q.includes("take?") || q.includes("rubbish")) {
      return "We take general household junk, garage and shed clear-outs, green waste, small furniture moves, gym equipment and more. We can't take asbestos, chemicals or anything hazardous – for those you'll need a licensed specialist.";
    }

    // A–B delivery
    if (q.includes("a-b") || q.includes("a to b") || q.includes("a 2 b") || q.includes("delivery")) {
      return "For simple A to B deliveries of small household loads, pricing starts from around $100 including GST. Send the pickup and drop-off suburbs plus a rough idea of the items and I'll help with an estimate.";
    }

    // Default safe reply
    return "I'm here to help with pricing, what we take, our service area and how to book with RedBack Rubbish Removal. For the fastest quote, send a few photos of your load and your suburb to 0459 272 402 and our family-run team will text you back, usually the same day.";
  }

  async function sendToTai(rawText) {
    const text = (rawText || "").trim();
    if (!text || isSending) return;

    // Show user message
    addMessage(text, "user");
    inputEl.value = "";
    setLoading(true);

    // Show typing message
    const typingMsg = addMessage("Tai is thinking...", "system", "typing");

    try {
      const response = await fetch("/.netlify/functions/tai-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      let data = null;
      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }

      typingMsg.remove();

      if (!response.ok || !data || typeof data.reply !== "string") {
        const fallback = getFallbackReply(text);
        addMessage(fallback, "ai");
      } else {
        addMessage(data.reply, "ai");
      }
    } catch (err) {
      console.error("Error talking to Tai:", err);
      typingMsg.remove();
      const fallback = getFallbackReply(text);
      addMessage(fallback, "ai");
    } finally {
      setLoading(false);
      inputEl.focus();
    }
  }

  // Send via button
  sendBtn.addEventListener("click", () => {
    const value = inputEl.value.trim();
    if (!value) return;
    sendToTai(value);
  });

  // Send on Enter (no Shift)
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const value = inputEl.value.trim();
      if (!value) return;
      sendToTai(value);
    }
  });

  // Quick question buttons
  quickButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const text =
        btn.getAttribute("data-question") ||
        btn.getAttribute("data-text") ||
        "";
      if (!text) return;
      sendToTai(text);
    });
  });
});
