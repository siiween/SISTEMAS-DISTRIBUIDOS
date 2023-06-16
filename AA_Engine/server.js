const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const app = express();
const args = process.argv.slice(2);
const port = args[0] ? parseInt(args[0], 10) : 3000;
const maxPlayers = args[1] ? parseInt(args[1], 10) : 4;
const db = require("../database/db");
const axios = require("axios");

const iniciarPartida = true;

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
      if (iniciarPartida)
        getMapaFromDatabase(idPartida)
          .then((mapaJSON) => {
            socket.emit("registrationSuccess", {
              status: true,
              message: "Partida iniciada",
              map: mapaJSON,
            });
          })
          .catch((error) => {
            console.error("Error al recuperar el mapa:", error);
          });
      else {
        socket.emit("registrationSuccess", {
          status: false,
          message: "Partida no iniciada",
        });
      }
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
          console.log("Partida no iniciada, por favor, pulsa s para iniciar la partida:");
        }
      }
    );
  } catch (error) {
    console.error("Error al crear el mapa:", error.message);
  }
};

crearNuevoMapa();
