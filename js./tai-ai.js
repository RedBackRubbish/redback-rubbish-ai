function jsonResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',        // same-origin use is fine, this just keeps browsers happy
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify(data)
  };
}

exports.handler = async (event) => {
  // Handle preflight for safety
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, {});
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed. Use POST.' });
  }

  // Check API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Missing OPENAI_API_KEY env var');
    return jsonResponse(500, {
      error: 'Server is not configured correctly.',
      reply:
        "Hey, it's Tai here. My brain isn’t fully plugged in yet – the humans behind RedBack still need to finish my setup."
    });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    console.error('Invalid JSON body', err);
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const userMessage = (payload.message || '').trim();
  if (!userMessage) {
    return jsonResponse(400, { error: 'Missing message', reply: 'Ask me anything about RedBack Rubbish Removal.' });
  }

  // 🔐 SYSTEM PROMPT – this is Tai’s personality + rules
  const systemPrompt = `
You are "Tai", the friendly Lil RedBack mascot for **RedBack Rubbish Removal** in Brisbane Southside & Logan.

Your job:
- Help visitors understand pricing, what you take, service areas and how to book.
- Encourage people to **text photos & their suburb to 0459 272 402** for the fastest quote.
- Speak in a friendly, clear tradie-style tone. Short paragraphs, easy to read on a phone.
- You can reference:
  - You price mostly by trailer load: small loads from about $150–$220 incl. GST, half loads around $330, full loads around $550.
  - You also do green waste, small A→B moves, garage/shed clean-outs and general household junk.
  - Family owned & operated, fully insured, based on Brisbane Southside & Logan.
- If someone asks for something outside rubbish removal (politics, random trivia, etc.),
  gently steer them back to rubbish removal and quotes.

Important:
- NEVER invent exact booking times or prices for a specific job.
- Instead, ask for **suburb + photos of the load** and direct them to:
  - SMS: "You can text photos & your suburb to 0459 272 402."
  - Booking form: "You can also use the online booking form further down this page."
Keep answers helpful but not essay-length. 
  `;

  // Simple guard rails: if the question clearly needs a human, nudge them
  const lower = userMessage.toLowerCase();
  let extraNudge = '';
  if (lower.includes('tomorrow') || lower.includes('today') || lower.includes('specific time')) {
    extraNudge =
      ' I can’t lock in exact times myself, but the humans can when you text them photos and your suburb.';
  }

  try {
    // Call OpenAI via fetch (Node 18 has global fetch)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',   // good balance of cost + quality
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage + extraNudge }
        ],
        temperature: 0.5,
        max_tokens: 350
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI error:', response.status, errText);
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const reply =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      (data.choices[0].message.content || '').trim();

    if (!reply) {
      throw new Error('No reply from OpenAI');
    }

    return jsonResponse(200, { reply });
  } catch (err) {
    console.error('Tai AI function error:', err);

    // Fallback – must ALWAYS answer something useful
    const fallback =
      "I’m having a small brain glitch right now, but here’s the gist:\n\n" +
      "• We do rubbish removal around Brisbane Southside & Logan\n" +
      "• Pricing is usually by trailer load (small from about $150–$220, half from about $330, full from about $550 incl. GST)\n" +
      "• We take household junk, garage/shed clean-outs, green waste and small A→B moves\n\n" +
      "For the most accurate quote, text a few photos of the load and your suburb to 0459 272 402 and the humans at RedBack will reply, usually the same day.";

    return jsonResponse(200, { reply: fallback });
  }
};
