"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// 📍 Coordenadas da obra (Cidade Universitária, Recife - PE)
const OBRAS_COORDENADAS = {
  latitude: -8.0476,
  longitude: -34.877,
  raioMetros: 50, // Raio de proximidade para ativar a AR
};

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
  const [pertoDaObra, setPertoDaObra] = useState(false);
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

          const distancia = calcularDistancia(
            latitude,
            longitude,
            OBRAS_COORDENADAS.latitude,
            OBRAS_COORDENADAS.longitude
          );

          console.log(
            `📍 Usuário está a ${distancia.toFixed(2)}m da obra (Limite: ${
              OBRAS_COORDENADAS.raioMetros
            }m)`
          );

          setPertoDaObra(distancia <= OBRAS_COORDENADAS.raioMetros);
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
      <h2>Mapa da Obra e sua Posição</h2>

      {/* 🌍 Mapa para mostrar a posição do usuário e da obra */}
      <MapContainer
        center={[OBRAS_COORDENADAS.latitude, OBRAS_COORDENADAS.longitude]}
        zoom={15}
        style={{ height: "100vh", width: "100%", borderRadius: "10px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* 📌 Marcador da Obra */}
        <Marker
          position={[OBRAS_COORDENADAS.latitude, OBRAS_COORDENADAS.longitude]}
        >
          <Popup>🏗️ Obra do Governo</Popup>
        </Marker>

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

      {/* 📝 Informações sobre a proximidade da obra */}
      <p>
        {pertoDaObra
          ? "🎉 Você está dentro do perímetro da obra! A placa será exibida em AR."
          : "❌ Você ainda está fora do perímetro."}
      </p>
    </div>
  );
}
