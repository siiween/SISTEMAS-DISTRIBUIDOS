const readline = require('readline');
const axios = require('axios');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

            axios.post('http://localhost:3000/registro', jugador)
              .then(response => {
                console.log(response.data);
              })
              .catch(error => {
                console.error('Error al registrar el jugador:', error.message);
              })
              .finally(() => {
                mostrarMenu();
              });
          });
        });
      });
    });
  });
}

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const port = 3000;

// Rutas para el jugador
app.get('/', (req, res) => {
  res.send('¡Bienvenido a Against All!');
});

// Manejar conexión de sockets
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');

  // Evento para crear un nuevo jugador
  socket.on('createPlayer', () => {
    // Lógica para crear un nuevo jugador

    // Emitir evento de confirmación al cliente
    socket.emit('playerCreated', 'Jugador creado');
  });

  // Evento para editar un jugador existente
  socket.on('editPlayer', (playerId) => {
    // Lógica para editar un jugador existente

    // Emitir evento de confirmación al cliente
    socket.emit('playerEdited', `Jugador ${playerId} editado`);
  });

  // Evento para que un jugador se una a la partida
  socket.on('joinGame', (playerId) => {
    // Lógica para que un jugador se una a la partida

    // Emitir evento de confirmación al cliente
    socket.emit('playerJoinedGame', `Jugador ${playerId} unido a la partida`);
  });

  // Evento para que un jugador se mueva en el mapa
  socket.on('movePlayer', ({ playerId, direction }) => {
    // Lógica para que un jugador se mueva en el mapa

    // Emitir evento de confirmación al cliente
    socket.emit('playerMoved', `Jugador ${playerId} se movió en dirección ${direction}`);
  });
});

// Iniciar el servidor
server.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
