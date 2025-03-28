import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export function ARBall({ onExit }: { onExit: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Renderer com suporte a WebXR
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // Cena e câmera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );
    scene.add(camera);

    // Luz ambiente
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    // AxesHelper para visualização das direções (X: vermelho, Y: verde, Z: azul)
    const axesHelper = new THREE.AxesHelper(1);
    scene.add(axesHelper);

    // Carrega o modelo GLTF
    const loader = new GLTFLoader();
    loader.load(
      "/model.gltf",
      (gltf) => {
        console.log("Modelo carregado com sucesso!");
        const model = gltf.scene;

        // Calcula a bounding box do modelo
        const box = new THREE.Box3().setFromObject(model);
        console.log("Bounding Box:", box.min, box.max);

        // Ajusta a posição do modelo para que a base (mínimo Y) fique em 0
        model.position.y -= box.min.y;

        // Aumenta o tamanho do modelo (ajuste o fator conforme necessário)
        model.scale.set(2, 2, 2);

        scene.add(model);

        // Adiciona uma esfera de debug para indicar a posição do modelo
        const debugSphereGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const debugSphereMaterial = new THREE.MeshBasicMaterial({
          color: 0xffff00,
        });
        const debugSphere = new THREE.Mesh(
          debugSphereGeometry,
          debugSphereMaterial
        );
        // Posiciona a esfera no mesmo lugar que o modelo
        debugSphere.position.copy(model.position);
        scene.add(debugSphere);

        // (Opcional) Adiciona uma seta para indicar a direção "para cima" a partir do modelo
        const arrowDirection = new THREE.Vector3(0, 1, 0); // para cima
        const arrowLength = 0.5;
        const arrowColor = 0xff0000;
        const arrowHelper = new THREE.ArrowHelper(
          arrowDirection,
          model.position,
          arrowLength,
          arrowColor
        );
        scene.add(arrowHelper);
      },
      undefined,
      (error) => {
        console.error("Erro ao carregar o modelo:", error);
      }
    );

    // Cria o botão AR do Three.js
    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
    });
    container.appendChild(arButton);

    // Loop de renderização
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

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
