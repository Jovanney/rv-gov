/* eslint-disable @typescript-eslint/no-unused-vars */
import { useQuery } from "@tanstack/react-query";
import { getConstructionsAction } from "../actions/get-constructions-action";

export function IntegratedLeafletMap() {
  const {
    data: constructions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["banners-list"],
    queryFn: () => getConstructionsAction(),
  });

  const geometries = constructions?.data?.obras.map((obra) => obra.geometria);

  const formatedGeometries = geometries?.map((geometry) => {
    return geometry
      .split("|")
      .map((latLon) => latLon.split(","))
      .map(([lat, lon]) => [parseFloat(lat), parseFloat(lon)]);
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!constructions) {
    return <div>No constructions found</div>;
  }

  return <>oi</>;
}
