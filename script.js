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
            const response = await puter.ai.chat(prompt, { model: 'claude-sonnet-4' });
            const responseText = response.message.content[0].text;
            // Render markdown
            outputDiv.innerHTML = marked.parse(responseText);
        } catch (error) {
            outputDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    };
});