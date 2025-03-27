"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";

interface ARBallProps {
  onExit: () => void;
}

export function ARBall({ onExit }: ARBallProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Cria o renderer com suporte a WebXR
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // Cria a cena e a câmera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );
    scene.add(camera);

    // Adiciona uma luz ambiente
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    // Cria a esfera 3D (bola) e define sua posição (ancorada 1 metro à frente da câmera)
    const sphereGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(0, 0, -1);
    scene.add(sphere);

    // Implementando oclusão:
    // Cria uma occlusion mesh que não renderiza cor (apenas atualiza o depth buffer)
    const occlusionGeometry = new THREE.PlaneGeometry(2, 2);
    const occlusionMaterial = new THREE.MeshBasicMaterial({
      colorWrite: false, // Não renderiza cor
    });
    const occlusionMesh = new THREE.Mesh(occlusionGeometry, occlusionMaterial);
    // Posicione a occlusion mesh entre a câmera e a bola.
    // Aqui, ela é posicionada a 0.7 metros à frente da câmera (ou seja, 0.3 metros à frente da bola).
    occlusionMesh.position.set(0, 0, -0.7);
    scene.add(occlusionMesh);

    // Cria o botão AR do Three.js para iniciar a experiência AR
    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
    });
    container.appendChild(arButton);

    // Loop de renderização
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    // Cleanup ao desmontar o componente
    return () => {
      renderer.setAnimationLoop(null);
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 2000,
        background: "black",
      }}
    >
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      <button
        onClick={onExit}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 3000,
          padding: "10px",
          background: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Sair AR
      </button>
    </div>
  );
}
