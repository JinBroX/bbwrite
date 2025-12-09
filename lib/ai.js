// lib/ai.js

// This function calls the server-side API route to avoid exposing keys
export async function chatWithAI(messages) {
  try {
    const response = await fetch('/api/aiChat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error calling AI:', error);
    return 'Sorry, I encountered an error while processing your request.';
  }
}
