const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const app = express();
const args = process.argv.slice(2);
const port = args[0] ? parseInt(args[0], 10) : 3000;
const maxPlayers = args[1] ? parseInt(args[1], 10) : 4;
const db = require("../database/db");
const axios = require("axios");

app.use(express.json());

const server = http.createServer(app);
const io = socketIO(server);

io.on("connection", (socket) => {
  console.log("Nuevo cliente conectado");
  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
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
  console.log(`Servidor principal escuchando en el puerto ${port}`);
});

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

crearNuevoMapa();

const drawMap = (mapa) => {
  console.log("");
  console.log(
    padString("", 5) +
      padString(`${mapa.regions[0].name} ${mapa.regions[0].temperature}Cº`, 30) +
      padString("", 4) +
      padString(`${mapa.regions[1].name} ${mapa.regions[1].temperature}Cº`, 30)
  );
  let lineaArriba = padString("", 5);
  let numerosArriba = padString("", 5);
  for (let i = 0; i < 20; i++) {
    if (i === 0) {
      lineaArriba += setRegion[0];
    } else if (i === 10) {
      lineaArriba += padString("", 4) + reset;
      lineaArriba += setRegion[1];
      numerosArriba += padString("", 4);
    }
    lineaArriba += padString("---", 3);
    numerosArriba += padString(i + 1, 3);
  }
  lineaArriba += reset;
  console.log(numerosArriba);
  console.log(lineaArriba);
  mapa.map.forEach((fila, i) => {
    // lineas de enmedio horizontales
    if (i === 10) {
      let linea1 = padString("", 5);
      let linea2 = padString("", 5);
      for (let k = 0; k < 20; k++) {
        if (k === 0) {
          linea1 += setRegion[0];
          linea2 += setRegion[2];
        } else if (k === 10) {
          linea1 += padString("", 4) + reset;
          linea2 += padString("", 4) + reset;
          linea1 += setRegion[1];
          linea2 += setRegion[3];
        }

        linea1 += padString("---", 3);
        linea2 += padString("---", 3);
      }
      linea1 += reset;
      linea2 += reset;
      console.log(linea1);
      console.log(linea2);
    }

    let filaStr = "";
    filaStr += padString(i + 1, 3);
    // ponemos colores a las lineas laterales
    let region = 2;
    if (i < 10) region = 0;
    filaStr += setRegion[region];
    filaStr += padString("| ", 2);
    filaStr += reset;

    fila.forEach((casilla, j) => {
      filaStr += setRegion[casilla.region];

      if (j === 10) {
        filaStr += padString("|", 2);
      }

      if (casilla.content.type === "Jugador") {
        filaStr += padString(casilla.content.identity[0], 3);
      } else if (casilla.content.type === "Mina") {
        filaStr += padString("M", 3);
      } else if (casilla.content.type === "Alimento") {
        filaStr += padString("A", 3);
      } else {
        filaStr += padString(" ", 3);
      }

      if (j === 9) {
        filaStr += padString("|", 2);
      }

      filaStr += reset;
    });

    // ponemos colores a las lineas laterales
    region = 3;
    if (i < 10) region = 1;
    filaStr += setRegion[region];
    filaStr += padString(" |", 2);
    filaStr += reset;
    filaStr += padString(` ${i + 1}`, 3);
    console.log(filaStr);
  });

  let lineaAbajo = padString("", 5);
  let numerosAbajo = padString("", 5);
  for (let i = 0; i < 20; i++) {
    if (i === 0) {
      lineaAbajo += setRegion[2];
    } else if (i === 10) {
      lineaAbajo += padString("", 4) + reset;
      lineaAbajo += setRegion[3];
      numerosAbajo += padString("", 4);
    }
    lineaAbajo += padString("---", 3);
    numerosAbajo += padString(i + 1, 3);
  }
  lineaAbajo += reset;
  console.log(lineaAbajo);
  console.log(numerosAbajo);

  console.log(
    padString("", 5) +
      padString(`${mapa.regions[2].name} ${mapa.regions[2].temperature}Cº`, 30) +
      padString("", 4) +
      padString(`${mapa.regions[3].name} ${mapa.regions[3].temperature}Cº`, 30)
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
