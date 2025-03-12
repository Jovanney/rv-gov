"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";

// Coordenadas Mockadas da Obra
const OBRAS_COORDENADAS = {
  latitude: -8.0476, // Latitude fictícia
  longitude: -34.877, // Longitude fictícia
  raioMetros: 50, // Distância limite para ativar a AR
};

// Função para calcular a distância entre duas coordenadas (Haversine)
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

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const distancia = calcularDistancia(
            latitude,
            longitude,
            OBRAS_COORDENADAS.latitude,
            OBRAS_COORDENADAS.longitude
          );
          setPertoDaObra(distancia <= OBRAS_COORDENADAS.raioMetros);
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    if (!pertoDaObra) return;

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

    // Adiciona luz
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    // Criando a placa como um plano 3D
    const geometry = new THREE.PlaneGeometry(2, 1); // Largura x Altura
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    const placa = new THREE.Mesh(geometry, material);
    placa.position.set(0, 1, -3);
    scene.add(placa);

    // Adicionando um texto básico (mockado)
    const textCanvas = document.createElement("canvas");
    const ctx = textCanvas.getContext("2d")!;
    textCanvas.width = 512;
    textCanvas.height = 256;
    ctx.fillStyle = "blue";
    ctx.fillRect(0, 0, textCanvas.width, textCanvas.height);
    ctx.fillStyle = "white";
    ctx.font = "Bold 32px Arial";
    ctx.fillText("OBRA DO GOVERNO", 50, 60);
    ctx.font = "24px Arial";
    ctx.fillText("Construção da via expressa", 50, 120);
    ctx.fillText("Prazo: 12 meses", 50, 160);
    ctx.fillText("Investimento: R$ 5 milhões", 50, 200);

    const textTexture = new THREE.CanvasTexture(textCanvas);
    material.map = textTexture;
    material.needsUpdate = true;

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
  }, [pertoDaObra]);

  return null;
}
