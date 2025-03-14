"use client";

import { IntegratedLeafletMap } from "@/modules/AR/components/integrated-leaflet-map";
// import dynamic from "next/dynamic";

// const ARScene = dynamic(
//   () => import("@/modules/AR/components/3d-object").then((mod) => mod.ARScene),
//   {
//     ssr: false,
//   }
// );

export default function Home() {
  return <IntegratedLeafletMap />;
}
