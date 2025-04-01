import React, { useEffect, useRef } from "react";
import * as THREE from "three";

type Projeto = {
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

export function ProjectInfoBoard({ projeto }: { projeto: Projeto }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !projeto) return;

    const container = containerRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.5, 5);
    scene.add(camera);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 2, 3);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x999999));

    // 🧾 Criação do canvas com texto
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0033aa"; // azul forte
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const pad = 40;
    const lineHeight = 50;
    let y = pad;

    const writeLine = (
      label: string,
      value: string | number | null | undefined
    ) => {
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

    // ⬇️ Dados do projeto
    const {
      nome,
      uf,
      descricao,
      funcaosocial,
      metaglobal,
      datainicialprevista,
      datafinalprevista,
      especie,
      natureza,
      situacao,
      datasituacao,
      enderecoareaexecutora,
      recursosorigem,
      recursosvalorinvestimento,
    } = projeto;

    writeLine("Nome", nome);
    writeLine("UF", uf);
    writeLine("Descrição", descricao);
    writeLine("Função Social", funcaosocial);
    writeLine("Meta Global", metaglobal);
    writeLine("Data Inicial Prevista", datainicialprevista);
    writeLine("Data Final Prevista", datafinalprevista);
    writeLine("Espécie", especie);
    writeLine("Natureza", natureza);
    writeLine("Situação", situacao);
    writeLine("Data Situação", datasituacao);
    writeLine("Endereço Execução", enderecoareaexecutora);
    writeLine("Origem dos Recursos", recursosorigem);
    writeLine(
      "Valor do Investimento",
      recursosvalorinvestimento?.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    );

    // Textura
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    // 📦 Geometria com profundidade (placa 3D)
    const boxGeometry = new THREE.BoxGeometry(4.2, 2.1, 0.1);
    const materials = [
      new THREE.MeshBasicMaterial({ color: "#002266" }), // lateral x+
      new THREE.MeshBasicMaterial({ color: "#002266" }), // lateral x-
      new THREE.MeshBasicMaterial({ color: "#002266" }), // topo
      new THREE.MeshBasicMaterial({ color: "#002266" }), // baixo
      new THREE.MeshBasicMaterial({ map: texture }), // frente (canvas)
      new THREE.MeshBasicMaterial({ color: "#002266" }), // trás
    ];

    const box = new THREE.Mesh(boxGeometry, materials);
    scene.add(box);

    // Animação leve (rotação sutil)
    const animate = () => {
      requestAnimationFrame(animate);
      box.rotation.y += 0.001;
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      renderer.dispose();
      container.innerHTML = "";
    };
  }, [projeto]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000000",
      }}
    />
  );
}
