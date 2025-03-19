"use client";

import dynamic from "next/dynamic";

const IntegratedLeafletMap = dynamic(
  () =>
    import("@/modules/AR/components/integrated-leaflet-map").then(
      (mod) => mod.IntegratedLeafletMap
    ),
  {
    ssr: false,
  }
);

export default function Home() {
  return <IntegratedLeafletMap />;
}
