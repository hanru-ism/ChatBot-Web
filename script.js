document.addEventListener('DOMContentLoaded', () => {
  window.sendPrompt = async () => {
    const prompt = document.getElementById('prompt').value;
    const outputDiv = document.getElementById('output');

    outputDiv.innerHTML = '<p>Loading...</p>';
    if (!prompt.trim()) {
      outputDiv.innerHTML = '<p style="color: red;">Please enter a prompt.</p>';
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      outputDiv.innerHTML = `<p>${data.response}</p>`;
    } catch (error) {
      outputDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
  };
});