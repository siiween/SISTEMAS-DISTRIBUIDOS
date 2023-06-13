const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const app = express();
const args = process.argv.slice(2);
const port = args[0] ? parseInt(args[0], 10) : 7000;
const db = require("../database/db");

app.use(express.json());

const server = http.createServer(app);
const io = socketIO(server);

io.on("connection", (socket) => {
  console.log("Nuevo cliente conectado");
  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });

  // Evento para crear un nuevo jugador
  socket.on("createPlayer", ({ alias, password, nivel, EF, EC }) => {
    if (!alias || !password || !nivel || !EF || !EC) {
      const atributosFaltantes = [];
      if (!alias) atributosFaltantes.push("alias");
      if (!password) atributosFaltantes.push("password");
      if (!nivel) atributosFaltantes.push("nivel");
      if (!EF) atributosFaltantes.push("EF");
      if (!EC) atributosFaltantes.push("EC");
      return socket.emit("registrationError", {
        error: "Faltan los siguientes atributos: " + atributosFaltantes.join(", "),
      });
    }

    // Verificar si el alias ya existe en la base de datos
    db.get("SELECT id FROM jugadores WHERE alias = ?", alias, (err, row) => {
      if (err) console.error(err.message);
      if (row) console.log("El alias ya está registrado");
      // El alias no existe, registrar el jugador
      db.run("INSERT INTO jugadores (alias, password, nivel, EF, EC) VALUES (?, ?, ?, ?, ?)", [alias, password, nivel, EF, EC], (err) => {
        if (err) console.error(err.message);
        console.log("Jugador registrado correctamente");
        const playerData = { alias, password, nivel, EF, EC };
        io.emit("playerRegistered", playerData);
      });
    });
  });

  socket.on("editPlayer", ({ alias, password, nivel, EF, EC }) => {
    if (!alias || !password || !nivel || !EF || !EC) {
      const atributosFaltantes = [];
      if (!alias) atributosFaltantes.push("alias");
      if (!nivel) atributosFaltantes.push("nivel");
      if (!EF) atributosFaltantes.push("EF");
      if (!EC) atributosFaltantes.push("EC");
      return socket.emit("registrationError", {
        error: "Faltan los siguientes atributos: " + atributosFaltantes.join(", "),
      });
    }

    // Verificar si el alias ya existe en la base de datos
    db.get("SELECT id FROM jugadores WHERE alias = ? and password = ?", [alias, password], (err, row) => {
      if (err) console.error(err.message);
      // El alias no existe, registrar el jugador
      db.run("UPDATE jugadores SET nivel = ?, EF = ?, EC = ? WHERE alias = ?", [nivel, EF, EC, alias], (err) => {
        if (err) console.error(err.message);
        console.log("Jugador editado correctamente");
      });
    });
  });
});

server.listen(port, () => {
  console.log(`Servidor de Registro escuchando en el puerto ${port}`);
});
