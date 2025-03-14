import ky from "ky";

export const localClient = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
});
