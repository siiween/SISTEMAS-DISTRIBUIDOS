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
  socket.on("createPlayer", (jugador) => {
    // Verificar si el alias ya existe en la base de datos
    db.get("SELECT id FROM jugadores WHERE alias = ?", jugador.alias, (err, row) => {
      if (err) {
        console.error(err.message);
        const response = {
          success: false,
          error: "Error en la consulta a la base de datos",
        };
        socket.emit("registrationResponse", response);
      } else if (row) {
        // El alias ya existe, cancelar el registro del jugador
        const response = {
          success: false,
          error: "El alias ya está registrado",
        };
        socket.emit("registrationResponse", response);
      } else {
        // El alias no existe, registrar el jugador
        db.run("INSERT INTO jugadores (alias, password, nivel, EF, EC) VALUES (?, ?, ?, ?, ?)", [jugador.alias, jugador.password, jugador.nivel, jugador.EF, jugador.EC], (err) => {
          if (err) {
            console.error(err.message);
            const response = {
              success: false,
              error: "Error al crear el jugador",
            };
            socket.emit("registrationResponse", response);
          } else {
            console.log("Jugador registrado correctamente");
            const response = {
              success: true,
            };
            socket.emit("registrationResponse", response);
            const playerData = { alias: jugador.alias, password: jugador.password, nivel: jugador.nivel, EF: jugador.EF, EC: jugador.EC };
            io.emit("playerRegistered", playerData);
          }
        });
      }
    });
  });
  

  socket.on("editPlayer", ({ alias, password, nivel, EF, EC }) => {
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
  
    // Verificar si el alias existe en la base de datos
    db.get("SELECT id FROM jugadores WHERE alias = ? and password = ?", [alias, password], (err, row) => {
      if (err) {
        console.error(err.message);
        return socket.emit("registrationError", {
          error: "Error en la consulta a la base de datos",
        });
      }
  
      if (!row) {
        // El alias no existe, registrar el jugador
        db.run("INSERT INTO jugadores (alias, password, nivel, EF, EC) VALUES (?, ?, ?, ?, ?)", [alias, password, nivel, EF, EC], (err) => {
          if (err) {
            console.error(err.message);
            return socket.emit("registrationError", {
              error: "Error al crear el jugador",
            });
          }
          console.log(`El jugador ${alias} no existía, se ha creado correctamente`);
          socket.emit("playerEdited", { created: true });
        });
      } else {
        // El alias existe, editar al jugador
        db.run("UPDATE jugadores SET nivel = ?, EF = ?, EC = ? WHERE alias = ?", [nivel, EF, EC, alias], (err) => {
          if (err) {
            console.error(err.message);
            return socket.emit("registrationError", {
              error: "Error al editar el jugador",
            });
          }
          console.log("Jugador editado correctamente");
          socket.emit("playerEdited", { created: false });
        });
      }
    });
  });
  
  
});

server.listen(port, () => {
  console.log(`Servidor de Registro escuchando en el puerto ${port}`);
});
