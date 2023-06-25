const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const bcrypt = require("bcrypt");
const winston = require("winston");
const app = express();
const args = process.argv.slice(2);
const port = args[0] ? parseInt(args[0], 10) : 7000;
const db = require("../database/db");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: "logs.log" })],
});

app.use(express.json());

const server = http.createServer(app);
const io = socketIO(server);

io.on("connection", (socket) => {
  logger.info("Nuevo cliente conectado");

  socket.on("disconnect", () => {
    logger.info("Cliente desconectado");
  });

  socket.on("createPlayer", async (jugador) => {
    try {
      const { alias, password, nivel, EF, EC } = jugador;

      if (!alias || !password || !EF || !EC || !nivel) {
        const atributosFaltantes = [];
        if (!alias) atributosFaltantes.push("alias");
        if (!password) atributosFaltantes.push("password");
        if (!EF) atributosFaltantes.push("EF");
        if (!EC) atributosFaltantes.push("EC");

        logger.error("Error al crear el jugador", { error: "Faltan atributos" });
        return socket.emit("registrationResponse", {
          error: "Faltan los siguientes atributos: " + atributosFaltantes.join(", "),
        });
      }

      if (alias.length > 20 || !/^[0-9a-zA-Z]+$/.test(alias)) {
        logger.error("Error al crear el jugador", { error: "Alias no válido" });
        return socket.emit("registrationResponse", {
          error: "El alias debe tener hasta 20 caracteres y solo puede contener números y letras.",
        });
      }

      if (EF < -10 || EF > 10 || EC < -10 || EC > 10) {
        logger.error("Error al crear el jugador", { error: "EC o EF invalidos" });
        return socket.emit("registrationResponse", {
          error: "EF y EC deben ser valores entre -10 y 10.",
        });
      }

      db.get("SELECT id FROM jugadores WHERE alias = ?", jugador.alias, async (err, row) => {
        if (row) {
          const response = {
            success: false,
            error: "El alias ya está registrado",
          };
          socket.emit("registrationResponse", response);
          return;
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await db.run("INSERT INTO jugadores (alias, password, nivel, EF, EC) VALUES (?, ?, ?, ?, ?)", [alias, hashedPassword, nivel, EF, EC]);

        logger.info("Jugador registrado correctamente", {
          alias: jugador.alias,
          nivel: jugador.nivel,
          EF: jugador.EF,
          EC: jugador.EC,
        });

        const response = {
          success: true,
        };
        socket.emit("registrationResponse", response);
        const playerData = {
          alias: jugador.alias,
          nivel: jugador.nivel,
          EF: jugador.EF,
          EC: jugador.EC,
        };
        io.emit("playerRegistered", playerData);
      });
    } catch (error) {
      logger.error("Error al crear el jugador", { error: error.message });
      const response = {
        success: false,
        error: "Error al crear el jugador",
      };
      socket.emit("registrationResponse", response);
    }
  });

  socket.on("editPlayer", ({ alias, password, EF, EC }) => {
    if (!alias || !password || !EF || !EC) {
      const atributosFaltantes = [];
      if (!alias) atributosFaltantes.push("alias");
      if (!password) atributosFaltantes.push("password");
      if (!EF) atributosFaltantes.push("EF");
      if (!EC) atributosFaltantes.push("EC");
      return socket.emit("editPlayerResponse", {
        error: "Faltan los siguientes atributos: " + atributosFaltantes.join(", "),
      });
    }

    if (alias.length > 20 || !/^[0-9a-zA-Z]+$/.test(alias)) {
      return socket.emit("editPlayerResponse", {
        error: "El alias debe tener hasta 20 caracteres y solo puede contener números y letras.",
      });
    }

    if (EF < -10 || EF > 10 || EC < -10 || EC > 10) {
      return socket.emit("editPlayerResponse", {
        error: "EF y EC deben ser valores entre -10 y 10.",
      });
    }

    db.get("SELECT password FROM jugadores WHERE alias = ?", [alias], (err, row) => {
      if (err) {
        logger.error("Error en la consulta a la base de datos", { error: err.message });
        return socket.emit("editPlayerResponse", {
          error: "Error en la consulta a la base de datos",
        });
      }
      if (!row) {
        logger.error("Error al editar el jugador");
        return socket.emit("editPlayerResponse", {
          error: "Error al editar el jugador",
        });
      } else {
        const contrasenaCoincide = bcrypt.compareSync(password, row.Password);

        if (!contrasenaCoincide) {
          return socket.emit("editPlayerResponse", {
            error: "Error al editar el jugador",
          });
        } else {
          db.run("UPDATE jugadores SET  EF = ?, EC = ? WHERE alias = ?", [EF, EC, alias], (err) => {
            if (err) {
              logger.error("Error al editar el jugador", { error: err.message });
              return socket.emit("editPlayerResponse", {
                error: "Error al editar el jugador",
              });
            }
            logger.info("Jugador editado correctamente", { alias: alias });
            socket.emit("editPlayerResponse", { success: true });
          });
        }
      }
    });
  });
});

app.post("/createPlayer", async (req, res) => {
  try {
    const { alias, password, EF, EC } = req.body;

    if (!alias || !password || !EF || !EC) {
      const atributosFaltantes = [];
      if (!alias) atributosFaltantes.push("alias");
      if (!password) atributosFaltantes.push("password");
      if (!EF) atributosFaltantes.push("EF");
      if (!EC) atributosFaltantes.push("EC");
      return res.json({
        error: "Faltan los siguientes atributos: " + atributosFaltantes.join(", "),
      });
    }

    const nivel = 1;

    db.get("SELECT id FROM jugadores WHERE alias = ?", alias, async (err, row) => {
      if (row) {
        const response = {
          success: false,
          error: "El alias ya está registrado",
        };
        res.json(response);
        return;
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      await db.run("INSERT INTO jugadores (alias, password, nivel, EF, EC) VALUES (?, ?, ?, ?, ?)", [alias, hashedPassword, nivel, EF, EC]);

      logger.info("Jugador registrado correctamente", {
        alias: alias,
        nivel: nivel,
        EF: EF,
        EC: EC,
      });

      const response = {
        success: true,
      };
      res.json(response);
    });
  } catch (error) {
    logger.error("Error al crear el jugador", { error: error.message });
    const response = {
      success: false,
      error: "Error al crear el jugador",
    };
    res.json(response);
  }
});

app.put("/editPlayer", async (req, res) => {
  try {
    const { alias, password, EF, EC } = req.body;

    if (!alias || !password || !EF || !EC) {
      const atributosFaltantes = [];
      if (!alias) atributosFaltantes.push("alias");
      if (!password) atributosFaltantes.push("password");
      if (!EF) atributosFaltantes.push("EF");
      if (!EC) atributosFaltantes.push("EC");
      return res.json({
        error: "Faltan los siguientes atributos: " + atributosFaltantes.join(", "),
      });
    }

    db.get("SELECT password FROM jugadores WHERE alias = ?", alias, (err, row) => {
      if (err) {
        logger.error("Error en la consulta a la base de datos", { error: err.message });
        return res.json({
          error: "Error en la consulta a la base de datos",
        });
      }
      if (!row) {
        logger.error("Error al editar el jugador");
        return res.json({
          error: "Error al editar el jugador",
        });
      } else {
        const contrasenaCoincide = bcrypt.compareSync(password, row.Password);

        if (!contrasenaCoincide) {
          return res.json({
            error: "Error al editar el jugador",
          });
        } else {
          db.run("UPDATE jugadores SET EF = ?, EC = ? WHERE alias = ?", [EF, EC, alias], (err) => {
            if (err) {
              logger.error("Error al editar el jugador", { error: err.message });
              return res.json({
                error: "Error al editar el jugador",
              });
            }
            logger.info("Jugador editado correctamente", { alias: alias });
            res.json({ success: true });
          });
        }
      }
    });
  } catch (error) {
    logger.error("Error al editar el jugador", { error: error.message });
    const response = {
      success: false,
      error: "Error al editar el jugador",
    };
    res.json(response);
  }
});

app.delete("/deletePlayer/:alias", async (req, res) => {
  try {
    const alias = req.params.alias;

    db.run("DELETE FROM jugadores WHERE alias = ?", [alias], (err) => {
      if (err) {
        logger.error("Error al eliminar el jugador", { error: err.message });
        return res.json({
          error: "Error al eliminar el jugador",
        });
      }
      logger.info("Jugador eliminado correctamente", { alias: alias });
      res.json({ success: true });
    });
  } catch (error) {
    logger.error("Error al eliminar el jugador", { error: error.message });
    const response = {
      success: false,
      error: "Error al eliminar el jugador",
    };
    res.json(response);
  }
});

server.listen(port, () => {
  logger.info(`Servidor de Registro escuchando en el puerto ${port}`);
});
