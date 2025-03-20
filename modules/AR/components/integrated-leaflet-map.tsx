"use client";

import { useQuery } from "@tanstack/react-query";
import { getConstructionsAction } from "../actions/get-constructions-action";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLngExpression, divIcon } from "leaflet";
import { useEffect, useState } from "react";
// import HealthGenericImage from "@/public/helth-generic.png";
// import HouseGeneric from "@/public/house-generic.png";
// import PavimentacaoGeneric from "@/public/pavimentacao-generic.png";
// import SchollGeneric from "@/public/pavimentacao-generic.png";

const emptyIcon = divIcon({
  className: "custom-marker",
  html: '<div class="pulsing-dot"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function FocusOnUser({
  coordenadasUsuario,
}: {
  coordenadasUsuario: { latitude: number | null; longitude: number | null };
}) {
  const map = useMap();

  const handleFocus = () => {
    if (coordenadasUsuario.latitude && coordenadasUsuario.longitude) {
      map.setView(
        [coordenadasUsuario.latitude, coordenadasUsuario.longitude],
        15
      );
    }
  };

  return coordenadasUsuario.latitude && coordenadasUsuario.longitude ? (
    <button
      onClick={handleFocus}
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        padding: "10px 15px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        zIndex: 1000,
      }}
    >
      📍 Focar no Usuário
    </button>
  ) : null;
}

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
    raio: obra.idunico === "46014.26-56" ? 500000000 : 100,
  }));

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          console.log(
            `📍 Latitude: ${latitude}, Longitude: ${longitude}, Precisão: ${accuracy}m`
          );

          setCoordenadasUsuario({ latitude, longitude });

          if (accuracy > 50) {
            console.warn(
              "⚠️ A precisão está baixa. Tente se mover ou ativar o GPS."
            );
          }
        },
        (err) => console.error("Erro ao obter localização:", err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!constructions) return <div>No constructions found</div>;

  return (
    <div style={{ position: "relative" }}>
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
            icon={emptyIcon}
          />
        )}

        <FocusOnUser coordenadasUsuario={coordenadasUsuario} />
      </MapContainer>

      <style jsx global>{`
        .pulsing-dot {
          width: 15px;
          height: 15px;
          background-color: rgba(0, 123, 255, 0.8);
          border-radius: 50%;
          position: relative;
          box-shadow: 0 0 10px rgba(0, 123, 255, 0.5);
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.4;
          }
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
