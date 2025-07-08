const answers = new Array(40);
let i = 0;
//Für lokale Benutzung
const socket = new WebSocket('ws://127.0.0.1:10000/', 'chat');
//const socket = new WebSocket('wss://chathtmlspotter2-0.onrender.com', 'chat');
let name = 'u1';
let z = 0;

socket.onopen = function () {
  name = "Spieler" + Math.floor(Math.random()*1000); 
  socket.send(JSON.stringify({ type: "join", name: name }));
};

$('#sendBtn').on('click', function (e) {
  e.preventDefault();
  const msg = $('#msg').val();
  if (msg.trim() !== "") {
    socket.send(JSON.stringify({ type: "msg", msg: msg, sender: name }));
    $('#msg').val('');
  }
});

// ENTER zum Senden aktivieren
$('#msg').on('keypress', function (e) {
  if (e.which === 13 && !e.shiftKey) {
    e.preventDefault();
    $('#sendBtn').click();
  }
});

// Funktion zum Laden der Begrüßungsnachricht
async function loadHello() {
  let hello = [];
  const response = await fetch('/js/json/hello.json');
  hello = await response.json();
  const msg = hello[Math.floor(Math.random() * hello.length)];
  const messageClass = "bot";
        const message = $('<div class="chat-message ' + messageClass + '">' + "Steve" + ': ' + msg + '</div>');
        $('#msgs').append(message);
        $('#msgs').scrollTop($('#msgs')[0].scrollHeight);
};

socket.onmessage = function (msg) {
  z++;
  const data = JSON.parse(msg.data);
  switch (data.type) {
    case 'msg':
      if (data.name === name || (data.name === "Steve" && (data.sender === name || data.sender === "Steve"))) {
        const messageClass = data.name === "Steve" ? "bot" : "you";
        const message = $('<div class="chat-message ' + messageClass + '">' + data.name + ': ' + data.msg + '</div>');
        $('#msgs').append(message);
        $('#msgs').scrollTop($('#msgs')[0].scrollHeight);
        answers[i] = data.msg;
        i++;
      }
      break;

    case 'join':
      $('#users').empty();
      $('#users').append('<div>Spieler online:</div>');
      for (let j = 0; j < data.names.length; j++) {
        $('#users').append('<div>' + data.names[j] + '</div>');
      }
      //Verhindert, dass beim Serverstart der Bot zweimal "Hallo" sagt
      if (z == 1){
        loadHello();
      }
      break;
  }
};
