const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Mostrar opciones por consola
function mostrarMenu() {
  console.log("Seleccione una opción:");
  console.log("1. Crear un nuevo jugador");
  console.log("2. Editar un jugador existente");
  console.log("3. Unirse a la partida");
  console.log("4. Moverse en el mapa");
  console.log("0. Salir");
}

// Manejar entrada del usuario
function manejarEntrada(opcion) {
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
    case "4":
      // Mover jugador
      moverJugador();
      break;
    case "0":
      // Salir
      rl.close();
      return;
    default:
      console.log("Opción inválida");
      mostrarMenu();
      break;
  }
}

const registrarJugador = () => {
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
            console.log(jugador);
            console.log("Nuevo jugador registrado con éxito");
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
  console.log("Jugador editado con éxito");
  rl.question("Presione enter para continuar...", () => {
    mostrarMenu();
  });
};

const unirsePartida = () => {
  console.log("Unirse a la partida");
  rl.question("Presione enter para continuar...", () => {
    mostrarMenu();
  });
};

const moverJugador = () => {
  console.log("Mover Jugador");
  rl.question("Presione enter para continuar...", () => {
    mostrarMenu();
  });
};

// Mostrar el menú inicial
mostrarMenu();
// Leer la entrada del usuario
rl.on("line", (input) => {
  manejarEntrada(input.trim());
});
