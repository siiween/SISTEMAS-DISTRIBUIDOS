const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const { Kafka } = require("kafkajs");
const app = express();
const args = process.argv.slice(2);
const port = args[0] ? parseInt(args[0], 10) : 3000;
const maxPlayers = args[1] ? parseInt(args[1], 10) : 4;
const db = require("../database/db");
const util = require("./util");

let iniciarPartida = true;

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
      if (iniciarPartida) {
        util
          .getMapaFromDatabase(idPartida)
          .then((mapaJSON) => {
            socket.emit("registrationSuccess", {
              status: true,
              message: "Partida iniciada",
              map: mapaJSON,
            });
          })
          .catch((error) => {
            console.error("Error al recuperar el mapa:", error);
            socket.emit("registrationError", {
              error: "Error al recuperar el mapa",
            });
          });
      } else {
        socket.emit("registrationSuccess", {
          status: false,
          message: "Partida no iniciada",
        });
      }
    });
  });
});

const consumer = kafka.consumer({ groupId: "test-group" });

const runConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "test-topic", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log("Holalalalala");
    },
  });
};

server.listen(port, () => {
  console.log(`Servidor principal escuchando en el puerto ${port}`);
  runConsumer();
});

util.crearNuevoMapa();
