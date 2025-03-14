"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polygon, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import { LatLngExpression } from "leaflet";

// 📍 Coordenadas da base onde a casa será posicionada
const OBRAS_COORDENADAS = [
  [-8.046501041119217, -34.950823403861776],
  [-8.046441285568628, -34.95082273330959],
  [-8.046499713218187, -34.95082072165306],
  [-8.046501705069728, -34.950748302017615],
];

// 📌 Calcular o centro da área para fixar a casa
const calcularCentro = (coordenadas: number[][]) => {
  let latSum = 0;
  let lonSum = 0;

  coordenadas.forEach(([lat, lon]) => {
    latSum += lat;
    lonSum += lon;
  });

  return [latSum / coordenadas.length, lonSum / coordenadas.length];
};

const CENTRO_OBRA = calcularCentro(OBRAS_COORDENADAS);

// 📌 Função para calcular distância (Haversine)
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
            CENTRO_OBRA[0],
            CENTRO_OBRA[1]
          );

          console.log(
            `📍 Usuário está a ${distancia.toFixed(2)}m da obra (Limite: 50m)`
          );

          setPertoDaObra(distancia <= 50); // Limite de 50 metros
        },
        (err) => console.error("Erro ao obter localização:", err),
        { enableHighAccuracy: true }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, []);

  // 🚀 Função para inicializar a RA com a casa 3D fixa
  const iniciarAR = () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Adiciona luzes
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    // 🌟 Criar a casa 3D fixa no local
    const casa = new THREE.Group();

    // Base da Casa
    const baseGeometry = new THREE.BoxGeometry(1.5, 1, 1);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 0.5, -3);
    casa.add(base);

    // Telhado da Casa
    const roofGeometry = new THREE.ConeGeometry(1.6, 1, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 1.5, -3);
    casa.add(roof);

    // Porta
    const doorGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.05);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 0.2, -2.51);
    casa.add(door);

    // Fixando a casa no centro definido pelas coordenadas
    casa.position.set(0, 0, -5);
    scene.add(casa);

    // Botão AR
    document.body.appendChild(
      ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
    );

    // Renderização
    const animate = () => {
      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
      });
    };
    animate();
  };

  return (
    <div>
      <h2>Mapa da Obra e sua Posição</h2>

      {/* 🌍 Mapa para mostrar a posição do usuário e da obra */}
      <MapContainer
        center={CENTRO_OBRA as LatLngExpression}
        zoom={17}
        style={{ height: "85vh", width: "100%", borderRadius: "10px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* 📌 Polígono da Área da Obra */}
        <Polygon
          positions={OBRAS_COORDENADAS as LatLngExpression[]}
          color="blue"
        >
          <Popup>🏗️ Área da Obra</Popup>
        </Polygon>

        {/* 📍 Marcador do Usuário */}
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
          ? "🎉 Você está dentro do perímetro da obra! A casa será exibida em RA."
          : "❌ Você ainda está fora do perímetro."}
      </p>

      {/* Botão para abrir a RA quando dentro do perímetro */}
      {pertoDaObra && (
        <button
          onClick={iniciarAR}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "blue",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          🏠 Ver Casa em Realidade Aumentada
        </button>
      )}
    </div>
  );
}
