const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const app = express();
const args = process.argv.slice(2);
const db = require("../database/db");

app.use(express.json());

const server = http.createServer(app);
const io = socketIO(server);

io.on("connection", (socket) => {
  console.log("Nuevo cliente conectado");

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

app.post("/registro", (req, res) => {
  const { alias, password, nivel, EF, EC } = req.body;

  if (!alias || !password || !nivel || !EF || !EC) {
    const atributosFaltantes = [];
    if (!alias) atributosFaltantes.push("alias");
    if (!password) atributosFaltantes.push("password");
    if (!nivel) atributosFaltantes.push("nivel");
    if (!EF) atributosFaltantes.push("EF");
    if (!EC) atributosFaltantes.push("EC");
    return res
      .status(400)
      .json({
        error: "Faltan los siguientes atributos: " + atributosFaltantes.join(", "),
      });
  }

  // Verificar si el alias ya existe en la base de datos
  db.get("SELECT id FROM jugadores WHERE alias = ?", alias, (err, row) => {
    if (err) {
      console.error(err.message);
      return res
        .status(500)
        .send("Error al verificar el alias del jugador");
    }

    if (row) {
      // El alias ya existe, mostrar un error
      return res.status(409).send("El alias ya está registrado");
    }

    // El alias no existe, registrar el jugador
    db.run(
      "INSERT INTO jugadores (alias, password, nivel, EF, EC) VALUES (?, ?, ?, ?, ?)",
      [alias, password, nivel, EF, EC],
      (err) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send("Error al registrar el jugador");
        }

        console.log("Jugador registrado correctamente");
        io.emit("jugadorRegistrado", { alias });
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

const port = args[0] ? parseInt(args[0], 10) : 3000;

server.listen(port, () => {
  console.log(`Servidor de Registro escuchando en el puerto ${port}`);
});
