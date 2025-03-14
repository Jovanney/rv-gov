"use server";

import { localClient } from "@/clients/local-client";
import { HTTPError } from "ky";

export async function getConstructionsAction() {
  try {
    const constructions = await localClient
      .get("scan")
      .json<{ obras: { geometria: string }[] }>();
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
