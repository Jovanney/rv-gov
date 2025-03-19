"use client";

import { useQuery } from "@tanstack/react-query";
import { getConstructionsAction } from "../actions/get-constructions-action";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLngExpression } from "leaflet";
import { useEffect, useState } from "react";

export function IntegratedLeafletMap() {
  const {
    data: constructions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["constructions"],
    queryFn: () => getConstructionsAction(),
  });

  const [coordenadasUsuario, setCoordenadasUsuario] = useState<{
    latitude: number | null;
    longitude: number | null;
  }>({ latitude: null, longitude: null });

  const formatedConstructions = constructions?.data?.obras.map((obra) => ({
    id: obra.idunico,
    nome: obra.nome,
    descricao: obra.descricao,
    coordenadas: obra.geometria
      .split("|")
      .map((latLon) => latLon.split(","))
      .map(([lat, lon]) => [parseFloat(lat), parseFloat(lon)]),
  }));

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoordenadasUsuario({ latitude, longitude });

          // const distancia = calcularDistancia(
          //   latitude,
          //   longitude,
          //   OBRAS_COORDENADAS.latitude,
          //   OBRAS_COORDENADAS.longitude
          // );

          // console.log(
          //   `📍 Usuário está a ${distancia.toFixed(2)}m da obra (Limite: ${
          //     OBRAS_COORDENADAS.raioMetros
          //   }m)`
          // );

          // setPertoDaObra(distancia <= OBRAS_COORDENADAS.raioMetros);
        },
        (err) => console.error("Erro ao obter localização:", err),
        { enableHighAccuracy: true }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!constructions) {
    return <div>No constructions found</div>;
  }

  return (
    <div>
      <h2>Mapa da Obra e sua Posição</h2>
      <MapContainer
        center={[-8.0476, -34.877]}
        zoom={15}
        style={{ height: "85vh", width: "100%", borderRadius: "10px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {formatedConstructions?.map((obra) => (
          <Marker
            key={obra.id}
            position={obra.coordenadas[0] as LatLngExpression}
          >
            <Popup>
              <strong>{obra.nome}</strong>
              <p>{obra.descricao}</p>
            </Popup>
          </Marker>
        ))}

        {coordenadasUsuario.latitude && coordenadasUsuario.longitude && (
          <Marker
            position={[
              coordenadasUsuario.latitude,
              coordenadasUsuario.longitude,
            ]}
          >
            <Popup>🧑 Você está aqui</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
