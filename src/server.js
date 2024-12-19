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

wsServer.on("connection", (socket) => {
  socket.onAny((event) => {
    console.log(`Socket Event: ${event}`);
  });
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    done();
  });
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
