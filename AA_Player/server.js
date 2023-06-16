const util = require("./util");
const readline = require("readline");
const io = require("socket.io-client");
// Lectura del terminal, parametros
const args = process.argv.slice(2);
const enginePort = args[0] ? parseInt(args[0], 10) : "http://localhost:3000";
const kafkaPort = args[1] ? parseInt(args[1], 10) : "http://localhost:6000";
const registryPort = args[2] ? parseInt(args[2], 10) : "http://localhost:7000";
// estado de la partida
let mapaActual = null;
let UsuarioLogeado = false;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Manejar entrada del usuario
const manejarEntradaInicial = (opcion) => {
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
      util.mostrarMenu();
      break;
  }
};

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

const partidaIniciada = () => {
  util.drawMap(mapaActual);
  console.log("Mueve al jugador a una dirección: ");
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
              util.mostrarMenu();
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
              util.mostrarMenu();
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
        util.mostrarMenu();
      });

      socket.on("registrationSuccess", (e) => {
        UsuarioLogeado = true;

        if (e.status) {
          console.log(e.message);
          mapaActual = e.map;
          partidaIniciada(mapaActual);
        } else {
          console.log(e.message);
          console.log("Esperando a inciar partida... pulsa 0 para salir de la cola de espera");
        }
      });
    });
  });
};

// Mostrar el menú inicial
util.mostrarMenu();
// Leer la entrada del usuario
rl.on("line", (input) => {
  if (UsuarioLogeado) manejarEntradaPartida(input.trim());
  else manejarEntradaInicial(input.trim());
});
