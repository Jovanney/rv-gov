/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery } from "@tanstack/react-query";
import { getConstructionsAction } from "../actions/get-constructions-action";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLngExpression, divIcon } from "leaflet";
import { useEffect, useState } from "react";
import habitacionalIcon from "@/public/habitacional.webp";
import marketIcon from "@/public/market.webp";
import schoolIcon from "@/public/scholl.png";
import calcamentoIcon from "@/public/calcamento.webp";
import libraryIcon from "@/public/library.png";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

import L from "leaflet";
import { ProjectInfoBoard } from "./project-info-board";
import { ThreedObject } from "./threed-object";
import { ARScene } from "./ar-scene";

const habitacionalMapIcon = new L.Icon({
  iconUrl: habitacionalIcon.src,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const marketMapIcon = new L.Icon({
  iconUrl: marketIcon.src,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const schoolMapIcon = new L.Icon({
  iconUrl: schoolIcon.src,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const calcamentoMapIcon = new L.Icon({
  iconUrl: calcamentoIcon.src,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const bibliotecaMapIcon = new L.Icon({
  iconUrl: libraryIcon.src,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const emptyIcon = divIcon({
  className: "custom-marker",
  html: '<div class="pulsing-dot"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const AR_THRESHOLD = 150;

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
    altitude: number | null;
  }>({ latitude: null, longitude: null, altitude: null });

  const [isARActive, setIsARActive] = useState(false);

  const formatedConstructions = constructions?.data?.obras.map((obra) => {
    const descricao = obra.descricao || "";
    const isHabitacional = descricao.toUpperCase().includes("HABITACIONAIS");
    const isMarket = descricao.toUpperCase().includes("MERCADO");
    const isSchool = descricao.toUpperCase().includes("ESCOLA");
    const isPavimentacao = descricao.toUpperCase().includes("PAVIMENTAÇÃO");
    const isLibrary = descricao.toUpperCase().includes("BIBLIOTECA");

    return {
      id: obra.idunico,
      nome: obra.nome,
      descricao: descricao,
      coordenadas: obra.geometria
        .split("|")
        .map((latLon) => latLon.split(","))
        .map(([lat, lon]) => [parseFloat(lat), parseFloat(lon)]),
      raio: obra.idunico === "46014.26-56" ? 500000000 : AR_THRESHOLD,
      uf: obra.uf,
      funcaosocial: obra.funcaosocial,
      metaglobal: obra.metaglobal,
      datainicialprevista: obra.datainicialprevista,
      datainicialefetiva: obra.datainicialefetiva,
      datafinalprevista: obra.datafinalprevista,
      datafinalefetiva: obra.datafinalefetiva,
      especie: obra.especie,
      natureza: obra.natureza,
      situacao: obra.situacao,
      datasituacao: obra.datasituacao,
      cep: obra.cep,
      enderecoareaexecutora: obra.enderecoareaexecutora,
      recursosorigem: obra.recursosorigem,
      recursosvalorinvestimento: obra.recursosvalorinvestimento,
      isHabitacional,
      isMarket,
      isSchool,
      isPavimentacao,
      isLibrary,
      modelUrl: isHabitacional
        ? "https://rv-gov-seven.vercel.app/predio_azul.glb"
        : isLibrary
        ? "https://rv-gov-seven.vercel.app/model_library.gltf"
        : isSchool
        ? "https://rv-gov-seven.vercel.app/school.glb"
        : isMarket
        ? "https://rv-gov-seven.vercel.app/market.glb"
        : "https://rv-gov-seven.vercel.app/model.glb",
    };
  });

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { altitude, latitude, longitude, accuracy } = pos.coords;
          console.log(
            `📍 Latitude: ${latitude}, Longitude: ${longitude}, Precisão: ${accuracy}m`
          );

          setCoordenadasUsuario({ latitude, longitude, altitude });

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

  if (isLoading)
    return (
      <div className="h-screen w-screen flex justify-center items-center">
        <AiOutlineLoading3Quarters size={100} className="animate-spin" />
      </div>
    );

  if (error) return <div>Error: {error.message}</div>;
  if (!constructions) return <div>No constructions found</div>;

  // Verifica se o usuário está dentro do raio de alguma obra e retorna a obra encontrada
  const constructionInRange = formatedConstructions?.find((obra) => {
    if (!coordenadasUsuario.latitude || !coordenadasUsuario.longitude)
      return false;
    const userLatLng = L.latLng(
      coordenadasUsuario.latitude,
      coordenadasUsuario.longitude
    );
    const obraLatLng = L.latLng(obra.coordenadas[0][0], obra.coordenadas[0][1]);
    return userLatLng.distanceTo(obraLatLng) <= AR_THRESHOLD;
  });

  const showARButton = !!(
    coordenadasUsuario.latitude &&
    coordenadasUsuario.longitude &&
    constructionInRange
  );

  const mockedConstruction = {
    id: "67890",
    nome: "Novo Prédio do CIn-UFPE",
    descricao:
      "Construção de um novo prédio para o Centro de Informática da UFPE",
    coordenadas: [
      [-8.045255747866467, -34.95100032048557],
      [-8.046282215547262, -34.95091652534334],
    ],
    raio: 100,
    uf: "PE",
    funcaosocial: "Educação",
    metaglobal: "Criação de um espaço moderno para estudo e pesquisa",
    datainicialprevista: "2025-06-01",
    datainicialefetiva: "2025-06-10",
    datafinalprevista: "2026-06-01",
    datafinalefetiva: "2026-07-15",
    especie: "Pública",
    natureza: "Infraestrutura",
    situacao: "Planejado",
    datasituacao: "2025-04-01",
    cep: "50740-560",
    enderecoareaexecutora:
      "Av. Jorn. Aníbal Fernandes, s/n, Cidade Universitária, Recife - PE",
    recursosorigem: "Governo Federal e UFPE",
    recursosvalorinvestimento: 2000000.0,
    isHabitacional: true,
    isMarket: false,
    isSchool: false,
    isPavimentacao: false,
    isLibrary: false,
    modelUrl: "https://rv-gov-seven.vercel.app/predio_azul.glb",
  };

  return (
    <div style={{ position: "relative" }}>
      <h2 className="h-full flex justify-center p-2 font-semibold">
        Visualizador de obras 🏗️
      </h2>
      <MapContainer
        center={[-8.0476, -34.877]}
        zoom={15}
        style={{ height: "85vh", width: "100%", borderRadius: "10px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {formatedConstructions?.map((obra) => (
          <div key={obra.id}>
            <Marker
              position={obra.coordenadas[0] as LatLngExpression}
              icon={
                obra.isHabitacional
                  ? habitacionalMapIcon
                  : obra.isMarket
                  ? marketMapIcon
                  : obra.isSchool
                  ? schoolMapIcon
                  : obra.isPavimentacao
                  ? calcamentoMapIcon
                  : obra.isLibrary
                  ? bibliotecaMapIcon
                  : emptyIcon
              }
            >
              <Popup>
                <strong>{obra.nome}</strong>
                <p>{obra.descricao}</p>
              </Popup>
            </Marker>
            {/* Círculo visível para indicar o perímetro de proximidade */}
            <Circle
              center={obra.coordenadas[0] as LatLngExpression}
              radius={AR_THRESHOLD}
              pathOptions={{
                color: "#28a745",
                fillColor: "#28a745",
                fillOpacity: 0.2,
              }}
            />
          </div>
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
      {/* Botão para ativar o modo AR com mensagem personalizada */}
      {showARButton && !isARActive && constructionInRange && (
        <button
          onClick={() => setIsARActive(true)}
          className="px-3 py-1.5 text-sm"
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            zIndex: 1000,
          }}
        >
          Você está no raio da obra {constructionInRange.nome}. Clique para ver
          a obra
        </button>
      )}
      {/* Renderiza o componente ARBall quando isARActive for true */}
      {isARActive && constructionInRange && (
        <ARScene
          modelUrl={constructionInRange?.modelUrl || ""}
          projeto={constructionInRange}
          onExit={() => setIsARActive(false)}
        />
      )}
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
