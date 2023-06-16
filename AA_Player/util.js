// Mostrar opciones por consola
const mostrarMenu = () => {
  console.log("Seleccione una opción:");
  console.log("1. Crear un nuevo jugador");
  console.log("2. Editar un jugador existente");
  console.log("3. Unirse a la partida");
  console.log("0. Salir");
};

const padString = (value, width) => {
  const stringValue = String(value);
  const padding = " ".repeat(width - stringValue.length);
  return stringValue + padding;
};

const drawMap = (mapa) => {
  console.clear();
  if (mapa) {
    console.log("");
    console.log(
      padString("", 5) +
        padString(`${mapa.regions[0].name} ${mapa.regions[0].temperature}Cº`, 30) +
        padString("", 4) +
        padString(`${mapa.regions[1].name} ${mapa.regions[1].temperature}Cº`, 30)
    );
    let lineaArriba = padString("", 5);
    let numerosArriba = padString("", 5);
    for (let i = 0; i < 20; i++) {
      if (i === 0) {
        lineaArriba += setRegion[0];
      } else if (i === 10) {
        lineaArriba += padString("", 4) + reset;
        lineaArriba += setRegion[1];
        numerosArriba += padString("", 4);
      }
      lineaArriba += padString("---", 3);
      numerosArriba += padString(i + 1, 3);
    }
    lineaArriba += reset;
    console.log(numerosArriba);
    console.log(lineaArriba);
    mapa.map.forEach((fila, i) => {
      // lineas de enmedio horizontales
      if (i === 10) {
        let linea1 = padString("", 5);
        let linea2 = padString("", 5);
        for (let k = 0; k < 20; k++) {
          if (k === 0) {
            linea1 += setRegion[0];
            linea2 += setRegion[2];
          } else if (k === 10) {
            linea1 += padString("", 4) + reset;
            linea2 += padString("", 4) + reset;
            linea1 += setRegion[1];
            linea2 += setRegion[3];
          }

          linea1 += padString("---", 3);
          linea2 += padString("---", 3);
        }
        linea1 += reset;
        linea2 += reset;
        console.log(linea1);
        console.log(linea2);
      }

      let filaStr = "";
      filaStr += padString(i + 1, 3);
      // ponemos colores a las lineas laterales
      let region = 2;
      if (i < 10) region = 0;
      filaStr += setRegion[region];
      filaStr += padString("| ", 2);
      filaStr += reset;

      fila.forEach((casilla, j) => {
        filaStr += setRegion[casilla.region];

        if (j === 10) {
          filaStr += padString("|", 2);
        }

        if (casilla.content.type === "Jugador") {
          filaStr += padString(casilla.content.identity[0], 3);
        } else if (casilla.content.type === "Mina") {
          filaStr += padString("M", 3);
        } else if (casilla.content.type === "Alimento") {
          filaStr += padString("A", 3);
        } else {
          filaStr += padString(" ", 3);
        }

        if (j === 9) {
          filaStr += padString("|", 2);
        }

        filaStr += reset;
      });

      // ponemos colores a las lineas laterales
      region = 3;
      if (i < 10) region = 1;
      filaStr += setRegion[region];
      filaStr += padString(" |", 2);
      filaStr += reset;
      filaStr += padString(` ${i + 1}`, 3);
      console.log(filaStr);
    });

    let lineaAbajo = padString("", 5);
    let numerosAbajo = padString("", 5);
    for (let i = 0; i < 20; i++) {
      if (i === 0) {
        lineaAbajo += setRegion[2];
      } else if (i === 10) {
        lineaAbajo += padString("", 4) + reset;
        lineaAbajo += setRegion[3];
        numerosAbajo += padString("", 4);
      }
      lineaAbajo += padString("---", 3);
      numerosAbajo += padString(i + 1, 3);
    }
    lineaAbajo += reset;
    console.log(lineaAbajo);
    console.log(numerosAbajo);

    console.log(
      padString("", 5) +
        padString(`${mapa.regions[2].name} ${mapa.regions[2].temperature}Cº`, 30) +
        padString("", 4) +
        padString(`${mapa.regions[3].name} ${mapa.regions[3].temperature}Cº`, 30)
    );
  } else {
    console.log("Lo siento no hay mapa disponible");
  }
};

const setRegion = {
  0: "\x1b[34m",
  1: "\x1b[35m",
  2: "\x1b[36m",
  3: "\x1b[32m",
};

const reset = "\x1b[0m";

module.exports = {
  mostrarMenu,
  drawMap,
  padString,
};
