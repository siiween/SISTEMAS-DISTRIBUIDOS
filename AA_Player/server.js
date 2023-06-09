const util = require("./util");
const readline = require("readline");
const io = require("socket.io-client");
// Lectura del terminal, parametros
const args = process.argv.slice(2);
const enginePort = args[0] ?? "http://localhost:3000";
const kafkaPort = args[1] ?? "http://localhost:9092";
const registryPort = args[2] ?? "http://localhost:7000";
// estado de la partida
let mapaActual = null;
let UsuarioLogeado = false;
let userName = null;

console.log(enginePort, kafkaPort, registryPort);

const socket = io(enginePort);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Manejar entrada del usuario
const manejarEntradaInicial = (opcion) => {
  switch (opcion) {
    case "1":
      registrarJugador();
      break;
    case "2":
      editarJugador();
      break;
    case "3":
      unirsePartida();
      break;
    case "0":
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
    case "0":
    case 0:
      salirPartida();
      break;
    default:
      console.log("Movimiento inválido");
      partidaIniciada();
      break;
  }
};

const partidaIniciada = () => {
  util.drawMap(mapaActual);
  console.log("Mueve al jugador a una dirección (pulse 0 para salir de la partida): ");
};

const salirPartida = () => {
  if (userName) {
    // Bandera para controlar si se ha recibido una respuesta del servidor de registro
    let respuestaRecibida = false;
    try {
      socket.emit("leavePlayer");
      // Escuchar eventos de respuesta del servidor de registro
      socket.on("leavePlayerResponse", (response) => {
        // Se ha recibido una respuesta, se cancela el temporizador
        clearTimeout(timeout);
        if (!respuestaRecibida) {
          respuestaRecibida = true;
          if (response.success) {
            console.log("Ha salido de la partida");
          } else {
            console.log("No ha podido salir de la partida");
          }
          mapaActual = null;
          UsuarioLogeado = false;
          rl.question("Presione enter para continuar...", () => {
            console.clear();
            util.mostrarMenu();
          });
        }
      });
      const timeout = setTimeout(() => {
        if (!respuestaRecibida) {
          console.log("El servidor de Juego no está disponible en este momento");
          mapaActual = null;
          UsuarioLogeado = false;
          rl.question("Presione enter para continuar...", () => {
            util.mostrarMenu();
          });
        }
      }, 3000); // Tiempo de espera en milisegundos (en este ejemplo, 5 segundos)
    } catch (error) {
      console.log(error);
      console.log("Error al enviar lel movimiento del jugador");
    }
  }
};

const movimiento = (opcion) => {
  if (userName) {
    // Bandera para controlar si se ha recibido una respuesta del servidor de registro
    let respuestaRecibida = false;
    try {
      socket.emit("movePlayer", { userName, opcion });
      // Escuchar eventos de respuesta del servidor de registro
      socket.on("movePlayerResponse", (response) => {
        // Se ha recibido una respuesta, se cancela el temporizador
        clearTimeout(timeout);
        if (!respuestaRecibida) {
          respuestaRecibida = true;
          if (response.dead === false) {
            mapaActual = response.map;
            partidaIniciada();
          } else {
            console.log("Ha sido eliminado de la partida");
            mapaActual = null;
            UsuarioLogeado = false;
            rl.question("Presione enter para continuar...", () => {
              console.clear();
              util.mostrarMenu();
            });
          }
        }
      });
      const timeout = setTimeout(() => {
        if (!respuestaRecibida) {
          console.log("El servidor de Juego no está disponible en este momento");
          mapaActual = null;
          UsuarioLogeado = false;
          rl.question("Presione enter para continuar...", () => {
            util.mostrarMenu();
          });
        }
      }, 3000); // Tiempo de espera en milisegundos (en este ejemplo, 5 segundos)
    } catch (error) {
      console.log(error);
      console.log("Error al enviar lel movimiento del jugador");
    }
  }
};

const registrarJugador = () => {
  rl.question("Alias: ", (alias) => {
    rl.question("Contraseña: ", (password) => {
      rl.question("EF: ", (ef) => {
        rl.question("EC: ", (ec) => {
          const jugador = {
            alias,
            password,
            nivel: 1,
            EF: ef,
            EC: ec,
          };
          // Establecer conexión con el servidor de registro
          const socket = io(registryPort);
          // Bandera para controlar si se ha recibido una respuesta del servidor de registro
          let respuestaRecibida = false;
          // Enviar evento de creación de jugador al servidor de registro
          socket.emit("createPlayer", jugador);
          // Escuchar evento de respuesta del servidor de registro
          socket.on("registrationResponse", (response) => {
            // Se ha recibido una respuesta, se cancela el temporizador
            clearTimeout(timeout);
            if (!respuestaRecibida) {
              respuestaRecibida = true;
              if (response.success) {
                console.log("Jugador creado con éxito");
              } else {
                console.log(response.error);
              }
              rl.question("Presione enter para continuar...", () => {
                util.mostrarMenu();
              });
            }
          });
          const timeout = setTimeout(() => {
            if (!respuestaRecibida) {
              console.log("El servidor de registro no está disponible en este momento");
              rl.question("Presione enter para continuar...", () => {
                util.mostrarMenu();
              });
            }
          }, 3000); // Tiempo de espera en milisegundos (en este ejemplo, 5 segundos)
        });
      });
    });
  });
};

const editarJugador = () => {
  rl.question("Alias: ", (alias) => {
    rl.question("Contraseña: ", (password) => {
      rl.question("EF: ", (ef) => {
        rl.question("EC: ", (ec) => {
          const jugador = {
            alias,
            password,
            EF: ef,
            EC: ec,
          };
          // Establecer conexión con el servidor de registro
          const socket = io(registryPort);
          // Bandera para controlar si se ha recibido una respuesta del servidor de registro
          let respuestaRecibida = false;
          try {
            // Enviar evento de edición de jugador al servidor de registro
            socket.emit("editPlayer", jugador);
            // Escuchar evento de respuesta del servidor de registro
            socket.on("editPlayerResponse", (response) => {
              // Se ha recibido una respuesta, se cancela el temporizador
              clearTimeout(timeout);
              if (!respuestaRecibida) {
                respuestaRecibida = true;
                if (response.success) {
                  console.log("Jugador editado correctamente");
                } else {
                  console.log(response.error);
                  console.log("Error al editar el jugador");
                }
                rl.question("Presione enter para continuar...", () => {
                  util.mostrarMenu();
                });
              }
            });

            const timeout = setTimeout(() => {
              if (!respuestaRecibida) {
                console.log("El servidor de registro no está disponible en este momento");
                rl.question("Presione enter para continuar...", () => {
                  util.mostrarMenu();
                });
              }
            }, 3000); // Tiempo de espera en milisegundos (en este ejemplo, 5 segundos)
          } catch (error) {
            console.log(error);
            console.log("Error al editar el jugador");
            rl.question("Presione enter para continuar...", () => {
              util.mostrarMenu();
            });
          }
        });
      });
    });
  });
};

const unirsePartida = () => {
  rl.question("Alias: ", (alias) => {
    rl.question("Contraseña: ", (password) => {
      const jugadorAut = { alias, password };
      // Bandera para controlar si se ha recibido una respuesta del servidor de registro
      let respuestaRecibida = false;
      try {
        // Enviar evento de autenticación de jugador al servidor de registro
        socket.emit("autPlayer", jugadorAut);
        // Escuchar eventos de respuesta del servidor de registro
        socket.on("registrationError", (data) => {
          // Se ha recibido una respuesta, se cancela el temporizador
          clearTimeout(timeout);
          if (!respuestaRecibida) {
            respuestaRecibida = true;
            console.log("Error:", data.error);
            util.mostrarMenu();
          }
        });
        socket.on("registrationSuccess", (e) => {
          // Se ha recibido una respuesta, se cancela el temporizador
          clearTimeout(timeout);
          if (!respuestaRecibida) {
            respuestaRecibida = true;
            UsuarioLogeado = true;
            if (e.status) {
              console.log(e.message);
              mapaActual = e.map;
              userName = alias;
              partidaIniciada();
            } else {
              console.log(e.message);
              console.log("Esperando para iniciar partida... pulsa 0 para salir de la cola de espera");
            }
          }
        });

        const timeout = setTimeout(() => {
          if (!respuestaRecibida) {
            console.log("El servidor de Juego no está disponible en este momento");
            rl.question("Presione enter para continuar...", () => {
              util.mostrarMenu();
            });
          }
        }, 3000); // Tiempo de espera en milisegundos (en este ejemplo, 5 segundos)
      } catch (error) {
        console.log(error);
        console.log("Error al enviar la autenticación del jugador");
        rl.question("Presione enter para continuar...", () => {
          util.mostrarMenu();
        });
      }
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
