"use client";
import dynamic from "next/dynamic";

const ARScene = dynamic(
  () => import("@/modules/AR/components/ar-scene").then((mod) => mod.ARScene),
  {
    ssr: false,
  }
);

export default function Home() {
  return <ARScene />;
}
