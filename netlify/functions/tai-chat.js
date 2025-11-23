// netlify/functions/tai-chat.js

const apiKey = process.env.OPENAI_API_KEY;

exports.handler = async (event) => {
  // CORS / preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  if (!apiKey) {
    return {
      statusCode: 500,
      body: "Server misconfigured: missing OPENAI_API_KEY",
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (err) {
    return {
      statusCode: 400,
      body: "Invalid JSON body",
    };
  }

  const userMessage = (body && body.message) || "";
  const history = Array.isArray(body.history) ? body.history : [];

  if (!userMessage.trim()) {
    return {
      statusCode: 400,
      body: "Missing 'message' in request body",
    };
  }

  // Build chat messages for OpenAI
  const messages = [
    {
      role: "system",
      content:
        "You are Tai, the friendly AI mascot for Redback Rubbish Removal in Brisbane Southside & Logan. " +
        "You help with pricing guidance, what items we take, how bookings work, and general rubbish removal questions. " +
        "Keep answers short, clear and friendly. Use Aussie tone where natural. " +
        "Never invent prices; only give rough guidance and always tell them final quote is confirmed by SMS or on-site. " +
        "If they ask for something we don't do (like asbestos removal), clearly say we don't handle that and recommend they contact a licensed professional.",
    },
    ...history.slice(-10), // last 10 messages to keep context small
    {
      role: "user",
      content: userMessage,
    },
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      return {
        statusCode: 500,
        body: "Error from AI backend",
      };
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I'm having trouble answering right now. Please try again in a moment.";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      body: "Unexpected server error",
    };
  }
};
