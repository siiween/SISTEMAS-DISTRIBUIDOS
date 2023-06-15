const express = require("express");
const app = express();
const db = require("../database/db");
const args = process.argv.slice(2);
const port = args[0] ? parseInt(args[0], 10) : 3000;
const maxPlayers = args[1] ? parseInt(args[1], 10) : 4;
const axios = require("axios");

// Crea las tablas si no existen
app.use(express.json());

const ciudades = ["Tokio", "Roma", "Madrid", "Pekin", "Barcelona", "Murcia", "Burgos", "New York", "Londres"];

const obtenerDatosTiempo = async (ciudad, apiKey) => {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${apiKey}&units=metric`;
  const respuesta = await axios.get(url);
  return respuesta.data.main.temp;
};

const obtenerDatosTiempoCiudadesAleatorias = async (apiKey) => {
  const ciudadesAleatorias = [];
  while (ciudadesAleatorias.length < 4) {
    const indiceAleatorio = Math.floor(Math.random() * ciudades.length);
    const ciudadAleatoria = ciudades[indiceAleatorio];
    if (!ciudadesAleatorias.includes(ciudadAleatoria)) {
      ciudadesAleatorias.push(ciudadAleatoria);
    }
  }

  const datosTiempo = {};
  for (let i = 0; i < ciudadesAleatorias.length; i++) {
    const ciudad = ciudadesAleatorias[i];
    const temperatura = await obtenerDatosTiempo(ciudad, apiKey);
    datosTiempo[i] = {
      name: ciudad,
      temperature: temperatura,
    };
  }

  return datosTiempo;
};

const obtenerDatosTiempoAleatorio = async () => {
  const apiKey = "a1e791977c2fd8a286c6ce7132fce7c3"; // Reemplaza "TU_API_KEY" con tu propia clave de API de OpenWeatherMap
  try {
    const datosTiempo = await obtenerDatosTiempoCiudadesAleatorias(apiKey);
    return datosTiempo;
  } catch (error) {
    console.error("Error al obtener los datos del tiempo:", error.message);
  }
};

const getMapaFromDatabase = async (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT Mapa FROM Mapa WHERE ID = ?", [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        if (row) {
          const mapaBlob = row.Mapa;
          const mapaJSON = JSON.parse(mapaBlob.toString());
          resolve(mapaJSON);
        } else {
          resolve(null);
        }
      }
    });
  });
};

const crearNuevoMapa = async () => {
  try {
    const regions = await obtenerDatosTiempoAleatorio();

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
        }),
      ],
      function (err) {
        if (err) {
          console.error("Error al guardar el nuevo mapa:", err.message);
        } else {
          idPartida = this.lastID; // Guardar el ID de la partida creada
          console.log("Nuevo mapa creado con ID:", idPartida);

          getMapaFromDatabase(idPartida)
            .then((mapaJSON) => {
              drawMap(mapaJSON);
            })
            .catch((error) => {
              console.error("Error al recuperar el mapa:", error);
            });
        }
      }
    );
  } catch (error) {
    console.error("Error al crear el mapa:", error.message);
  }
};

app.listen(port, () => {
  console.log(`El servidor principal está escuchando en el puerto ${port}`);
});

crearNuevoMapa();

const drawMap = (mapa) => {
  console.log(
    padString("", 6) +
      padString(`${mapa.regions[0].name} ${mapa.regions[0].temperature} Cº`, 30) +
      padString(`${mapa.regions[1].name} ${mapa.regions[1].temperature} Cº`, 30)
  );
  let lineaArriba = padString("", 4);
  let numerosArriba = padString("", 4);
  for (let i = 0; i < 20; i++) {
    lineaArriba += padString("---", 3);
    numerosArriba += padString(i + 1, 3);
  }
  console.log(numerosArriba);
  console.log(lineaArriba);
  mapa.map.forEach((fila, i) => {
    let filaStr = "";
    filaStr += padString(i + 1, 3);
    filaStr += "|";
    fila.forEach((casilla, i) => {
      filaStr += setRegion[casilla.region];

      if (casilla.content.type === "Jugador") {
        filaStr += padString(casilla.content.identity[0], 3);
      } else if (casilla.content.type === "Mina") {
        filaStr += padString("M", 3);
      } else if (casilla.content.type === "Alimento") {
        filaStr += padString("A", 3);
      } else {
        filaStr += padString(" ", 3);
      }

      filaStr += reset;
    });
    filaStr += "|";
    filaStr += padString(i + 1, 3);
    console.log(filaStr);
  });

  console.log(lineaArriba);
  console.log(numerosArriba);

  console.log(
    padString("", 6) +
      padString(`${mapa.regions[2].name} ${mapa.regions[2].temperature} Cº`, 30) +
      padString(`${mapa.regions[3].name} ${mapa.regions[3].temperature} Cº`, 30)
  );
};

const reset = "\x1b[0m";
const setRegion = {
  0: "\x1b[34m",
  1: "\x1b[35m",
  2: "\x1b[36m",
  3: "\x1b[32m",
};

const padString = (value, width) => {
  const stringValue = String(value);
  const padding = " ".repeat(width - stringValue.length);
  return stringValue + padding;
};
