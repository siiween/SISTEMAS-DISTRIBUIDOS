const readline = require('readline');
const io = require('socket.io-client');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Conectarse al servidor de sockets
const socket = io.connect('http://localhost:3000');

// Mostrar opciones por consola
function mostrarMenu() {
  console.log('Seleccione una opción:');
  console.log('1. Crear un nuevo jugador');
  console.log('2. Editar un jugador existente');
  console.log('3. Unirse a la partida');
  console.log('4. Moverse en el mapa');
  console.log('0. Salir');
}

// Manejar entrada del usuario
function manejarEntrada(opcion) {
  switch (opcion) {
    case '1':
      // Lógica para crear un nuevo jugador
      console.log('Creando un nuevo jugador...');
      registrarJugador();
      break;
    case '2':
      // Lógica para editar un jugador existente
      console.log('Editar un jugador existente...');
      break;
    case '3':
      // Lógica para unirse a la partida
      console.log('Unirse a la partida...');
      break;
    case '4':
      // Lógica para moverse en el mapa
      console.log('Moverse en el mapa...');
      break;
    case '0':
      // Salir
      console.log('Saliendo del programa...');
      rl.close();
      return;
    default:
      console.log('Opción inválida');
      break;
  }

  // Volver a mostrar el menú
  mostrarMenu();
}

// Mostrar el menú inicial
mostrarMenu();

// Leer la entrada del usuario
rl.on('line', (input) => {
  manejarEntrada(input.trim());
});

// Función para registrar un nuevo jugador
function registrarJugador() {
  rl.question('Alias: ', (alias) => {
    rl.question('Contraseña: ', (password) => {
      rl.question('Nivel: ', (nivel) => {
        rl.question('EF: ', (ef) => {
          rl.question('EC: ', (ec) => {
            const jugador = {
              alias,
              password,
              nivel,
              EF: ef,
              EC: ec
            };
            console.log(jugador);
            socket.emit('createPlayer', jugador); // Emitir evento "createPlayer" al servidor
          });
        });
      });
    });
  });
}

// Escuchar eventos del servidor
socket.on('connect', () => {
  console.log('Conectado al servidor');
});

socket.on('disconnect', () => {
  console.log('Desconectado del servidor');
});

socket.on('playerCreated', (message) => {
  console.log(message);
});

socket.on('playerEdited', (message) => {
  console.log(message);
});

socket.on('playerJoinedGame', (message) => {
  console.log(message);
});

socket.on('playerMoved', (message) => {
  console.log(message);
});
