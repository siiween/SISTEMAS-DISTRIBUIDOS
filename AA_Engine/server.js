const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const app = express();
const args = process.argv.slice(2);
const port = args[0] ? parseInt(args[0], 10) : 3000;
const maxPlayers = args[1] ? parseInt(args[1], 10) : 4;
const db = require("../database/db");
const util = require("./util");

app.use(express.json());
const server = http.createServer(app);
const io = socketIO(server);

io.on("connection", (socket) => {
  let JugadorAlias = null;

  console.log("Nuevo cliente conectado");
  socket.on("disconnect", () => {
    if (JugadorAlias) {
      console.log(`Cliente desconectado: ${JugadorAlias}`);
    } else {
      console.log("Cliente desconectado sin autenticar");
    }
  });

  socket.on("autPlayer", ({ alias, password }) => {
    if (!alias || !password) {
      const atributosFaltantes = [];
      if (!alias) atributosFaltantes.push("alias");
      if (!password) atributosFaltantes.push("password");
      return socket.emit("registrationError", {
        error: "Faltan los siguientes atributos: " + atributosFaltantes.join(", "),
      });
    }

    // Verificar si el alias y password coinciden en la base de datos
    db.get("SELECT id FROM jugadores WHERE alias = ? AND password = ?", [alias, password], (err, row) => {
      if (err) {
        console.error(err.message);
        return socket.emit("registrationError", {
          error: "Error en la consulta a la base de datos",
        });
      }

      if (!row) {
        console.log("Alias o contraseña incorrectos");
        return socket.emit("registrationError", {
          error: "Alias o contraseña incorrectos",
        });
      }

      // El alias y password coinciden, realizar acciones adicionales si es necesario
      console.log("Jugador autenticado correctamente");
      JugadorAlias = alias;

      util
        .getMapaFromDatabase(idPartida)
        .then((mapaJSON) => {
          if (maxPlayers === mapaJSON.players.length) {
            socket.emit("registrationError", {
              error: "Partida llena",
            });
          } else {
            let x = Math.floor(Math.random() * 20);
            let y = Math.floor(Math.random() * 20);
            while (mapaJSON.map[y][x].content.type !== null) {
              x = Math.floor(Math.random() * 20);
              y = Math.floor(Math.random() * 20);
            }

            const user = { id: alias, level: 1, position: { x: x, y: y }, EF: 1, EC: 0 };
            mapaJSON.players.push(user);
            mapaJSON.map[y][x].content = { type: "Jugador", id: alias, level: 1 };

            // Guardar el nuevo mapa en la base de datos
            db.run("UPDATE Mapa SET Mapa = ? WHERE ID = ?", [JSON.stringify(mapaJSON), idPartida], function (err) {
              if (err) {
                console.error("Error al guardar el nuevo mapa:", err.message);
              } else {
                console.log("Mapa actualizado ID:", idPartida);
              }
            });

            socket.emit("registrationSuccess", {
              status: true,
              message: "Partida iniciada",
              map: mapaJSON,
            });
          }
        })
        .catch((error) => {
          console.error("Error al recuperar el mapa:", error);
          socket.emit("registrationError", {
            error: "Error al recuperar el mapa",
          });
        });
    });
  });

  socket.on("movePlayer", (e) => {
    util
      .getMapaFromDatabase(idPartida)
      .then((mapaJSON) => {
        // nos guardamos los datos del jugador actuales
        let jugador = null;
        mapaJSON.players.forEach((player) => {
          if (player.id === e.userName) {
            jugador = player;
          }
        });
        // poner a null al jugador en la posicion anterior
        if (jugador) {
          // poner al jugador en la nueva posicion
          switch (e.opcion) {
            // abajo
            case "x":
              if (jugador.position.y + 1 < 20) {
                mapaJSON.map[jugador.position.y + 1][jugador.position.x].content = { type: "Jugador", id: jugador.id, level: jugador.level };
                mapaJSON.map[jugador.position.y][jugador.position.x].content = { type: null };
              }
              break;
            // arriba
            case "w":
              if (jugador.position.y - 1 >= 0) {
                mapaJSON.map[jugador.position.y - 1][jugador.position.x].content = { type: "Jugador", id: jugador.id, level: jugador.level };
                mapaJSON.map[jugador.position.y][jugador.position.x].content = { type: null };
              }
              break;
            // derecha
            case "d":
              if (jugador.position.x + 1 < 20) {
                mapaJSON.map[jugador.position.y][jugador.position.x + 1].content = { type: "Jugador", id: jugador.id, level: jugador.level };
                mapaJSON.map[jugador.position.y][jugador.position.x].content = { type: null };
              }
              break;
            // izquierda
            case "a":
              if (jugador.position.x - 1 >= 0) {
                mapaJSON.map[jugador.position.y][jugador.position.x - 1].content = { type: "Jugador", id: jugador.id, level: jugador.level };
                mapaJSON.map[jugador.position.y][jugador.position.x].content = { type: null };
              }

            default:
              break;
          }
          // actualizar la posicion del jugador
          mapaJSON.players.forEach((player) => {
            if (player.id === e.userName) {
              switch (e.opcion) {
                // arriba
                case "w":
                  if (player.position.y + 1 < 20) player.position.y += 1;
                  break;
                // abajo
                case "x":
                  if (player.position.y - 1 >= 0) player.position.y -= 1;
                  break;
                // derecha
                case "d":
                  if (player.position.x + 1 < 20) player.position.x += 1;
                  break;
                // izquierda
                case "a":
                  if (player.position.x - 1 >= 0) player.position.x -= 1;
                default:
                  break;
              }
            }
          });
        }

        // guardamos el mapa en la base de datos
        db.run("UPDATE Mapa SET Mapa = ? WHERE ID = ?", [JSON.stringify(mapaJSON), idPartida], function (err) {
          if (err) {
            console.error("Error al guardar el nuevo mapa:", err.message);
          } else {
            console.log("Mapa actualizado ID:", idPartida);
          }
        });
        socket.emit("movePlayerResponse", {
          dead: false,
          map: mapaJSON,
        });
      })
      .catch((error) => {
        console.error("Error al recuperar el mapa:", error);
        socket.emit("registrationError", {
          error: "Error al recuperar el mapa",
        });
      });
  });
});

server.listen(port, () => {
  console.log(`Servidor principal escuchando en el puerto ${port}`);
});

util.crearNuevoMapa();
