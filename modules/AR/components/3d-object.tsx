"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polygon, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";

// 📍 Coordenadas da base onde a casa será posicionada (fixa no local real)
const OBRAS_COORDENADAS: [number, number][] = [
  [-8.046501041119217, -34.950823403861776],
  [-8.046441285568628, -34.95082273330959],
  [-8.046499713218187, -34.95082072165306],
  [-8.046501705069728, -34.950748302017615],
];

// 📌 Calcular o centro da área da obra
const calcularCentro = (coordenadas: [number, number][]): [number, number] => {
  let latSum = 0;
  let lonSum = 0;

  coordenadas.forEach(([lat, lon]) => {
    latSum += lat;
    lonSum += lon;
  });

  return [latSum / coordenadas.length, lonSum / coordenadas.length];
};

const CENTRO_OBRA: [number, number] = calcularCentro(OBRAS_COORDENADAS);

// 📌 Função para converter latitude/longitude em coordenadas do WebXR
const geoToPosition = (lat: number, lon: number) => {
  const scaleFactor = 100000; // Ajuste fino para conversão geoespacial
  const x = (lon + 180) * scaleFactor;
  const z = (90 - lat) * scaleFactor;
  return new THREE.Vector3(x, 0, -z);
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

          const distancia = geoToPosition(latitude, longitude).distanceTo(
            geoToPosition(CENTRO_OBRA[0], CENTRO_OBRA[1])
          );

          console.log(
            `📍 Usuário está a ${distancia.toFixed(2)}m da obra (Limite: 50m)`
          );

          setPertoDaObra(distancia <= 50);
        },
        (err) => console.error("Erro ao obter localização:", err),
        { enableHighAccuracy: true }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, []);

  // 🚀 Função para inicializar a RA com a casa 3D FIXA no local real
  const iniciarAR = async () => {
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

    // 🌟 Criar a casa 3D fixamente ancorada na posição correta
    const casa = new THREE.Group();

    // Base da Casa
    const baseGeometry = new THREE.BoxGeometry(1.5, 1, 1);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 0.5, 0);
    casa.add(base);

    // Telhado da Casa
    const roofGeometry = new THREE.ConeGeometry(1.6, 1, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 1.5, 0);
    casa.add(roof);

    // Porta
    const doorGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.05);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 0.2, 0.51);
    casa.add(door);

    // Converte a coordenada para o mundo 3D e fixa a casa na posição correta
    const [centerLat, centerLon] = CENTRO_OBRA;
    const posicaoCasa = geoToPosition(centerLat, centerLon);
    casa.position.copy(posicaoCasa);
    scene.add(casa);

    // Configura WebXR para espaço fixo no mundo
    const session = await navigator?.xr?.requestSession("immersive-ar", {
      requiredFeatures: ["local-floor"],
    });
    renderer.xr.setSession(session as XRSession);

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
        center={CENTRO_OBRA}
        zoom={17}
        style={{ height: "85vh", width: "100%", borderRadius: "10px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* 📌 Polígono da Área da Obra */}
        <Polygon positions={OBRAS_COORDENADAS} color="blue">
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
