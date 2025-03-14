"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";

// 📍 Coordenadas da obra (Cidade Universitária, Recife - PE)
const OBRAS_COORDENADAS = {
  latitude: -8.0476,
  longitude: -34.877,
  raioMetros: 50000, // Raio de proximidade para ativar a AR
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

  // 🚀 Função para inicializar a RA com a casa 3D
  const iniciarAR = () => {
    // Configuração Three.js
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

    // 🌟 Criar a casa com Three.js
    const casa = new THREE.Group();

    // Base da Casa
    const baseGeometry = new THREE.BoxGeometry(1.5, 1, 1);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 0.5, -3);
    casa.add(base);

    // Telhado da Casa (Pirâmide)
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
        center={[OBRAS_COORDENADAS.latitude, OBRAS_COORDENADAS.longitude]}
        zoom={15}
        style={{ height: "85vh", width: "100%", borderRadius: "10px" }}
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
