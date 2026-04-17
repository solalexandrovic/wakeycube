// store/ejecucionStore.js
import { create } from "zustand";
import { API_URL } from "../helpers/constants";

export const ejecucionStore = create((set, get) => ({
  ejecucion: null, 
  loading: false,

  fetchEjecucion: async () => {
    set({ loading: true });
    const res = await fetch(`${API_URL}/ejecucion.json`);
    const data = await res.json();
    set({
      ejecucion: data && data.activa ? data : null,
      loading: false,
    });
  },  

  iniciarEjecucion: async ({ escenaId, acciones }) => {
    const payload = {
      escenaId,
      acciones: acciones || [],
      activa: true,
    };
    
    await fetch(`${API_URL}/ejecucion.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    set({ ejecucion: payload });
  },

  detenerEjecucion: async () => {
    await fetch(`${API_URL}/ejecucion.json`, {
      method: "DELETE",
    });
    set({ ejecucion: null });
  },

  hayEjecucionActiva: () => {
    const e = get().ejecucion;
    return !!e?.activa;
  },
}));
