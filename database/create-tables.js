const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("database.db"); // Nombre del archivo de la base de datos

// Define las consultas de creación de tablas
const createJugadoresTable = `CREATE TABLE IF NOT EXISTS Jugadores (
  ID INTEGER PRIMARY KEY,
  Alias TEXT,
  Password TEXT,
  Nivel INTEGER,
  EF INTEGER,
  EC INTEGER
)`;

const createMapaTable = `CREATE TABLE IF NOT EXISTS Mapa (
  ID INTEGER PRIMARY KEY,
  Mapa BLOB
)`;

// Ejecuta las consultas de creación de tablas
db.serialize(() => {
  db.run(createJugadoresTable, (err) => {
    if (err) console.error("Error al crear la tabla Jugadores");
    else console.log("Tabla Jugadores creada correctamente");
  });

  db.run(createMapaTable, (err) => {
    if (err) console.error("Error al crear la tabla Mapa");
    else console.log("Tabla Mapa creada correctamente");
  });
});

// Cierra la conexión a la base de datos
db.close();
