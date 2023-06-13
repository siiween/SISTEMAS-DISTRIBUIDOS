const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const app = express();
const db = require("../database/db");
const args = process.argv.slice(2);
const port = args[0] ? parseInt(args[0], 10) : 3000;
const maxPlayers = args[1] ? parseInt(args[1], 10) : 4;
const weatherPort = args[2] ? parseInt(args[2], 10) : 4000;

// Crea las tablas si no existen
app.use(express.json());

// Endpoint para la lógica del juego
app.get("/game", (req, res) => {
  // Aquí implementa la lógica del juego y devuelve la respuesta
  res.send("Implementación de la lógica del juego");
});

// Endpoint para obtener el estado del tablero
app.get("/game/board", (req, res) => {
  // Aquí obtén y devuelve el estado del tablero
  res.send("Estado del tablero");
});

// Endpoint para realizar un movimiento de jugador
app.post("/game/move", (req, res) => {
  // Aquí implementa la lógica para realizar un movimiento de jugador
  res.send("Movimiento de jugador realizado");
});


// Endpoint para obtener información del clima
app.get("/weather", async (req, res) => {
  try {
    const weather = await getWeatherFromSocket();
    res.send(weather);
    console.log(weather);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al obtener información del clima");
  }
});


const server = http.createServer(app);
const io = socketIO(server);

io.on("connection", (socket) => {
 

  socket.on("disconnect", () => {
    
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
      if (err) console.error(err.message);
  
      if (!row) {
        console.log("Alias o contraseña incorrectos");
        return socket.emit("registrationError", {
          error: "Alias o contraseña incorrectos",
        });
      }
  
      // El alias y password coinciden, realizar acciones adicionales si es necesario
      console.log("Jugador autenticado correctamente");
      socket.emit("registrationSuccess");
    });
  });
  
});

server.listen(port, () => {
  console.log(`El servidor principal está escuchando en el puerto ${port}`);
});


