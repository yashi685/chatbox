/* -----------------  Firebase init  ----------------- */
var firebaseConfig = {
  apiKey: "AIzaSyAbjBqeZQhudwrg-AnfV7QhPnVlf0eJbGQ",
  authDomain: "chatbotagent-mep9.firebaseapp.com",
  databaseURL: "https://chatbotagent-mep9-default-rtdb.firebaseio.com",
  projectId: "chatbotagent-mep9",
  storageBucket: "chatbotagent-mep9.appspot.com",
  messagingSenderId: "10214860665",
  appId: "1:10214860665:web:fa21a3f60cc3606c2831a8"
};
firebase.initializeApp(firebaseConfig);
var db = firebase.database();

/* -----------------  Globals  ----------------- */
var myName = "";
var roomName = "";
var messageListener = null;
var typingTimeout = null;
var TYPING_DELAY = 1500;

/* -----------------  DOM refs  ----------------- */
var chatBox  = document.getElementById("chat-box");
var typingEl = document.getElementById("typing-indicator");

/* ----------- Helper: format timestamp ----------- */
function formatTime(ms) {
  var d = new Date(ms);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
         " · " +
         d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/* ----------- Helper: scroll to bottom ----------- */
function scrollToBottom() { chatBox.scrollTop = chatBox.scrollHeight; }

/* ----------- Add a message to the DOM ----------- */
function addMessage(id, data) {
  var div = document.createElement("div");
  div.classList.add("msg", data.name === myName ? "me" : "other");
  div.dataset.id = id;

  var delBtn = (data.name === myName)
    ? '<button class="del" data-id="' + id + '" title="Delete">🗑️</button>'
    : "";

  div.innerHTML =
    '<span class="who">' + data.name + ':</span>' +
    '<span class="text">' + data.message + '</span>' +
    delBtn +
    '<span class="time">' + formatTime(data.timestamp) + "</span>";

  chatBox.appendChild(div);
  scrollToBottom();
}

/* ----------------  Join room ---------------- */
function joinRoom() {
  myName  = document.getElementById("name").value.trim();
  roomName = document.getElementById("room").value.trim();

  if (!myName || !roomName) {
    alert("Enter your name and room name.");
    return;
  }

  /* clear previous messages & listener */
  chatBox.innerHTML = "";
  if (messageListener) messageListener.off();

  /* listen for new messages */
  messageListener = db.ref("rooms/" + roomName + "/messages");
  messageListener.on("child_added", function (snap) {
    addMessage(snap.key, snap.val());
  });

  /* listen for deletions */
  messageListener.on("child_removed", function (snap) {
    var el = chatBox.querySelector('[data-id="' + snap.key + '"]');
    if (el) el.remove();
  });

  /* typing indicator */
  var typingRef = db.ref("rooms/" + roomName + "/typing");
  typingRef.on("value", function (snap) {
    var typingUsers = snap.val() || {};
    var others = Object.keys(typingUsers).filter(function (n) { return n !== myName; });
    if (others.length) {
      typingEl.textContent = others.join(", ") + " is typing...";
      typingEl.style.display = "block";
    } else {
      typingEl.style.display = "none";
    }
  });
}

/* ----------------  Send message ---------------- */
function sendMessage() {
  var text = document.getElementById("message").value.trim();
  if (!text || !myName || !roomName) return;

  db.ref("rooms/" + roomName + "/messages").push({
    name: myName,
    message: text,
    timestamp: Date.now()
  });

  document.getElementById("message").value = "";
  db.ref("rooms/" + roomName + "/typing/" + myName).remove();
}

/* ----------------  Typing handler ---------------- */
function handleTyping() {
  if (!myName || !roomName) return;

  var ref = db.ref("rooms/" + roomName + "/typing/" + myName);
  ref.set(true);

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(function () { ref.remove(); }, TYPING_DELAY);
}

/* ----------------  Delete click ---------------- */
chatBox.addEventListener("click", function (e) {
  if (e.target.classList.contains("del")) {
    var id = e.target.dataset.id;
    if (confirm("Delete this message?")) {
      db.ref("rooms/" + roomName + "/messages/" + id).remove();
    }
  }
});

/* ----------------  Wire up buttons after DOM ready ---------------- */
window.addEventListener("DOMContentLoaded", function () {
  document.getElementById("join-btn").addEventListener("click", joinRoom);
  document.getElementById("send-btn").addEventListener("click", sendMessage);

  document.getElementById("message").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  document.getElementById("message").addEventListener("input", handleTyping);
});
