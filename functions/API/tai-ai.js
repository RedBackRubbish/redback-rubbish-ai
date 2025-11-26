// functions/api/tai-ai.js
// Cloudflare Pages Function to power Lil RedBack (Tai) with OpenAI

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Missing OPENAI_API_KEY on server" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const userMessage = (body.message || "").toString().trim();
  const tone = (body.tone || "friendly").toString();

  if (!userMessage) {
    return new Response(
      JSON.stringify({ error: "Missing message" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Build the system prompt so Tai talks like your brand
  const systemPrompt = `
You are "Tai", the Lil RedBack mascot for RedBack Rubbish Removal in Brisbane Southside & Logan.

Business facts:
- Family-owned and operated rubbish removal company.
- Service area: Brisbane Southside & Logan and nearby suburbs.
- They handle: household junk, garage and shed clean-outs, gym equipment, green waste, and small A→B furniture/box moves.
- Pricing (approx, always say "from"): small loads from around $150–$220 incl. GST, half loads from around $330 incl. GST, full loads from around $550 incl. GST.
- A→B deliveries from around $100 incl. GST for small loads.
- They are fully insured, friendly, and they do all lifting, loading and sweeping.

Tone:
- Relaxed, friendly, plain-English Aussie vibe.
- Short, clear answers (2–5 sentences).
- Always nudge people to text photos and suburb to 0459 272 402 for a firm quote.
- If asked about things they can't take (e.g. asbestos, chemicals), say they can't take hazardous materials and suggest a licensed specialist.

Important:
- Do NOT make up exact prices. Use "from around $X" and remind them final price is confirmed when they send photos and suburb.
- Keep it helpful and reassuring. Assume the user is on the RedBack website chatting to you.
  `;

  // Temperature tweaks (a bit calmer if "pro")
  const temperature = tone === "pro" ? 0.5 : 0.8;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature,
        max_tokens: 260,
        messages: [
          { role: "system", content: systemPrompt.trim() },
          { role: "user", content: userMessage }
        ]
      })
    });

    if (!openaiRes.ok) {
      const text = await openaiRes.text().catch(() => "");
      console.error("OpenAI error:", openaiRes.status, text);
      return new Response(
        JSON.stringify({
          reply: "Sorry, my brain glitched for a second. You can still text photos and your suburb to 0459 272 402 for a quote."
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await openaiRes.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "I’m here to help with pricing, what we take, our service area and how to book. For the fastest quote, text a few photos and your suburb to 0459 272 402.";

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Network/worker error talking to OpenAI:", err);
    return new Response(
      JSON.stringify({
        reply: "Looks like I can’t reach my brain right now, but you can still text photos and your suburb to 0459 272 402 for a same-day quote."
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
