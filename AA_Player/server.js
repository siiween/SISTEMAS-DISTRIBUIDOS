const readline = require("readline");
const io = require("socket.io-client");
const args = process.argv.slice(2);
const enginePort = args[0] ? parseInt(args[0], 10) : "http://localhost:3000";
const kafkaPort = args[1] ? parseInt(args[1], 10) : "http://localhost:6000";
const registryPort = args[2] ? parseInt(args[2], 10) : "http://localhost:7000";
let mapaActual = null;
let UsuarioLogeado = false;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Mostrar opciones por consola
const mostrarMenu = () => {
  console.log("Seleccione una opción:");
  console.log("1. Crear un nuevo jugador");
  console.log("2. Editar un jugador existente");
  console.log("3. Unirse a la partida");
  console.log("0. Salir");
};

// Manejar entrada del usuario
const manejarEntrada = (opcion) => {
  switch (opcion) {
    case "1":
      // Crear un nuevo jugador
      registrarJugador();
      break;
    case "2":
      // Editar un jugador
      editarJugador();
      break;
    case "3":
      // Unirse a la partida
      unirsePartida();
      break;
    case "0":
      // Salir
      process.exit(0);
    default:
      console.log("Opción inválida");
      mostrarMenu();
      break;
  }
};

// Manejar entrada del usuario
const manejarEntradaPartida = (opcion) => {
  switch (opcion) {
    case "w":
    case "x":
    case "a":
    case "d":
    case "q":
    case "e":
    case "z":
    case "c":
      movimiento(opcion);
      return;
    default:
      console.log("Movimiento inválido");
      partidaIniciada();
      break;
  }
};

const movimiento = (opcion) => {
  console.log(`Movimiento ${opcion}`);
  partidaIniciada();
};

const registrarJugador = () => {
  // Establecer conexión con el servidor de registro
  const socket = io(registryPort);

  rl.question("Alias: ", (alias) => {
    rl.question("Contraseña: ", (password) => {
      rl.question("Nivel: ", (nivel) => {
        rl.question("EF: ", (ef) => {
          rl.question("EC: ", (ec) => {
            const jugador = {
              alias,
              password,
              nivel,
              EF: ef,
              EC: ec,
            };
            // Enviar evento de creación de jugador al servidor de registro
            try {
              socket.emit("createPlayer", jugador);
              console.log("Jugador creado con éxito");
            } catch (error) {
              console.log(error);
            }
            rl.question("Presione enter para continuar...", () => {
              mostrarMenu();
            });
          });
        });
      });
    });
  });
};

const editarJugador = () => {
  // Establecer conexión con el servidor de registro
  const socket = io("registryPort");

  rl.question("Alias: ", (alias) => {
    rl.question("Contraseña: ", (password) => {
      rl.question("Nivel: ", (nivel) => {
        rl.question("EF: ", (ef) => {
          rl.question("EC: ", (ec) => {
            const jugador = {
              alias,
              password,
              nivel,
              EF: ef,
              EC: ec,
            };

            try {
              socket.emit("editPlayer", jugador);
              console.log("Jugador editado correctamente");
            } catch (error) {
              console.log(error);
            }
            rl.question("Presione enter para continuar...", () => {
              mostrarMenu();
            });
          });
        });
      });
    });
  });
};

const unirsePartida = () => {
  // Establecer conexión con el servidor de registro
  const socket = io(enginePort);

  rl.question("Alias: ", (alias) => {
    rl.question("Contraseña: ", (password) => {
      const jugadorAut = { alias, password };

      try {
        socket.emit("autPlayer", jugadorAut);
      } catch (error) {
        console.log(error);
      }

      socket.on("registrationError", (data) => {
        console.log("Error:", data.error);
        mostrarMenu();
      });

      socket.on("registrationSuccess", (e) => {
        UsuarioLogeado = true;

        if (e.status) {
          console.log(e.message);
          mapaActual = e.map;
          partidaIniciada();
        } else {
          console.log(e.message);
          console.log("Esperando a inciar partida... pulsa 0 para salir de la cola de espera");
        }
      });
    });
  });
};

const partidaIniciada = () => {
  drawMap(mapaActual);
  console.log("Mueve al jugador a una dirección: ");
};

// Mostrar el menú inicial
mostrarMenu();
// Leer la entrada del usuario
rl.on("line", (input) => {
  if (UsuarioLogeado) manejarEntradaPartida(input.trim());
  else manejarEntrada(input.trim());
});

const drawMap = (mapa) => {
  console.clear();
  if (mapa) {
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
  } else {
    console.log("Lo siento no hay mapa disponible");
  }
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
