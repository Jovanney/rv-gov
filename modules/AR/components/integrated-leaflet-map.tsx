/* eslint-disable @typescript-eslint/no-unused-vars */
import { useQuery } from "@tanstack/react-query";
import { getConstructionsAction } from "../actions/get-constructions-action";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { LatLngExpression } from "leaflet";

export function IntegratedLeafletMap() {
  const {
    data: constructions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["constructions"],
    queryFn: () => getConstructionsAction(),
  });

  const geometries = constructions?.data?.obras.map((obra) => obra.geometria);

  const formatedConstructions = constructions?.data?.obras.map((obra) => ({
    id: obra.idunico,
    nome: obra.nome,
    descricao: obra.descricao,
    coordenadas: obra.geometria
      .split("|")
      .map((latLon) => latLon.split(","))
      .map(([lat, lon]) => [parseFloat(lat), parseFloat(lon)]),
  }));

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!constructions) {
    return <div>No constructions found</div>;
  }

  return (
    <MapContainer
      center={[-8.0476, -34.877]}
      zoom={15}
      style={{ height: "85vh", width: "100%", borderRadius: "10px" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {formatedConstructions?.map((obra) => (
        <Marker
          key={obra.id}
          position={obra.coordenadas[0] as LatLngExpression}
        >
          <Popup>
            <strong>{obra.nome}</strong>
            <p>{obra.descricao}</p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
