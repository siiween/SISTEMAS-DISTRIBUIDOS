const express = require("express");
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

app.listen(port, () => {
  console.log(`El servidor principal está escuchando en el puerto ${port}`);
});

function getWeatherFromSocket() {
  const io = require("socket.io-client");
  const socket = io(`http://localhost:${weatherPort}`);

  return new Promise((resolve, reject) => {
    socket.on("connect", () => {
      console.log("Conexión establecida con el servidor de sockets de clima");

      socket.emit("weather");
    });

    socket.on("weather", (response) => {
      socket.disconnect();
      resolve(response);
    });

    socket.on("disconnect", () => {
      console.log("Desconectado del servidor de sockets de clima");
    });
  });
}

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
