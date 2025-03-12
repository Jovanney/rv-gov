"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// 📍 Lista de obras com coordenadas fictícias
const OBRAS = [
  { id: 1, nome: "Obra A", latitude: -8.0476, longitude: -34.877 },
  { id: 2, nome: "Obra B", latitude: -8.05, longitude: -34.88 },
  { id: 3, nome: "Obra C", latitude: -8.045, longitude: -34.875 },
  {
    id: 4,
    nome: "Obra D",
    latitude: -8.046067081209857,
    longitude: -34.8,
  },
];

// 📌 Função para calcular a distância entre duas coordenadas (Haversine)
const calcularDistancia = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371e3; // Raio da Terra em metros
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const φ1 = rad(lat1);
  const φ2 = rad(lat2);
  const Δφ = rad(lat2 - lat1);
  const Δλ = rad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export function ARScene() {
  const [coordenadasUsuario, setCoordenadasUsuario] = useState<{
    latitude: number | null;
    longitude: number | null;
  }>({ latitude: null, longitude: null });

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoordenadasUsuario({ latitude, longitude });
        },
        (err) => console.error("Erro ao obter localização:", err),
        { enableHighAccuracy: true }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, []);

  return (
    <div>
      <h2>Mapa das Obras e sua Posição</h2>

      {/* 🌍 Mapa para mostrar a posição do usuário e das obras */}
      <MapContainer
        center={[
          coordenadasUsuario?.latitude || -8.0476,
          coordenadasUsuario?.longitude || -34.877,
        ]}
        zoom={15}
        style={{ height: "100vh", width: "100%", borderRadius: "10px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* 📌 Marcadores das Obras */}
        {OBRAS.map((obra) => (
          <Marker key={obra.id} position={[obra.latitude, obra.longitude]}>
            <Popup>{`🏗️ ${obra.nome}`}</Popup>
          </Marker>
        ))}

        {/* 📍 Marcador do Usuário (se as coordenadas estiverem disponíveis) */}
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

      {/* 📝 Informações sobre a proximidade das obras */}
      <ul>
        {OBRAS.map((obra) => {
          if (coordenadasUsuario.latitude && coordenadasUsuario.longitude) {
            const distancia = calcularDistancia(
              coordenadasUsuario.latitude,
              coordenadasUsuario.longitude,
              obra.latitude,
              obra.longitude
            );

            const dentroDoPerimetro = distancia <= 50; // Raio de 50 metros

            return (
              <li key={obra.id}>
                {dentroDoPerimetro
                  ? `🎉 Você está dentro do perímetro da ${obra.nome}! A placa será exibida em AR.`
                  : `❌ Você está fora do perímetro da ${obra.nome}.`}
              </li>
            );
          } else {
            return (
              <li key={obra.id}>
                `⚠️ Não foi possível determinar sua posição em relação à $
                {obra.nome}.`
              </li>
            );
          }
        })}
      </ul>
    </div>
  );
}
