const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Obtiene la ruta absoluta del archivo de la base de datos
const databasePath = path.resolve(__dirname, "database.db");

// Crea la conexión a la base de datos
const db = new sqlite3.Database(databasePath);

// Realiza cualquier configuración adicional de la base de datos aquí

// Exporta la conexión para que pueda ser utilizada en otros archivos
module.exports = db;
