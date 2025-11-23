netlify/functions/tai-ai.js
// netlify/functions/tai-ai.js

import { Configuration, OpenAIApi } from "openai";

export async function handler(event) {
  try {
    const { message } = JSON.parse(event.body);

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY, // READS THE KEY FROM NETLIFY (GOOD!)
    });
    const openai = new OpenAIApi(configuration);

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are Tai, the friendly AI mascot for RedBack Rubbish Removal. You help users with quotes, pricing, service areas, and how to book same-day jobs." },
        { role: "user", content: message }
      ],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: response.data.choices[0].message.content }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Something went wrong." }),
    };
  }
}
