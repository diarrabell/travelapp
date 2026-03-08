// UI Module
const chatContainer = document.getElementById('chat-container');
const statusIndicator = document.getElementById('status-indicator');
const statusText = statusIndicator.querySelector('.status-text');

let currentStreamingMessage = null;

export function appendMessage(role, htmlContent, isStreaming = false) {
    // If we're updating a currently streaming message
    if (isStreaming && currentStreamingMessage && currentStreamingMessage.dataset.role === role) {
        currentStreamingMessage.innerHTML = htmlContent;
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return;
    }
    
    // If not, or if role changed (or stream finalized), create new message node
    if (currentStreamingMessage) {
        currentStreamingMessage.classList.remove('streaming');
        currentStreamingMessage = null;
    }
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    msgDiv.dataset.role = role;
    msgDiv.innerHTML = htmlContent;
    
    if (isStreaming) {
        msgDiv.classList.add('streaming');
        currentStreamingMessage = msgDiv;
    }
    
    chatContainer.appendChild(msgDiv);
    
    // Scroll to bottom
    setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 10);
}

export function updateSystemStatus(state, text) {
    statusIndicator.className = `status-indicator ${state}`;
    statusText.innerText = text;
    
    if (currentStreamingMessage && state !== 'streaming') {
         currentStreamingMessage.classList.remove('streaming');
         currentStreamingMessage = null;
    }
}
