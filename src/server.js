import http from "http";
import SocketIO from "socket.io";
import express from "express";

const PORT = 4000;
const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:${PORT}`);

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (!sids.has(key)) publicRooms.push(key);
  });
  return publicRooms;
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  socket["nickname"] = "unknown";
  socket.onAny((event) => {
    console.log(wsServer.sockets.adapter);
    console.log(`Socket Event: ${event}`);
  });
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    const roomCount = countRoom(roomName);
    done(roomCount);
    socket.to(roomName).emit("welcome", socket.nickname, roomCount);
    wsServer.sockets.emit("room_change", publicRooms());
  });
  socket.on("new_message", (message, roomName, done) => {
    socket.to(roomName).emit("new_message", `${socket.nickname}: ${message}`);
    done();
  });
  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) => {
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1);
    });
  });
  socket.on("save_nickname", (nickname) => (socket["nickname"] = nickname));
});

/*
const wss = new WebSocket.Server({ server });

const sockets = [];

function onSocketClose() {
  console.log("Disconnected from the Browser ❌");
}

wss.on("connection", (socket) => {
  sockets.push(socket);
  socket["nickname"] = "unknown";
  console.log("Connected to Browser ✅");
  socket.on("close", onSocketClose);
  socket.on("message", (rawData) => {
    const message = JSON.parse(rawData.toString());
    switch (message.type) {
      case "new_message":
        sockets.forEach((eachSocket) => {
          eachSocket.send(`${socket.nickname}: ${message.payload}`);
        });
        break;
      case "nickname":
        socket["nickname"] = message.payload;
        break;
    }
  });
  socket.send("hello!!!");
});
*/

httpServer.listen(PORT, handleListen);
