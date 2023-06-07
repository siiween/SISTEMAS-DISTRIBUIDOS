const http = require('http');
const url = require('url');
const fs = require('fs');

const citiesFilePath = 'cities.json'; // Ruta al archivo JSON con las ciudades y temperaturas

// Lee el archivo JSON con las ciudades y temperaturas
const citiesData = JSON.parse(fs.readFileSync(citiesFilePath, 'utf8'));

// Función para obtener una ciudad y temperatura aleatoria
function getRandomCityTemperature() {
  const randomIndex = Math.floor(Math.random() * citiesData.length);
  return citiesData[randomIndex];
}

// Crea el servidor HTTP
const server = http.createServer((req, res) => {
  const { pathname } = url.parse(req.url);

  if (pathname === '/weather') {
    // Obtiene una ciudad y temperatura aleatoria
    const { city, temperature } = getRandomCityTemperature();

    // Crea la respuesta en formato JSON
    const response = {
      city,
      temperature
    };

    // Establece las cabeceras de la respuesta
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);

    // Envía la respuesta como JSON
    res.end(JSON.stringify(response));
  } else {
    // Ruta no encontrada
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Obtiene el puerto de escucha de los argumentos de línea de comandos
const port = process.argv[2];

// Inicia el servidor en el puerto especificado
server.listen(port, () => {
  console.log(`Servidor de clima iniciado en el puerto ${port}`);
});
