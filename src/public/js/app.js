const socket = io();

const welcome = document.querySelector("div#welcome");
const form = welcome.querySelector("form");
const room = document.querySelector("div#room");

room.hidden = true;

let roomName;

function showRoom() {
  const h3 = room.querySelector("h3");
  welcome.hidden = true;
  room.hidden = false;
  h3.innerText = roomName;
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = form.querySelector("input");
  socket.emit("enter_room", input.value, showRoom);
  roomName = input.value;
  input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);
