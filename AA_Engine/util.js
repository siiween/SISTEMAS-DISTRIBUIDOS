const db = require("../database/db");
const axios = require("axios");

const ciudades = ["Tokio", "Roma", "Madrid", "Pekin", "Barcelona", "Murcia", "Burgos", "New York", "Londres", "Copenhague"];

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

const obtenerDatosTiempoAleatorio = async () => {
  const apiKey = "a1e791977c2fd8a286c6ce7132fce7c3"; // Reemplaza "TU_API_KEY" con tu propia clave de API de OpenWeatherMap
  try {
    const datosTiempo = await obtenerDatosTiempoCiudadesAleatorias(apiKey);
    return datosTiempo;
  } catch (error) {
    console.error("Error al obtener los datos del tiempo:", error.message);
  }
};

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

// funcion que reciba mapa, jugador y movimiento y devuelva el mapa actualizado
const moverJugador = (mapaJSON, jugador, posicionNueva, idPartida) => {
  if (posicionNueva.x < 0 || posicionNueva.x > 19 || posicionNueva.y < 0 || posicionNueva.y > 19 || jugador.level === -1) {
    return mapaJSON;
  } else {
    /*
      MINA
    */
    if (mapaJSON.map[posicionNueva.y][posicionNueva.x].content.type === "Mina") {
      mapaJSON.map[jugador.position.y][jugador.position.x].content = { type: null };
      let jugadorMuerto = null;
      mapaJSON.players.forEach((player) => {
        if (player.id === jugador.id) {
          jugadorMuerto = player;
        }
      });
      // actualizamos el mapa
      console.log(jugadorMuerto.id, "ha muerto");
      mapaJSON = eliminarDelMapa(mapaJSON, jugadorMuerto);
    } else {
      /*
        CAMBIO DE REGION
      */
      if (mapaJSON.map[posicionNueva.y][posicionNueva.x].region !== mapaJSON.map[jugador.position.y][jugador.position.x].region) {
        console.log("El jugador ha cambiado de region", jugador.id);
        // si la temperatura es mas mayor o igual de 25 grados sumamos 1 a la EC al nivel del jugador
        const temperaturaNueva = mapaJSON.regions[mapaJSON.map[posicionNueva.y][posicionNueva.x].region].temperature;
        if (temperaturaNueva >= 25) {
          console.log(jugador.id, "Ha cambiado de region y ha sumado a su nivel", jugador.EC);
          mapaJSON.players.forEach((player) => {
            if (player.id === jugador.id) {
              player.level = player.level + player.EC >= 0 ? player.level + player.EC : 0;
            }
          });
          mapaJSON.map[jugador.position.y][jugador.position.x].content.level =
            mapaJSON.map[jugador.position.y][jugador.position.x].content.level + jugador.EC >= 0 ?? 0;
        } else if (temperaturaNueva <= 10) {
          console.log(jugador.id, "Ha cambiado de region y ha sumado su nivel");
          mapaJSON.players.forEach((player) => {
            if (player.id === jugador.id) {
              player.level = player.level + player.EF >= 0 ? player.level + player.EF : 0;
            }
          });
          mapaJSON.map[jugador.position.y][jugador.position.x].content.level =
            mapaJSON.map[jugador.position.y][jugador.position.x].content.level + jugador.EF >= 0 ?? 0;
        }
      }
      /*
       ALIMENTO
      */
      if (mapaJSON.map[posicionNueva.y][posicionNueva.x].content.type === "Alimento") {
        mapaJSON.map[posicionNueva.y][posicionNueva.x].content = { type: "Jugador", id: jugador.id, level: jugador.level + 1 };
        mapaJSON.players.forEach((player) => {
          if (player.id === jugador.id) {
            player.level = jugador.level + 1;
          }
        });
        console.log(jugador.id, "ha comido");
      }
      // JUGADOR
      else if (mapaJSON.map[posicionNueva.y][posicionNueva.x].content.type === "Jugador") {
        console.log(jugador.id, "ha atacado a un jugador");
        // si el jugador actual tiene mas nivel que el otro jugador muere el que tenga menos nivel
        if (jugador.level > mapaJSON.map[posicionNueva.y][posicionNueva.x].content.level) {
          // ponemos el nivel del jugador que ha muerto
          let jugadorMuerto = null;
          mapaJSON.players.forEach((player) => {
            if (player.id === mapaJSON.map[posicionNueva.y][posicionNueva.x].content.id) {
              jugadorMuerto = player;
            }
          });
          console.log(jugadorMuerto.id, "ha muerto");
          mapaJSON = eliminarDelMapa(mapaJSON, jugadorMuerto);

          // se queda la casilla el que mas nivel tiene
          mapaJSON.map[posicionNueva.y][posicionNueva.x].content = { type: "Jugador", id: jugador.id, level: jugador.level };
        } else if (jugador.level < mapaJSON.map[posicionNueva.y][posicionNueva.x].content.level) {
          // ponemos el nivel del jugador que ha muerto
          let jugadorMuerto = null;
          mapaJSON.players.forEach((player) => {
            if (player.id === jugador.id) {
              jugadorMuerto = player;
            }
          });
          console.log(jugadorMuerto.id, "ha muerto");
          mapaJSON = eliminarDelMapa(mapaJSON, jugadorMuerto);
        } else {
          console.log("Los dos tienen el mismo nivel, no se muere nadie");
          mapaJSON.map[posicionNueva.y][posicionNueva.x].content = { type: "Jugador", id: jugador.id, level: jugador.level };
        }
      }
      // NPC
      else if (mapaJSON.map[posicionNueva.y][posicionNueva.x].content.type === "NPC") {
        console.log(jugador.id, "Ha atacado a un NPC");
        // si el jugador actual tiene mas nivel que el NPC muere el NPC
        if (jugador.level >= mapaJSON.map[posicionNueva.y][posicionNueva.x].content.level) {
          // eliminamos al NPC de la lista de NPCs
          mapaJSON.NPCs = mapaJSON.NPCs.filter((npc) => npc.id !== mapaJSON.map[posicionNueva.y][posicionNueva.x].content.id);
          console.log("El NPC ", mapaJSON.map[posicionNueva.y][posicionNueva.x].content.id, " ha muerto");
          // se queda la casilla el que mas nivel tiene
          mapaJSON.map[posicionNueva.y][posicionNueva.x].content = { type: "Jugador", id: jugador.id, level: jugador.level };
        } else {
          // ponemos el nivel del jugador que ha muerto
          let jugadorMuerto = null;
          mapaJSON.players.forEach((player) => {
            if (player.id === jugador.id) {
              jugadorMuerto = player;
            }
          });
          console.log(jugadorMuerto.id, "ha muerto");
          mapaJSON = eliminarDelMapa(mapaJSON, jugadorMuerto);
        }
      }
      //  MOVIMIENTO NORMAL
      else {
        mapaJSON.map[posicionNueva.y][posicionNueva.x].content = { type: "Jugador", id: jugador.id, level: jugador.level };
        console.log(jugador.id, "El jugador se ha movido");
      }

      // actualizamos el mapa
      mapaJSON.map[jugador.position.y][jugador.position.x].content = { type: null };
      // actualizamos la posicion del jugador
      mapaJSON.players.forEach((player) => {
        if (player.id === jugador.id) {
          player.position = posicionNueva;
        }
      });
    }

    // guardamos el mapa en la base de datos
    db.run("UPDATE Mapa SET Mapa = ? WHERE ID = ?", [JSON.stringify(mapaJSON), idPartida], function (err) {
      if (err) {
        console.error("Error al guardar el nuevo mapa:", err.message);
      } else {
        console.log("Mapa actualizado ID:", idPartida);
      }
    });

    return mapaJSON;
  }
};

const moverNPC = (mapaJSON, NPC, posicionNueva, idPartida) => {
  if (
    posicionNueva.x < 0 ||
    posicionNueva.x > 19 ||
    posicionNueva.y < 0 ||
    posicionNueva.y > 19 ||
    (mapaJSON.map[posicionNueva.y][posicionNueva.x].content.type !== "Jugador" &&
      mapaJSON.map[posicionNueva.y][posicionNueva.x].content.type !== null)
  ) {
    return mapaJSON;
  } else {
    if (mapaJSON.map[posicionNueva.y][posicionNueva.x].content.type === "Jugador") {
      console.log(NPC.id, "Ha atacado a un Jugador");
      // si el jugador actual tiene mas nivel que el NPC muere el NPC
      if (NPC.level < mapaJSON.map[posicionNueva.y][posicionNueva.x].content.level) {
        mapaJSON.map[NPC.position.y][NPC.position.x].content = { type: null };
        // eliminamos al NPC de la lista de NPCs
        mapaJSON.NPCs = mapaJSON.NPCs.filter((npc) => npc.id !== NPC.id);
        console.log("El NPC ", NPC.id, " ha muerto");
      } else {
        // eliminamos al jugador de la lista de jugadores
        let jugadorMuerto = null;
        mapaJSON.players.forEach((player) => {
          if (player.id === mapaJSON.map[posicionNueva.y][posicionNueva.x].content.id) {
            jugadorMuerto = player;
          }
        });
        console.log(jugadorMuerto.id, "ha muerto");
        mapaJSON = eliminarDelMapa(mapaJSON, jugadorMuerto);
        // actualizamos la posicion del NPC
        mapaJSON.map[NPC.position.y][NPC.position.x].content = { type: null };
        mapaJSON.map[posicionNueva.y][posicionNueva.x].content = { type: "NPC", id: NPC.id, level: NPC.level };
        mapaJSON.NPCs.forEach((npc) => {
          if (npc.id === NPC.id) {
            npc.position = posicionNueva;
          }
        });
      }
    } else {
      mapaJSON.map[posicionNueva.y][posicionNueva.x].content = { type: "NPC", id: NPC.id, level: NPC.level };
      mapaJSON.map[NPC.position.y][NPC.position.x].content = { type: null };
      // actualizamos la posicion del jugador
      mapaJSON.NPCs.forEach((npc) => {
        if (npc.id === NPC.id) {
          npc.position = posicionNueva;
        }
      });
    }

    // guardamos el mapa en la base de datos
    db.run("UPDATE Mapa SET Mapa = ? WHERE ID = ?", [JSON.stringify(mapaJSON), idPartida], function (err) {
      if (err) {
        console.error("Error al guardar el nuevo mapa:", err.message);
      } else {
        console.log("Mapa actualizado ID:", idPartida);
      }
    });

    console.log("El NPC se ha movido a la posicion ", posicionNueva.x, posicionNueva.y, "ID:", NPC.id, "Nivel:", NPC.level);

    return mapaJSON;
  }
};

// FUNCION QUE elimina A UN JUGADOR del mapa
const eliminarDelMapa = (mapaJSON, jugador) => {
  mapaJSON.map[jugador.position.y][jugador.position.x].content = { type: null };
  // quitar jugador del array de jugadores y dejar el array de jugadores solo con los jugadores vivos
  mapaJSON.players = mapaJSON.players.filter((player) => player.id !== jugador.id);
  return mapaJSON;
};

module.exports = {
  obtenerDatosTiempo,
  obtenerDatosTiempoAleatorio,
  obtenerDatosTiempoCiudadesAleatorias,
  getMapaFromDatabase,
  moverJugador,
  eliminarDelMapa,
  moverNPC,
};
