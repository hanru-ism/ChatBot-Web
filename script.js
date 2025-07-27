class ChatBot {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.prompt = document.getElementById('prompt');
        this.sendButton = document.getElementById('sendButton');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.charCount = document.getElementById('charCount');
        this.themeToggle = document.getElementById('themeToggle');
        this.clearChat = document.getElementById('clearChat');
        
        // Initialize API base URL - will be configured after init
        this.baseURL = null;
        this.api = (path) => `${this.baseURL}/api${path}`;
        
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        this.messageCount = 0;
        
        // Connection and retry settings
        this.isOnline = navigator.onLine;
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
        
        // Particle system
        this.particleSystem = null;
        
        // Theme settings
        this.currentTheme = localStorage.getItem('currentTheme') || 'futuristic';
        
        this.init();
    }
    
    async init() {
        await this.configureApiBaseUrl();
        this.setupEventListeners();
        this.setupConnectionMonitoring();
        this.setupTheme();
        this.loadChatHistory();
        this.setupAutoResize();
        this.updateCharCount();
        this.createConnectionIndicator();
        this.initParticleSystem();
        this.setupFloatingActionButton();
        this.setupThemeSelector();
        this.updateMessageCount();
    }
    
    async configureApiBaseUrl() {
        try {
            // Default fallback: use current origin
            const defaultBaseUrl = `${window.location.protocol}//${window.location.host}`;
            
            // Try to fetch API configuration from server
            const response = await fetch(`${defaultBaseUrl}/api/config`);
            
            if (response.ok) {
                const config = await response.json();
                // Use configured API_BASE_URL if available, otherwise use default
                this.baseURL = config.apiBaseUrl || defaultBaseUrl;
                console.log(`🔧 API Base URL configured: ${this.baseURL}`);
            } else {
                throw new Error('Config endpoint not available');
            }
        } catch (error) {
            // Fallback to current origin if config fetch fails
            this.baseURL = `${window.location.protocol}//${window.location.host}`;
            console.warn(`⚠️  Could not fetch API config, using fallback: ${this.baseURL}`);
        }
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
    
    setupConnectionMonitoring() {
        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateConnectionStatus();
            console.log('🌐 Connection restored');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateConnectionStatus();
            console.log('📡 Connection lost');
        });
    }
    
    createConnectionIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'connectionIndicator';
        indicator.className = 'connection-indicator';
        indicator.innerHTML = `
            <i class="fas fa-wifi"></i>
            <span>Online</span>
        `;
        
        // Insert after header
        const header = document.querySelector('.chat-header');
        header.insertAdjacentElement('afterend', indicator);
        
        this.connectionIndicator = indicator;
        this.updateConnectionStatus();
    }
    
    updateConnectionStatus() {
        if (!this.connectionIndicator) return;
        
        const icon = this.connectionIndicator.querySelector('i');
        const text = this.connectionIndicator.querySelector('span');
        
        if (this.isOnline) {
            this.connectionIndicator.className = 'connection-indicator online';
            icon.className = 'fas fa-wifi';
            text.textContent = 'Online';
        } else {
            this.connectionIndicator.className = 'connection-indicator offline';
            icon.className = 'fas fa-wifi-slash';
            text.textContent = 'Offline';
        }
    }
    
    async retryRequest(requestFn, maxRetries = this.maxRetries) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;
                console.warn(`🔄 Request attempt ${attempt} failed:`, error.message);
                
                if (attempt < maxRetries) {
                    const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
                    console.log(`⏳ Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error(`❌ All ${maxRetries} attempts failed`);
                }
            }
        }
        
        throw lastError;
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
        
        // Check connection
        if (!this.isOnline) {
            this.showError('Tidak ada koneksi internet. Silakan periksa koneksi Anda.');
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
            const response = await this.retryRequest(async () => {
                const res = await fetch(this.api('/chat'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ prompt: userMessage }),
                });
                
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                
                return res;
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
            
            // Provide more specific error messages
            let errorMessage = 'Terjadi kesalahan saat mengirim pesan.';
            
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
            } else if (error.message.includes('HTTP 429')) {
                errorMessage = 'Terlalu banyak permintaan. Silakan tunggu sebentar.';
            } else if (error.message.includes('HTTP 500')) {
                errorMessage = 'Server sedang mengalami masalah. Silakan coba lagi nanti.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showError(errorMessage);
            
            // Reset input on error
            this.prompt.value = '';
            this.updateCharCount();
            this.autoResizeTextarea();
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
        
        // Create avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = type === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
        
        // Create message bubble
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        bubbleDiv.innerHTML = `
            <div class="message-content">${processedContent}</div>
            <div class="message-actions">
                <button class="copy-btn" onclick="chatBot.copyMessage(this)" title="Copy message">
                    <i class="fas fa-copy"></i>
                </button>
                <div class="timestamp">${timestamp}</div>
            </div>
        `;
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(bubbleDiv);
        
        // Remove welcome message if it exists
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Update message count and save to history
        this.messageCount++;
        this.updateMessageCount();
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
        
        // Create avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = type === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
        
        // Create message bubble
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        bubbleDiv.innerHTML = `
            <div class="message-content">${processedContent}</div>
            <div class="message-actions">
                <button class="copy-btn" onclick="chatBot.copyMessage(this)" title="Copy message">
                    <i class="fas fa-copy"></i>
                </button>
                <div class="timestamp">${timestamp}</div>
            </div>
        `;
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(bubbleDiv);
        
        // Remove welcome message if it exists
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        this.chatMessages.appendChild(messageDiv);
        this.messageCount++;
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
    
    // Particle System
    initParticleSystem() {
        const canvas = document.getElementById('particleCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const particles = [];
        const particleCount = window.innerWidth < 768 ? 30 : 50;
        
        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Particle class
        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 3 + 1;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.opacity = Math.random() * 0.5 + 0.2;
                this.color = this.getRandomColor();
            }
            
            getRandomColor() {
                const colors = ['#667eea', '#764ba2', '#4facfe', '#00f2fe', '#f093fb'];
                return colors[Math.floor(Math.random() * colors.length)];
            }
            
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                
                // Wrap around edges
                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;
                
                // Pulse opacity
                this.opacity += (Math.random() - 0.5) * 0.02;
                this.opacity = Math.max(0.1, Math.min(0.7, this.opacity));
            }
            
            draw() {
                ctx.save();
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        
        // Create particles
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
        
        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });
            
            // Draw connections between nearby particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 100) {
                        ctx.save();
                        ctx.globalAlpha = (100 - distance) / 100 * 0.2;
                        ctx.strokeStyle = '#00f2fe';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
        this.particleSystem = { canvas, ctx, particles };
    }
    
    // Floating Action Button
    setupFloatingActionButton() {
        const fab = document.getElementById('floatingActionBtn');
        if (!fab) return;
        
        fab.addEventListener('click', (e) => {
            e.stopPropagation();
            fab.classList.toggle('active');
        });
        
        // Close FAB menu when clicking outside
        document.addEventListener('click', () => {
            fab.classList.remove('active');
        });
    }
    
    // Theme Selector
    setupThemeSelector() {
        const themeOptions = document.querySelectorAll('.theme-option, .fab-theme-option');
        
        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.dataset.theme;
                this.switchTheme(theme);
                
                // Update active state for both desktop and mobile theme options
                themeOptions.forEach(opt => opt.classList.remove('active'));
                document.querySelectorAll(`[data-theme="${theme}"]`).forEach(opt => opt.classList.add('active'));
            });
        });
        
        // Set initial active theme
        const activeThemes = document.querySelectorAll(`[data-theme="${this.currentTheme}"]`);
        activeThemes.forEach(theme => theme.classList.add('active'));
    }
    
    switchTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('currentTheme', theme);
        
        // Apply theme-specific styles
        document.body.className = theme === 'dark' ? 'dark-mode' : '';
        document.body.setAttribute('data-theme', theme);
        
        // Update CSS custom properties based on theme
        const root = document.documentElement;
        switch (theme) {
            case 'neon':
                root.style.setProperty('--primary-gradient', 'linear-gradient(135deg, #ff006e 0%, #8338ec 100%)');
                root.style.setProperty('--accent-blue', '#ff006e');
                break;
            case 'minimal':
                root.style.setProperty('--primary-gradient', 'linear-gradient(135deg, #6c757d 0%, #495057 100%)');
                root.style.setProperty('--accent-blue', '#6c757d');
                break;
            default: // futuristic
                root.style.setProperty('--primary-gradient', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
                root.style.setProperty('--accent-blue', '#00f2fe');
        }
    }
    
    // Update message count in stats
    updateMessageCount() {
        const countElement = document.getElementById('messagesCount');
        const mobileCountElement = document.getElementById('mobileMessagesCount');
        
        if (countElement) {
            countElement.textContent = this.messageCount;
        }
        if (mobileCountElement) {
            mobileCountElement.textContent = this.messageCount;
        }
    }
    
    // Change theme function for mobile menu
    changeTheme(theme) {
        this.switchTheme(theme);
        
        // Update active state for both desktop and mobile theme options
        const themeOptions = document.querySelectorAll('.theme-option, .fab-theme-option');
        themeOptions.forEach(opt => opt.classList.remove('active'));
        document.querySelectorAll(`[data-theme="${theme}"]`).forEach(opt => opt.classList.add('active'));
        
        // Close mobile menu after selection
        const fab = document.getElementById('floatingActionBtn');
        if (fab) {
            fab.classList.remove('active');
        }
    }
    
    // Quick message functionality
    sendQuickMessage(message) {
        this.prompt.value = message;
        this.sendPrompt();
    }
    
    // Export chat functionality
    exportChat() {
        const chatData = {
            timestamp: new Date().toISOString(),
            messages: this.chatHistory
        };
        
        const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Share chat functionality
    shareChat() {
        if (navigator.share) {
            navigator.share({
                title: 'Chat Bot Conversation',
                text: 'Check out my conversation with the AI Chat Bot!',
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showNotification('Link copied to clipboard!');
            });
        }
    }
    
    // Toggle fullscreen
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
    
    // Show notification
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent-gradient);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
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
