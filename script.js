document.addEventListener('DOMContentLoaded', () => {
    window.sendPrompt = async () => {
        const prompt = document.getElementById('prompt').value;
        const outputDiv = document.getElementById('output');

        outputDiv.innerHTML = '<p>Loading...</p>';

        try {
            const response = await puter.ai.chat(prompt, { model: 'claude-sonnet-4' });
            const responseText = response.message.content[0].text;
            outputDiv.innerHTML = `<p>${responseText}</p>`;
        } catch (error) {
            outputDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    };
});