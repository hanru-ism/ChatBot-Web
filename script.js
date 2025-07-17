class ChatBot {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.prompt = document.getElementById('prompt');
        this.sendButton = document.getElementById('sendButton');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.charCount = document.getElementById('charCount');
        this.themeToggle = document.getElementById('themeToggle');
        this.clearChat = document.getElementById('clearChat');
        
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.loadChatHistory();
        this.setupAutoResize();
        this.updateCharCount();
    }
    
    setupEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', () => this.sendPrompt());
        
        // Enter key to send (Shift+Enter for new line)
        this.prompt.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendPrompt();
            }
        });
        
        // Character counter
        this.prompt.addEventListener('input', () => this.updateCharCount());
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Clear chat
        this.clearChat.addEventListener('click', () => this.clearChatHistory());
        
        // Auto-resize textarea
        this.prompt.addEventListener('input', () => this.autoResizeTextarea());
    }
    
    setupTheme() {
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
            this.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            this.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
    
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', this.isDarkMode);
        
        if (this.isDarkMode) {
            this.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            this.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
    
    setupAutoResize() {
        this.prompt.style.height = 'auto';
        this.prompt.style.height = this.prompt.scrollHeight + 'px';
    }
    
    autoResizeTextarea() {
        this.prompt.style.height = 'auto';
        this.prompt.style.height = Math.min(this.prompt.scrollHeight, 120) + 'px';
    }
    
    updateCharCount() {
        const count = this.prompt.value.length;
        this.charCount.textContent = count;
        
        if (count > 3500) {
            this.charCount.style.color = '#e53e3e';
        } else if (count > 3000) {
            this.charCount.style.color = '#d69e2e';
        } else {
            this.charCount.style.color = '#718096';
        }
    }
    
    async sendPrompt() {
        const userMessage = this.prompt.value.trim();
        
        if (!userMessage) {
            this.showError('Silakan masukkan pesan.');
            return;
        }
        
        // Disable send button and show typing
        this.sendButton.disabled = true;
        this.prompt.disabled = true;
        
        // Add user message to chat
        this.addMessage(userMessage, 'user');
        
        // Clear input
        this.prompt.value = '';
        this.updateCharCount();
        this.autoResizeTextarea();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            const response = await fetch('http://127.0.0.1:3000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: userMessage }),
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add bot response
            this.addMessage(data.response, 'bot');
            
        } catch (error) {
            this.hideTypingIndicator();
            this.showError(`Error: ${error.message}`);
        } finally {
            // Re-enable controls
            this.sendButton.disabled = false;
            this.prompt.disabled = false;
            this.prompt.focus();
        }
    }
    
    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const timestamp = new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Process content with markdown if it's a bot message
        const processedContent = type === 'bot' ? this.processMarkdown(content) : this.escapeHtml(content);
        
        messageDiv.innerHTML = `
            <div class="message-content">${processedContent}</div>
            <div class="message-actions">
                <button class="copy-btn" onclick="chatBot.copyMessage(this)" title="Copy message">
                    <i class="fas fa-copy"></i>
                </button>
                <div class="timestamp">${timestamp}</div>
            </div>
        `;
        
        // Remove welcome message if it exists
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Save to history
        this.saveChatHistory(content, type, timestamp);
    }
    
    processMarkdown(content) {
        if (typeof marked !== 'undefined') {
            // Configure marked options
            marked.setOptions({
                breaks: true,
                gfm: true
            });
            
            return DOMPurify.sanitize(marked.parse(content));
        }
        
        // Fallback: basic text processing
        return this.escapeHtml(content).replace(/\n/g, '<br>');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    copyMessage(button) {
        const messageContent = button.closest('.message').querySelector('.message-content').textContent;
        
        navigator.clipboard.writeText(messageContent).then(() => {
            const icon = button.querySelector('i');
            icon.className = 'fas fa-check';
            button.style.color = '#48bb78';
            
            setTimeout(() => {
                icon.className = 'fas fa-copy';
                button.style.color = '';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }
    
    showTypingIndicator() {
        this.typingIndicator.style.display = 'flex';
        this.chatMessages.appendChild(this.typingIndicator);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message bot';
        errorDiv.style.backgroundColor = '#fed7d7';
        errorDiv.style.color = '#c53030';
        errorDiv.innerHTML = `<div class="message-content">${message}</div>`;
        
        this.chatMessages.appendChild(errorDiv);
        this.scrollToBottom();
        
        // Remove error message after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    saveChatHistory(content, type, timestamp) {
        this.chatHistory.push({ content, type, timestamp });
        
        // Keep only last 50 messages
        if (this.chatHistory.length > 50) {
            this.chatHistory = this.chatHistory.slice(-50);
        }
        
        localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
    }
    
    loadChatHistory() {
        this.chatHistory.forEach(message => {
            this.addMessageFromHistory(message.content, message.type, message.timestamp);
        });
    }
    
    addMessageFromHistory(content, type, timestamp) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const processedContent = type === 'bot' ? this.processMarkdown(content) : this.escapeHtml(content);
        
        messageDiv.innerHTML = `
            <div class="message-content">${processedContent}</div>
            <div class="message-actions">
                <button class="copy-btn" onclick="chatBot.copyMessage(this)" title="Copy message">
                    <i class="fas fa-copy"></i>
                </button>
                <div class="timestamp">${timestamp}</div>
            </div>
        `;
        
        // Remove welcome message if it exists
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        this.chatMessages.appendChild(messageDiv);
    }
    
    clearChatHistory() {
        if (confirm('Apakah Anda yakin ingin menghapus semua riwayat chat?')) {
            this.chatHistory = [];
            localStorage.removeItem('chatHistory');
            
            // Clear messages except welcome message
            const messages = this.chatMessages.querySelectorAll('.message');
            messages.forEach(msg => msg.remove());
            
            // Re-add welcome message
            const welcomeMessage = document.createElement('div');
            welcomeMessage.className = 'welcome-message';
            welcomeMessage.innerHTML = `
                <i class="fas fa-robot"></i>
                <p>Halo! Saya Chat Bot. Bagaimana saya bisa membantu Anda hari ini?</p>
            `;
            this.chatMessages.appendChild(welcomeMessage);
        }
    }
}

// Initialize the chat bot when DOM is loaded
let chatBot;
document.addEventListener('DOMContentLoaded', () => {
    chatBot = new ChatBot();
});

// Global function for backward compatibility
window.sendPrompt = () => {
    if (chatBot) {
        chatBot.sendPrompt();
    }
};
