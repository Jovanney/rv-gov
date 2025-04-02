// ARScene.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import { Object3DEventMap } from "three";

interface ARSceneProps {
  modelUrl: string;
  projeto: {
    nome: string;
    uf: string;
    descricao: string;
    funcaosocial: string;
    metaglobal: string;
    datainicialprevista: string;
    datafinalprevista: string;
    especie: string;
    natureza: string;
    situacao: string;
    datasituacao: string;
    enderecoareaexecutora: string;
    recursosorigem: string;
    recursosvalorinvestimento: number;
  };
  onExit: () => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function ARScene({ modelUrl, projeto, onExit }: ARSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.scale.set(scale, scale, scale);
    }
  }, [scale]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );
    scene.add(camera);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));

    const boardGroup = new THREE.Group();
    boardGroup.visible = true;
    scene.add(boardGroup);

    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0033aa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const pad = 40;
    const lineHeight = 50;
    let y = pad;
    const writeLine = (label: string, value?: string | number | null) => {
      if (!value) return;
      const text = `${label}: ${value}`;
      const maxWidth = canvas.width - pad * 2;
      const words = text.split(" ");
      let line = "";
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        const { width } = ctx.measureText(testLine);
        if (width > maxWidth) {
          ctx.fillText(line, pad, y);
          y += lineHeight;
          line = words[i] + " ";
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, pad, y);
      y += lineHeight;
    };

    const p = projeto;
    writeLine("Nome", p.nome);
    writeLine("UF", p.uf);
    writeLine("Descrição", p.descricao);
    writeLine("Função Social", p.funcaosocial);
    writeLine("Meta Global", p.metaglobal);
    writeLine("Data Inicial Prevista", formatDate(p.datainicialprevista));
    writeLine("Data Final Prevista", formatDate(p.datafinalprevista));
    writeLine("Espécie", p.especie);
    writeLine("Natureza", p.natureza);
    writeLine("Situação", p.situacao);
    writeLine("Data Situação", formatDate(p.datasituacao));
    writeLine("Endereço Execução", p.enderecoareaexecutora);
    writeLine("Origem dos Recursos", p.recursosorigem);
    writeLine(
      "Valor Investimento",
      p.recursosvalorinvestimento.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    );

    const texture = new THREE.CanvasTexture(canvas);
    const boardGeometry = new THREE.BoxGeometry(1.5, 0.75, 0.05);
    const boardMaterials = [
      new THREE.MeshBasicMaterial({ color: "#002266" }),
      new THREE.MeshBasicMaterial({ color: "#002266" }),
      new THREE.MeshBasicMaterial({ color: "#002266" }),
      new THREE.MeshBasicMaterial({ color: "#002266" }),
      new THREE.MeshBasicMaterial({ map: texture }),
      new THREE.MeshBasicMaterial({ color: "#002266" }),
    ];
    const board = new THREE.Mesh(boardGeometry, boardMaterials);
    board.position.set(1.2, 0.6, 0);
    boardGroup.add(board);

    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      modelUrl,
      (gltf) => {
        gltf.scene.position.set(0, 0, 0);
        gltf.scene.scale.set(scale, scale, scale);
        boardGroup.add(gltf.scene);
        modelRef.current = gltf.scene;
      },
      undefined,
      (error) => console.error("Erro ao carregar modelo:", error)
    );

    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
    });
    container.appendChild(arButton);

    let controller: THREE.Group | null | undefined;
    let reticle: THREE.Mesh | null | undefined;
    let hitTestSource: XRHitTestSource | null | undefined;
    let localSpace: XRReferenceSpace | null = null;

    renderer.xr.addEventListener("sessionstart", async () => {
      const session = renderer.xr.getSession();
      if (!session) return;

      if (
        typeof session.requestReferenceSpace === "function" &&
        typeof session.requestHitTestSource === "function"
      ) {
        const viewerSpace = await session.requestReferenceSpace("viewer");
        hitTestSource = await session?.requestHitTestSource({
          space: viewerSpace,
        });
        localSpace = await session.requestReferenceSpace("local");
      }
    });

    const geometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(
      -Math.PI / 2
    );
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    // eslint-disable-next-line prefer-const
    reticle = new THREE.Mesh(geometry, material);
    reticle.visible = false;
    scene.add(reticle);

    // eslint-disable-next-line prefer-const
    controller = renderer.xr.getController(0);
    controller.addEventListener("select" as keyof Object3DEventMap, () => {
      if (reticle.visible) {
        boardGroup.position.copy(reticle.position);
        boardGroup.visible = true;
      }
    });
    scene.add(controller);

    renderer.setAnimationLoop((timestamp, frame) => {
      if (frame && hitTestSource && localSpace) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length) {
          const hit = hitTestResults[0];
          const pose = hit.getPose(localSpace);
          if (pose) {
            reticle.visible = true;
            reticle.matrix.fromArray(pose.transform.matrix);
            reticle.matrix.decompose(
              reticle.position,
              reticle.quaternion,
              reticle.scale
            );
          }
        } else {
          reticle.visible = false;
        }
      }
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      while (container.firstChild) container.removeChild(container.firstChild);
    };
  }, [modelUrl, projeto]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 2000,
      }}
    >
      <button
        onClick={onExit}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          padding: 10,
          background: "white",
          border: "none",
          borderRadius: 5,
          zIndex: 3000,
        }}
      >
        Sair AR
      </button>
      <button
        onClick={() => setScale((prev) => Math.min(prev + 0.1, 3))}
        style={{
          position: "absolute",
          top: 60,
          left: 20,
          padding: 10,
          background: "white",
          border: "1px solid #ccc",
          borderRadius: 5,
          zIndex: 3000,
        }}
      >
        ➕ Aumentar
      </button>
      <button
        onClick={() => setScale((prev) => Math.max(prev - 0.1, 0.1))}
        style={{
          position: "absolute",
          top: 60,
          left: 130,
          padding: 10,
          background: "white",
          border: "1px solid #ccc",
          borderRadius: 5,
          zIndex: 3000,
        }}
      >
        ➖ Diminuir
      </button>
    </div>
  );
}
