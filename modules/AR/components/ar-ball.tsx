import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

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
    // Posiciona a câmera para que ela enxergue a cena
    camera.position.set(0, 1.6, 3);
    camera.lookAt(0, 0, 0);
    scene.add(camera);

    // Luz ambiente
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    // AxesHelper para visualização das direções (X: vermelho, Y: verde, Z: azul)
    const axesHelper = new THREE.AxesHelper(1);
    scene.add(axesHelper);

    // Adiciona um GridHelper para ter referência do chão
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // Objeto de debug: esfera amarela na origem
    const debugSphereGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const debugSphereMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
    });
    const debugSphere = new THREE.Mesh(
      debugSphereGeometry,
      debugSphereMaterial
    );
    debugSphere.position.set(0, 0, 0);
    scene.add(debugSphere);

    // Carrega o modelo GLTF
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      "https://rv-gov-seven.vercel.app/model_library.gltf",
      (gltf) => {
        console.log("Model successfully loaded:", gltf);
        scene.add(gltf.scene);
      },
      (xhr) => {
        console.log(`Loading: ${(xhr.loaded / xhr.total) * 100}% loaded`);
      },
      (error) => {
        console.error("Error loading model:", error);
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
