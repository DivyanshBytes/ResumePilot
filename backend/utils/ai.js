const AppError = require('./AppError');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Sends a prompt and returns parsed JSON.
// Works with any OpenAI-compatible provider (Groq, Gemini, OpenRouter...)
const askJSON = async ({ system, prompt, maxTokens = 6000 }) => {
  // Read the settings from .env FIRST, before anything uses them
  const { AI_API_KEY, AI_BASE_URL, AI_MODEL } = process.env;

  if (!AI_API_KEY || !AI_BASE_URL || !AI_MODEL) {
    throw new AppError('AI is not configured. Check AI_API_KEY, AI_BASE_URL and AI_MODEL in .env', 500);
  }

  const payload = {
    model: AI_MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.2, // low = consistent, factual output
    response_format: { type: 'json_object' }, // asks the model for valid JSON only
  };

  // GPT-OSS models "think" before answering. Parsing is simple extraction,
  // so light reasoning is enough (faster and cheaper)
  if (AI_MODEL.includes('gpt-oss')) payload.reasoning_effort = 'low';

  const body = JSON.stringify(payload);

  let data;

  // Free tiers have rate limits, so we retry once if we hit one (HTTP 429)
  for (let attempt = 1; attempt <= 2; attempt++) {
    let res;
    try {
      res = await fetch(`${AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AI_API_KEY}`,
        },
        body,
      });
    } catch (err) {
      console.error('AI network error:', err.message);
      throw new AppError('Could not reach the AI service. Please try again.', 502);
    }

    if (res.status === 429 && attempt === 1) {
      await wait(4000);
      continue;
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error(`AI API error ${res.status}:`, errText.slice(0, 300));
      if (res.status === 429) {
        throw new AppError('The AI service is busy (free-tier limit). Please try again in a minute.', 429);
      }
      throw new AppError('The AI service returned an error. Please try again.', 502);
    }

    data = await res.json();
    break;
  }

  const text = data?.choices?.[0]?.message?.content || '';

  // Safety net: take everything from the first { to the last }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) {
    console.error('AI returned no JSON. Raw reply:', text.slice(0, 200));
    throw new AppError('The AI returned an unreadable response. Please try again.', 502);
  }

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new AppError('The AI returned malformed data. Please try again.', 502);
  }
};

module.exports = { askJSON };