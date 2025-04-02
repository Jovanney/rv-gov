// ARScene.tsx
"use client";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";

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

export function ARScene2({ modelUrl, projeto, onExit }: ARSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["local-floor"],
    });
    container.appendChild(arButton);

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
    scene.add(boardGroup);

    // 📦 Placa informativa
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

    // 🏗️ Modelo GLB da obra
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      modelUrl,
      (gltf) => {
        gltf.scene.position.set(0, 0, 0);
        gltf.scene.scale.set(10, 10, 10);
        boardGroup.add(gltf.scene);
      },
      undefined,
      (error) => console.error("Erro ao carregar modelo:", error)
    );

    // 📍 Coordenadas geográficas da obra (latitude/longitude)
    const targetLat = -8.04653;
    const targetLon = -34.950824;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;

        const metersPerDegree = 111320;
        const deltaLat = targetLat - userLat;
        const deltaLon = targetLon - userLon;

        const x =
          deltaLon * metersPerDegree * Math.cos((userLat * Math.PI) / 180);
        const z = deltaLat * metersPerDegree;

        boardGroup.position.set(x, 0, z);
        boardGroup.visible = true;
      });
    }

    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      while (container.firstChild) container.removeChild(container.firstChild);
    };
  }, []);

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
    </div>
  );
}
