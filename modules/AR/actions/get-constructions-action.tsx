"use server";

import { localClient } from "@/clients/local-client";
import { HTTPError } from "ky";

export async function getConstructionsAction() {
  try {
    const constructions = await localClient.get("scan").json<{
      obras: {
        geometria: string;
        nome: string;
        descricao: string;
        idunico: string;
        uf: string;
        endereco: string | null;
        funcaosocial: string;
        metaglobal: string;
        datainicialprevista: string;
        datainicialefetiva: string | null;
        datafinalprevista: string;
        datafinalefetiva: string | null;
        especie: string;
        natureza: string;
        situacao: string;
        datasituacao: string;
        cep: string | null;
        enderecoareaexecutora: string;
        recursosorigem: string;
        recursosvalorinvestimento: number;
      }[];
    }>();
    console.log(constructions);
    return {
      success: true,
      message: null,
      errors: null,
      data: constructions,
    };
  } catch (err) {
    if (err instanceof HTTPError) {
      const { error } = await err.response.json();

      return { success: false, message: error, errors: null };
    }

    return {
      success: false,
      message: "Unexpected error, try again in a few minutes.",
      errors: null,
    };
  }
}
