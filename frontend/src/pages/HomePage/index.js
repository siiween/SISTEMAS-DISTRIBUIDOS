import React, { useState } from "react";
import { useQuery } from "react-query";
import { useEffect } from "react";

const regionColor = {
  0: "border-blue-900",
  1: "border-indigo-900",
  2: "border-teal-900",
  3: "border-green-900",
};

export function drawMap(width, height, mapa) {
  let map = [];

  for (let i = 0; i < height; i++) {
    let row = [];
    for (let j = 0; j < width; j++) {
      row.push(
        <td key={i + j} className={`border-2 relative ${regionColor[mapa[i][j].region]}`} title={`[${j}, ${i}]`}>
          {mapa[i][j].content.type === "Mina" && (
            <>
              <img src="/mina.png" alt="mina" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-auto h-full" />
            </>
          )}
          {mapa[i][j].content.type === "Alimento" && (
            <>
              <img
                src={`/alimentos/${mapa[i][j].region}.png`}
                alt="alimento"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-auto h-3/5"
              />
            </>
          )}
          {mapa[i][j].content.type === "Jugador" && (
            <>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <img src={`/minions/${Math.floor(Math.random() * 4)}.png`} alt="jugador" className=" w-auto h-8 mx-auto" />
                <p className="text-white text-sm font-semibold w-max">
                  {mapa[i][j].content.id} - {mapa[i][j].content.level}
                </p>
              </div>
            </>
          )}
        </td>
      );
    }
    map.push(
      <tr key={i} className="w-full">
        {row}
      </tr>
    );
  }
  return map;
}

const HomePage = () => {
  // llamada a la api con axios y react query
  const { isLoading, error, data } = useQuery("map", () => fetch("/api/mapa").then((res) => res.json()), {
    refetchInterval: 500,
  });
  const [mapa, setMap] = useState([]);

  useEffect(() => {
    if (!isLoading && !error) {
      console.log(data.map.map);
    }
  }, [isLoading, error, data]);

  useEffect(() => {
    if (!isLoading && !error && data.map.map) setMap(drawMap(20, 20, data.map.map));
  }, [data]);

  return (
    <div className="flex">
      <div className="w-1/3 h-screen bg-gray-800 py-12 px-5">
        <p className="text-2xl font-semibold text-neutral-100 text-center mb-10">JUGADORES AGAINST ALL</p>

        {!isLoading && !error && data.map.players ? (
          data.map.players.length > 0 ? (
            <>
              <div className="w-full flex bg-gray-950 rounded-t py-2 px-3">
                <p className="text-white text-base w-1/5">ID</p>
                <p className="text-white text-base w-1/5 ">LEVEL</p>
                <p className="text-white text-base w-1/5 ">EC</p>
                <p className="text-white text-base w-1/5 ">EF</p>
                <p className="text-white text-base w-1/5 ">POSITION</p>
              </div>
              {data.map.players.map((jugador) => (
                <div className="w-full flex bg-gray-900 py-2 px-3">
                  <p className="text-white text-base w-1/5 ">{jugador.id}</p>
                  <p className="text-white text-base w-1/5 ">{jugador.level}</p>
                  <p className="text-white text-base w-1/5 ">{jugador.EC}</p>
                  <p className="text-white text-base w-1/5 ">{jugador.EF}</p>
                  <p className="text-white text-base w-1/5 ">
                    [{jugador.position.x}, {jugador.position.y}]
                  </p>
                </div>
              ))}
            </>
          ) : (
            <p className="text-xl font-semibold text-neutral-100 text-center mt-10">No hay jugadores conectados</p>
          )
        ) : (
          <p className="text-xl font-semibold text-neutral-100 text-center mt-10">Partida no empezada o servidor desconectado</p>
        )}
      </div>
      <div className="p-12 w-full h-screen">
        <p className="text-2xl font-semibold text-neutral-100 text-center">MAPA AGAINST ALL</p>
        {!isLoading && !error && data.map.map ? (
          <>
            <div className="w-2/3 grid grid-cols-2 mx-auto mt-10">
              <p className="text-white text-lg w-full text-center">
                {data.map.regions[0].name} {data.map.regions[0].temperature}Cº
              </p>
              <p className="text-white text-lg w-full text-center">
                {data.map.regions[1].name} {data.map.regions[1].temperature}Cº
              </p>
            </div>
            <table className="table-auto w-2/3 border-2 h-4/5 border-neutral-600 rounded mx-auto mt-5">
              <tbody className="w-full h-full">{mapa}</tbody>
            </table>
            <div className="w-2/3 grid grid-cols-2 mx-auto mt-5">
              <p className="text-white text-lg w-full text-center">
                {data.map.regions[2].name} {data.map.regions[2].temperature}Cº
              </p>
              <p className="text-white text-lg w-full text-center">
                {data.map.regions[3].name} {data.map.regions[3].temperature}Cº
              </p>
            </div>
          </>
        ) : (
          <p className="text-3xl font-semibold text-neutral-100 text-center mt-10">Partida no empezada o servidor desconectado</p>
        )}
      </div>
    </div>
  );
};

export default HomePage;
