// ✅ Your Firebase config (keep as is)
var firebaseConfig = {
  apiKey: "AIzaSyAbjBqeZQhudwrg-AnfV7QhPnVlf0eJbGQ",
  authDomain: "chatbotagent-mep9.firebaseapp.com",
  projectId: "chatbotagent-mep9",
  storageBucket: "chatbotagent-mep9.firebasestorage.app",
  messagingSenderId: "10214860665",
  appId: "1:10214860665:web:fa21a3f60cc3606c2831a8",
  measurementId: "G-SD3EDKS83F",
  databaseURL: "https://chatbotagent-mep9-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.database();

// 🧑‍🤝‍🧑 Group chat variables
var myName = "";
var roomName = "";
var messageListener = null;

// ▶️ Join a group room
function joinRoom() {
  myName = document.getElementById("name").value.trim();
  roomName = document.getElementById("room").value.trim();
  if (!myName || !roomName) {
    alert("Enter your name and room name.");
    return;
  }

  document.getElementById("chat-box").innerHTML = "";

  if (messageListener) {
    messageListener.off();
  }

  messageListener = db.ref("rooms/" + roomName + "/messages");
  messageListener.on("child_added", function(snapshot) {
    var data = snapshot.val();
    var messageElement = document.createElement("div");
    messageElement.textContent = data.name + ": " + data.message;
    document.getElementById("chat-box").appendChild(messageElement);
    document.getElementById("chat-box").scrollTop = document.getElementById("chat-box").scrollHeight;
  });
}

// 📤 Send message to group
function sendMessage() {
  var message = document.getElementById("message").value.trim();
  if (!message || !myName || !roomName) return;

  db.ref("rooms/" + roomName + "/messages").push({
    name: myName,
    message: message,
    timestamp: Date.now()
  });

  document.getElementById("message").value = "";
}
