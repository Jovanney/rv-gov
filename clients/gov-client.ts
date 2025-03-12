import ky from "ky";

export const govClient = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_GOV_API_URL,
  headers: {
    "chave-api-dados": process.env.NEXT_PUBLIC_GOV_API_KEY,
  },
});
