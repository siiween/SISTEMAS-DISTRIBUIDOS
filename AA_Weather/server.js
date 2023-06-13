const http = require("http");
const fs = require("fs");
const io = require("socket.io");

const weatherPort = 4000;

const server = http.createServer((req, res) => {
  res.writeHead(404);
  res.end("Not Found");
});

const ioServer = io(server);

const citiesFilePath = "cities.json";
const citiesData = JSON.parse(fs.readFileSync(citiesFilePath, "utf8"));

function getRandomCityTemperature() {
  const randomIndex = Math.floor(Math.random() * citiesData.length);
  return citiesData[randomIndex];
}

ioServer.on("connection", (socket) => {
  console.log("Un cliente se ha conectado");

  socket.on("weather", () => {
    const { city, temperature } = getRandomCityTemperature();
    const response = {
      city,
      temperature,
    };

    try {
      socket.emit("weather", response);
    } catch (error) {
      console.log("Error");
    }
  });
});

server.listen(weatherPort, () => {
  console.log(`Servidor de sockets de clima iniciado en el puerto ${weatherPort}`);
});
