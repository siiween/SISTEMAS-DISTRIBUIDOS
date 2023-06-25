const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const app = express();
const bcrypt = require("bcrypt");
const args = process.argv.slice(2);
const port = args[0] ? parseInt(args[0], 10) : 3000;
const maxPlayers = args[1] ? parseInt(args[1], 10) : 4;
const db = require("../database/db");
const util = require("./util");
let idPartida = null;
app.use(express.json());
const server = http.createServer(app);
const io = socketIO(server);

app.get("/api/mapa", (req, res) => {
  // obtener mapa de la base de datos
  util
    .getMapaFromDatabase(idPartida)
    .then((mapaJSON) => {
      const response = {
        map: mapaJSON,
      };
      return res.json(response);
    })
    .catch((error) => {
      console.error("Error al recuperar el mapa:", error);
    });
});

// devuelve un array con todos los jugadores
app.get("/api/jugadores", (req, res) => {
  db.all("SELECT * FROM jugadores", [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Error en la consulta a la base de datos" });
    }
    const response = rows.map((row) => {
      return {
        id: row.Alias,
        level: row.Level,
        EC: row.EC,
        EF: row.EF,
      };
    });
    return res.json(response);
  });
});

// devuleve la informacion de un jugador en concreto
app.get("/api/jugador/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM jugadores WHERE alias = ?", [id], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Error en la consulta a la base de datos" });
    }
    if (!row) {
      console.log("Alias incorrecto");
      return res.status(404).json({ error: "Alias incorrecto" });
    }
    const response = {
      id: row.Alias,
      level: row.Level,
      EC: row.EC,
      EF: row.EF,
    };
    return res.json(response);
  });
});

io.on("connection", (socket) => {
  let JugadorAlias = null;
  let NPCCodigo = null;
  console.log("Nuevo cliente conectado");

  socket.on("disconnect", () => {
    if (JugadorAlias) {
      console.log(`Jugador desconectado: ${JugadorAlias}`);
      // eliminar al jugador del mapa
      // recuperar el mapa de la base de datos
      if (idPartida) {
        util
          .getMapaFromDatabase(idPartida)
          .then((mapaJSON) => {
            // nos guardamos los datos del jugador actuales
            let jugador = null;
            mapaJSON.players.forEach((player) => {
              if (player.id === JugadorAlias) {
                jugador = player;
              }
            });

            let mapaActualizado = util.eliminarDelMapa(mapaJSON, jugador);
            // guardamos el mapa en la base de datos
            db.run("UPDATE Mapa SET Mapa = ? WHERE ID = ?", [JSON.stringify(mapaActualizado), idPartida], function (err) {
              if (err) {
                console.error("Error al guardar el nuevo mapa:", err.message);
              }
            });
          })
          .catch((error) => {
            console.error("Error al recuperar el mapa:", error);
          });
      }
    } else if (NPCCodigo) {
      console.log(`NPC desconectado: ${NPCCodigo}`);
      // eliminar NPC del mapa
      // recuperar el mapa de la base de datos
      if (idPartida) {
        // recuperar el mapa de la base de datos
        util
          .getMapaFromDatabase(idPartida)
          .then((mapaJSON) => {
            // nos guardamos los datos del jugador actuales
            let NPC = null;
            mapaJSON.NPCs.forEach((npc) => {
              if (npc.id === NPCCodigo) {
                NPC = npc;
              }
            });
            // ELIMINAMOS EL NPC DEL MAPA
            mapaJSON.map[NPC.position.y][NPC.position.x].content = { type: null };
            mapaJSON.NPCs = mapaJSON.NPCs.filter((npc) => npc.id !== NPCCodigo);
            // guardamos el mapa en la base de datos
            db.run("UPDATE Mapa SET Mapa = ? WHERE ID = ?", [JSON.stringify(mapaJSON), idPartida], function (err) {
              if (err) {
                console.error("Error al guardar el nuevo mapa:", err.message);
              }
            });
          })
          .catch((error) => {
            console.error("Error al recuperar el mapa:", error);
          });
      }
    } else {
      console.log("Cliente desconectado sin autenticar");
    }
  });

  socket.on("connectNpc", (e) => {
    try {
      // GENERAL UN CODIGO ALEATORIO PARA EL NPC
      const codigo = Math.floor(Math.random() * 1000000);
      // creamos al npc
      util
        .getMapaFromDatabase(idPartida)
        .then((mapaJSON) => {
          let x = Math.floor(Math.random() * 20);
          let y = Math.floor(Math.random() * 20);
          while (mapaJSON.map[y][x].content.type !== null) {
            x = Math.floor(Math.random() * 20);
            y = Math.floor(Math.random() * 20);
          }
          const npc = { id: codigo, level: Math.floor(Math.random() * 10), position: { x: x, y: y } };
          mapaJSON.NPCs.push(npc);
          mapaJSON.map[y][x].content = { type: "NPC", id: codigo, level: npc.level };
          // Guardar el nuevo mapa en la base de datos
          db.run("UPDATE Mapa SET Mapa = ? WHERE ID = ?", [JSON.stringify(mapaJSON), idPartida], function (err) {
            if (err) {
              console.error("Error al guardar el nuevo mapa:", err.message);
            } else {
              console.log("Mapa actualizado ID:", idPartida);
            }
          });
          NPCCodigo = codigo;
          socket.emit("connectNpcResponse", {
            success: true,
            codigo: codigo,
          });
        })
        .catch((error) => {
          console.error("Error al recuperar el mapa:", error);
          socket.emit("connectNpcResponse", {
            error: "Error al recuperar el mapa",
          });
        });

      console.log("Codigo de NPC: " + codigo);
      socket.emit("connectNpcResponse", {
        success: true,
        codigo: codigo,
      });
    } catch (error) {
      socket.emit("connectNpcResponse", {
        error: true,
      });
    }
  });

  socket.on("moveNpc", ({ codigo, movimiento }) => {
    util.getMapaFromDatabase(idPartida).then((mapaJSON) => {
      // nos guardamos los datos del jugador actuales
      let NPC = null;
      mapaJSON.NPCs.forEach((npc) => {
        if (npc.id === codigo) {
          NPC = npc;
        }
      });

      if (NPCCodigo && NPC) {
        switch (movimiento) {
          case "x": // abajo
            mapaActualizado = util.moverNPC(mapaJSON, NPC, { x: NPC.position.x, y: NPC.position.y + 1 }, idPartida);
            break;
          case "w": // arriba
            mapaActualizado = util.moverNPC(mapaJSON, NPC, { x: NPC.position.x, y: NPC.position.y - 1 }, idPartida);
            break;
          case "d": // derecha
            mapaActualizado = util.moverNPC(mapaJSON, NPC, { x: NPC.position.x + 1, y: NPC.position.y }, idPartida);
            break;
          case "a": // izquierda
            mapaActualizado = util.moverNPC(mapaJSON, NPC, { x: NPC.position.x - 1, y: NPC.position.y }, idPartida);
            break;
          case "q": // arriba izquierda
            mapaActualizado = util.moverNPC(mapaJSON, NPC, { x: NPC.position.x - 1, y: NPC.position.y - 1 }, idPartida);
            break;
          case "e": // arriba derecha
            mapaActualizado = util.moverNPC(mapaJSON, NPC, { x: NPC.position.x + 1, y: NPC.position.y - 1 }, idPartida);
            break;
          case "z": // abajo izquierda
            mapaActualizado = util.moverNPC(mapaJSON, NPC, { x: NPC.position.x - 1, y: NPC.position.y + 1 }, idPartida);
            break;
          case "c": // abajo derecha
            mapaActualizado = util.moverNPC(mapaJSON, NPC, { x: NPC.position.x + 1, y: NPC.position.y + 1 }, idPartida);
            break;
          default:
            break;
        }
        socket.emit("moveNpcResponse", {
          success: true,
        });
      } else {
        // enviamos al npc que se ha muerto
        socket.emit("moveNpcResponse", {
          dead: true,
        });
      }
    });
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
    db.get("SELECT * FROM jugadores WHERE alias = ?", [alias], (err, row) => {
      if (err) {
        console.error(err.message);
        return socket.emit("registrationError", {
          error: "Error en la consulta a la base de datos",
        });
      }

      if (!row) {
        console.log("Alias incorrecto");
        return socket.emit("registrationError", {
          error: "Alias incorrecto",
        });
      }

      // Verificar la contraseña actual con el hash almacenado
      const contrasenaCoincide = bcrypt.compareSync(password, row.Password);
      if (!contrasenaCoincide) {
        console.log("Contraseña incorrecta");
        return socket.emit("registrationError", {
          error: "Contraseña incorrecta",
        });
      } else {
        // El alias y password coinciden, realizar acciones adicionales si es necesario
        console.log("Jugador autenticado correctamente");
        JugadorAlias = alias;
        util
          .getMapaFromDatabase(idPartida)
          .then((mapaJSON) => {
            // si el jugador ya existe en la partida no se le deja entrar
            let jugadorExiste = false;
            mapaJSON.players.forEach((player) => {
              if (player.id === alias) {
                jugadorExiste = true;
              }
            });

            if (jugadorExiste) {
              socket.emit("registrationError", {
                error: "El jugador ya existe en la partida",
              });
            } else if (maxPlayers === mapaJSON.players.length) {
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
              const user = { id: alias, level: 1, position: { x: x, y: y }, EF: row.EF, EC: row.EC };
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
      }
    });
  });

  socket.on("leavePlayer", () => {
    if (JugadorAlias) {
      // eliminar al jugador del mapa
      if (idPartida) {
        util
          .getMapaFromDatabase(idPartida)
          .then((mapaJSON) => {
            // nos guardamos los datos del jugador actuales
            let jugador = null;
            mapaJSON.players.forEach((player) => {
              if (player.id === JugadorAlias) {
                jugador = player;
              }
            });
            let mapaActualizado = util.eliminarDelMapa(mapaJSON, jugador);
            // guardamos el mapa en la base de datos
            db.run("UPDATE Mapa SET Mapa = ? WHERE ID = ?", [JSON.stringify(mapaActualizado), idPartida], function (err) {
              if (err) {
                console.error("Error al guardar el nuevo mapa:", err.message);
                socket.emit("leavePlayerResponse", {
                  success: false,
                });
              } else {
                console.log(`Jugador desconectado: ${JugadorAlias}`);
                JugadorAlias = null;
                socket.emit("leavePlayerResponse", {
                  success: true,
                });
              }
            });
          })
          .catch((error) => {
            console.error("Error al recuperar el mapa:", error);
          });
      }
    } else {
      console.log("Cliente desconectado sin autenticar");
    }
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
          switch (e.opcion) {
            case "x": // abajo
              mapaActualizado = util.moverJugador(mapaJSON, jugador, { x: jugador.position.x, y: jugador.position.y + 1 }, idPartida);
              break;
            case "w": // arriba
              mapaActualizado = util.moverJugador(mapaJSON, jugador, { x: jugador.position.x, y: jugador.position.y - 1 }, idPartida);
              break;
            case "d": // derecha
              mapaActualizado = util.moverJugador(mapaJSON, jugador, { x: jugador.position.x + 1, y: jugador.position.y }, idPartida);
              break;
            case "a": // izquierda
              mapaActualizado = util.moverJugador(mapaJSON, jugador, { x: jugador.position.x - 1, y: jugador.position.y }, idPartida);
              break;
            case "q": // arriba izquierda
              mapaActualizado = util.moverJugador(mapaJSON, jugador, { x: jugador.position.x - 1, y: jugador.position.y - 1 }, idPartida);
              break;
            case "e": // arriba derecha
              mapaActualizado = util.moverJugador(mapaJSON, jugador, { x: jugador.position.x + 1, y: jugador.position.y - 1 }, idPartida);
              break;
            case "z": // abajo izquierda
              mapaActualizado = util.moverJugador(mapaJSON, jugador, { x: jugador.position.x - 1, y: jugador.position.y + 1 }, idPartida);
              break;
            case "c": // abajo derecha
              mapaActualizado = util.moverJugador(mapaJSON, jugador, { x: jugador.position.x + 1, y: jugador.position.y + 1 }, idPartida);
              break;
            default:
              break;
          }
        }

        // comprobar si el jugador ha muerto en el mapa actualizado
        let jugadorMuerto = true;
        mapaActualizado.players.forEach((player) => {
          if (player.id === e.userName) {
            jugadorMuerto = false;
          }
        });

        socket.emit("movePlayerResponse", {
          dead: jugadorMuerto,
          map: mapaActualizado,
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

// nos guardamos los datos del jugador actuales
server.listen(port, () => {
  console.log(`Servidor principal escuchando en el puerto ${port}`);
});

const crearNuevoMapa = async () => {
  try {
    const regions = await util.obtenerDatosTiempoAleatorio();

    const map = [];
    for (let i = 0; i < 20; i++) {
      const row = [];
      for (let j = 0; j < 20; j++) {
        let region = 3;
        if (i < 10 && j < 10) region = 0;
        else if (i < 10 && j >= 10) region = 1;
        else if (i >= 10 && j < 10) region = 2;
        const tipo = Math.floor(Math.random() * 10);
        if (tipo === 0) row.push({ region: region, content: { type: "Mina" } });
        else if (tipo === 1) row.push({ region: region, content: { type: "Alimento" } });
        else row.push({ region: region, content: { type: null } });
      }
      map.push(row);
    }
    // Guardar el nuevo mapa en la base de datos
    db.run(
      "INSERT INTO Mapa (Mapa) VALUES (?)",
      [
        JSON.stringify({
          regions: regions,
          map: map,
          players: [],
          NPCs: [],
        }),
      ],
      function (err) {
        if (err) {
          console.error("Error al guardar el nuevo mapa:", err.message);
        } else {
          idPartida = this.lastID; // Guardar el ID de la partida creada
          console.log("Nuevo mapa creado con ID:", idPartida);
        }
      }
    );
  } catch (error) {
    console.error("Error al crear el mapa:", error.message);
  }
};

// creamos un nuevo mapa
crearNuevoMapa();
