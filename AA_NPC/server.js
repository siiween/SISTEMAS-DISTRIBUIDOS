const readline = require("readline");
const io = require("socket.io-client");
// Lectura del terminal, parametros
const args = process.argv.slice(2);
const enginePort = args[0] ? parseInt(args[0], 10) : "http://localhost:3000";
const kafkaPort = args[1] ? parseInt(args[1], 10) : "http://localhost:6000";
// estado de la partida
let codigo = null;

const socket = io(enginePort);

const movimientos = {
  0: "q",
  1: "w",
  2: "e",
  3: "a",
  4: "d",
  5: "z",
  6: "x",
  7: "c",
};

const conectarNpc = () => {
  socket.emit("connectNpc", "npc");
  let respuestaRecibida = false;
  socket.on("connectNpcResponse", (response) => {
    // Se ha recibido una respuesta, se cancela el temporizador
    clearTimeout(timeout);
    if (!respuestaRecibida) {
      respuestaRecibida = true;
      if (response.success) {
        console.log("NPC añadido correctamente con codigo: " + response.codigo);
        codigo = response.codigo;

        // se tiene que ejecutar cada 5 segundos para enviar un movimiento aleatorio
        setInterval(enviarMovimiento, 5000);
      } else {
        console.log(response.error);
        console.log("Error al añadir al NPC");
      }
    }
  });

  const timeout = setTimeout(() => {
    if (!respuestaRecibida) {
      console.log("El servidor principal no está disponible en este momento");
      process.exit(0);
    }
  }, 3000); // Tiempo de espera en milisegundos (en este ejemplo, 3 segundos)
};

// si tenemos el codigo enviamos un movimiento aleatorio cada 5 segundos
const enviarMovimiento = () => {
  if (codigo) {
    const movimiento = movimientos[Math.floor(Math.random() * 8)];
    console.log("movimineto: " + movimiento);
    socket.emit("moveNpc", { codigo: codigo, movimiento: movimiento });

    let respuestaRecibida = false;
    // esperar respuesta del servidor
    socket.on("moveNpcResponse", (response) => {
      clearTimeout(timeout);
      if (!respuestaRecibida) {
        if (response.success) {
          console.log("movimiento ejecutado correctamente");
        } else if (response.dead) {
          console.log("El NPC ha muerto");
          process.exit(0);
        } else {
          console.log("Error al ejecutar el movimiento");
        }
        respuestaRecibida = true;
      }
    });

    const timeout = setTimeout(() => {
      if (!respuestaRecibida) {
        console.log("El servidor principal no está disponible en este momento");
        process.exit(0);
      }
    }, 3000); // Tiempo de espera en milisegundos (en este ejemplo, 5 segundos)
  } else {
    process.exit(0);
  }
};

conectarNpc();
