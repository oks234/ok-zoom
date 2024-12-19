const socket = io();

const welcome = document.querySelector("div#welcome");
const form = welcome.querySelector("form");
const room = document.querySelector("div#room");

room.hidden = true;

let roomName;

function addMessage(message) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerHTML = message;
  ul.append(li);
}

function showRoom(roomCount) {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${roomCount})`;
  const nicknameForm = room.querySelector("form#nickname");
  const messageForm = room.querySelector("form#message");
  nicknameForm.addEventListener("submit", handleNicknameSubmit);
  messageForm.addEventListener("submit", handleMessageSubmit);
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = welcome.querySelector("input");
  socket.emit("enter_room", input.value, showRoom);
  roomName = input.value;
  input.value = "";
}

function handleNicknameSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#nickname input");
  const nickname = input.value;
  socket.emit("save_nickname", nickname);
  input.value = "";
}

function handleMessageSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#message input");
  const message = input.value;
  socket.emit("new_message", message, roomName, () => {
    addMessage(`You: ${message}`);
  });
  input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);
socket.on("welcome", (nickname, newCount) => {
  addMessage(`${nickname} joined!`);
  roomCount = newCount;
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${roomCount})`;
});

socket.on("bye", (nickname, newCount) => {
  addMessage(`${nickname} left!`);
  roomCount = newCount;
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${roomCount})`;
});

socket.on("new_message", addMessage);
socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  });
});
