// Verbinde dich mit dem Server
const socket = io('https://chathtmlspotter2-0.onrender.com'); // Socket.IO-Client

// Nachricht senden
function sendMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (message === '') return;

  socket.emit('chat message', message); // an Server senden
  input.value = '';
}

// Nachrichten vom Server empfangen
socket.on('chat message', (msg) => {
  const chatLog = document.getElementById('chat-log');
  const msgElement = document.createElement('div');
  msgElement.textContent = msg;
  chatLog.appendChild(msgElement);
});
