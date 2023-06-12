const http = require("http");
const fs = require("fs");
const io = require("socket.io")(http);

const citiesFilePath = "cities.json";
const citiesData = JSON.parse(fs.readFileSync(citiesFilePath, "utf8"));

function getRandomCityTemperature() {
  const randomIndex = Math.floor(Math.random() * citiesData.length);
  return citiesData[randomIndex];
}

// Crea el servidor HTTP
const server = http.createServer((req, res) => {
  res.writeHead(404);
  res.end("Not Found");
});

// Asocia el servidor HTTP con socket.io
io.attach(server);

// Escucha eventos de conexión de sockets
io.on("connection", (socket) => {
  console.log("Un cliente se ha conectado");

  // Maneja el evento 'weather' para obtener una ciudad y temperatura aleatoria
  socket.on("weather", () => {
    const { city, temperature } = getRandomCityTemperature();
    const response = {
      city,
      temperature,
    };

    // Envía la respuesta al cliente que solicitó el clima
    socket.emit("weather", response);
  });
});

const port = process.argv[2];

server.listen(port, () => {
  console.log(`Servidor de clima iniciado en el puerto ${port}`);
});
