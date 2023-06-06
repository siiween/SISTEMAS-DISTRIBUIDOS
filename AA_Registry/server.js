const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const args = process.argv.slice(2);
const port = args[0] ? parseInt(args[0], 10) : 3000;
const db = new sqlite3.Database("database.db"); // Nombre del archivo de la base de datos

db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS jugadores (id INTEGER PRIMARY KEY AUTOINCREMENT, alias TEXT, password TEXT, nivel INTEGER, EF INTEGER, E INTEGER)"
  );
});

app.use(express.json());

app.post("/registro", (req, res) => {
  const { alias, password, nivel, EF, E } = req.body;

  if (!alias || !password || !nivel || !EF || !E) {
    const atributosFaltantes = [];
    if (!alias) atributosFaltantes.push("alias");
    if (!password) atributosFaltantes.push("password");
    if (!nivel) atributosFaltantes.push("nivel");
    if (!EF) atributosFaltantes.push("EF");
    if (!E) atributosFaltantes.push("E");
    return res.status(400).json({ error: "Faltan los siguientes atributos: " + atributosFaltantes.join(", ") });
  }

  // Verificar si el alias ya existe en la base de datos
  db.get("SELECT id FROM jugadores WHERE alias = ?", alias, (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send("Error al verificar el alias del jugador");
    }

    if (row) {
      // El alias ya existe, mostrar un error
      return res.status(409).send("El alias ya está registrado");
    }

    // El alias no existe, registrar el jugador
    db.run(
      "INSERT INTO jugadores (alias, password, nivel, EF, E) VALUES (?, ?, ?, ?, ?)",
      [alias, password, nivel, EF, E],
      (err) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send("Error al registrar el jugador");
        }

        return res.send("Jugador registrado correctamente");
      }
    );
  });
});

app.get("/jugadores", (req, res) => {
  db.all("SELECT * FROM jugadores", (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send("Error al obtener los jugadores");
    }

    return res.json(rows);
  });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
