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
        <td key={i + j} className={`lg:border-2 border relative ${regionColor[mapa[i][j].region]}`} title={`[${j}, ${i}]`}>
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
          {mapa[i][j].content.type === "NPC" && (
            <>
              <img src={`/NPC.png`} alt="alimento" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-auto h-3/5" />
            </>
          )}
          {mapa[i][j].content.type === "Jugador" && (
            <>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <img src={`/minions/${Math.floor(Math.random() * 4)}.png`} alt="jugador" className=" w-auto lg:h-8 h-5 mx-auto" />
                <p className="text-white lg:text-sm text-xs font-semibold w-max">
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
    if (!isLoading && !error && data && data.map && data.map.map) setMap(drawMap(20, 20, data.map.map));
  }, [data]);

  return (
    <div className="lg:flex">
      <div className="lg:w-1/3 w-full lg:h-screen h-fit bg-gray-800 lg:py-12 lg:px-5 p-3">
        <p className="lg:text-2xl text-xl font-semibold text-neutral-100 text-center mb-5">JUGADORES AGAINST ALL</p>

        {!isLoading && !error && data && data.map && data.map.players ? (
          data.map.players.length > 0 ? (
            <>
              <div className="w-full flex bg-gray-950 rounded-t py-2 px-3">
                <p className="text-white lg:text-base text-sm w-1/5">ID</p>
                <p className="text-white lg:text-base text-sm w-1/5 ">LEVEL</p>
                <p className="text-white lg:text-base text-sm w-1/5 ">EC</p>
                <p className="text-white lg:text-base text-sm w-1/5 ">EF</p>
                <p className="text-white lg:text-base text-sm w-1/5 ">POSITION</p>
              </div>
              {data.map.players.map((jugador) => (
                <div className="w-full flex bg-gray-900 py-2 px-3">
                  <p className="text-white lg:text-base text-sm w-1/5 ">{jugador.id}</p>
                  <p className="text-white lg:text-base text-sm w-1/5 ">{jugador.level}</p>
                  <p className="text-white lg:text-base text-sm w-1/5 ">{jugador.EC}</p>
                  <p className="text-white lg:text-base text-sm w-1/5 ">{jugador.EF}</p>
                  <p className="text-white lg:text-base text-sm w-1/5 ">
                    [{jugador.position.x}, {jugador.position.y}]
                  </p>
                </div>
              ))}
            </>
          ) : (
            <p className="lg:text-xl text-lg font-semibold text-neutral-100 text-center lg:mt-10 mt-5 mb-5">No hay jugadores conectados</p>
          )
        ) : (
          <p className="lg:text-xl text-lg font-semibold text-neutral-100 text-center lg:mt-10 mt-5 mb-5">
            Partida no empezada o servidor desconectado
          </p>
        )}

        <p className="lg:text-2xl text-xl font-semibold text-neutral-100 text-center mb-5 mt-12">NPCS AGAINST ALL</p>

        {!isLoading && !error && data && data.map && data.map.NPCs ? (
          data.map.NPCs.length > 0 ? (
            <>
              <div className="w-full flex bg-gray-950 rounded-t py-2 px-3">
                <p className="text-white lg:text-base text-sm w-1/3">ID</p>
                <p className="text-white lg:text-base text-sm w-1/3 ">LEVEL</p>
                <p className="text-white lg:text-base text-sm w-1/3 ">POSITION</p>
              </div>
              {data.map.NPCs.map((NPC) => (
                <div className="w-full flex bg-gray-900 py-2 px-3">
                  <p className="text-white lg:text-base text-sm w-1/3 ">{NPC.id}</p>
                  <p className="text-white lg:text-base text-sm w-1/3 ">{NPC.level}</p>
                  <p className="text-white lg:text-base text-sm w-1/3 ">
                    [{NPC.position.x}, {NPC.position.y}]
                  </p>
                </div>
              ))}
            </>
          ) : (
            <p className="lg:text-xl text-lg font-semibold text-neutral-100 text-center lg:mt-10 mt-5 mb-5">No hay NPCs conectados</p>
          )
        ) : (
          <p className="lg:text-xl text-lg font-semibold text-neutral-100 text-center lg:mt-10 mt-5 mb-5">
            Partida no empezada o servidor desconectado
          </p>
        )}
      </div>
      <div className="lg:p-12 p-3 w-full h-screen">
        <p className="lg:text-2xl text-xl font-semibold text-neutral-100 text-center">MAPA AGAINST ALL</p>
        {!isLoading && !error && data && data.map && data.map.map ? (
          <>
            <div className="lg:w-2/3 w-full grid grid-cols-2 mx-auto lg:mt-10 mt-5">
              <p className="text-white lg:text-lg text-base w-full text-center">
                {data.map.regions[0].name} {data.map.regions[0].temperature}Cº
              </p>
              <p className="text-white lg:text-lg text-base w-full text-center">
                {data.map.regions[1].name} {data.map.regions[1].temperature}Cº
              </p>
            </div>
            <table className="table-auto lg:w-2/3 w-full lg:h-4/5 h-1/2 border-neutral-600 rounded mx-auto mt-5">
              <tbody className="w-full h-full">{mapa}</tbody>
            </table>
            <div className="lg:w-2/3 w-full grid grid-cols-2 mx-auto mt-5">
              <p className="text-white lg:text-lg text-base w-full text-center">
                {data.map.regions[2].name} {data.map.regions[2].temperature}Cº
              </p>
              <p className="text-white lg:text-lg text-base w-full text-center">
                {data.map.regions[3].name} {data.map.regions[3].temperature}Cº
              </p>
            </div>
          </>
        ) : (
          <p className="lg:text-xl text-lg font-semibold text-neutral-100 text-center lg:mt-10 mt-5 mb-5">
            Partida no empezada o servidor desconectado
          </p>
        )}
      </div>
    </div>
  );
};

export default HomePage;
