import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { ejecucionStore } from "../store/ejecucionStore";
import { DIAS_SEMANA, API_URL } from "../helpers/constants";

const esMomentoDeEjecutar = (escena, ahora) => {
  if (!Array.isArray(escena.diasHorarios) || escena.diasHorarios.length === 0) {
    return false;
  }

  const diaActualTexto = DIAS_SEMANA[ahora.getDay()];
  const horaActual = ahora.getHours();
  const minutoActual = ahora.getMinutes();

  return escena.diasHorarios.some((linea) => {
    if (!linea) return false;

    const [diaTexto, horaTexto] = linea.split(" ");
    if (!diaTexto || !horaTexto) return false;
    if (diaTexto !== diaActualTexto) return false;

    const [hhStr, mmStr] = horaTexto.split(":");
    const hh = Number(hhStr);
    const mm = Number(mmStr);

    if (Number.isNaN(hh) || Number.isNaN(mm)) return false;

    return hh === horaActual && mm === minutoActual;
  });
};

export const useEjecucionAutomaticaEscenas = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const intervalo = setInterval(async () => {
      try {
        const ahora = new Date();

        /* 1️ ¿Hay algo ejecutándose? */
        const ejecucionRes = await fetch(`${API_URL}/ejecucion.json`);
        const ejecucion = await ejecucionRes.json();

        if (ejecucion?.activa) {
          return; // sistema ocupado
        }

        /* 2️ Traer escenas */
        const res = await fetch(`${API_URL}/escenas.json`);
        if (!res.ok) return;

        const data = await res.json();
        if (!data) return;

        const escenas = Object.entries(data).map(([id, val]) => ({
          id,
          ...val,
        }));

        /* 3️ Buscar UNA escena ejecutable */
        const escenaAEjecutar = escenas.find((escena) =>
          esMomentoDeEjecutar(escena, ahora)
        );

        if (!escenaAEjecutar) return;

        /* 4️ Registrar ejecución global */
        ejecucionStore.getState().iniciarEjecucion({
          escenaId: escenaAEjecutar.id,
          acciones: escenaAEjecutar.acciones,
        });

        /* 5️ Historial */
        const fechaLegible = ahora.toLocaleString("es-UY", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });

        const historialAnterior = Array.isArray(escenaAEjecutar.historial)
          ? escenaAEjecutar.historial
          : [];

        await fetch(`${API_URL}/escenas/${escenaAEjecutar.id}.json`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            historial: [
              ...historialAnterior,
              {
                fecha: fechaLegible,
                dia: DIAS_SEMANA[ahora.getDay()],
                modo: "automático",
              },
            ],
          }),
        });

        /* 6️ Redirección si hay juego */
        const accionJuego = escenaAEjecutar.acciones?.find(
          (a) => a.funcionalidad === "juego_matematico"
        );

        if (accionJuego) {
          const dificultad =
            accionJuego.parametros?.dificultad || "facil";
          navigate(`/juego-matematico?dificultad=${dificultad}`);
        }

        queryClient.invalidateQueries({ queryKey: ["escenas"] });

        /* 7 Auto-apagado */
        const duracionMinutos = Number(escenaAEjecutar?.duracion) || 0;

        if (duracionMinutos > 0) {
          setTimeout(async () => {
            ejecucionStore.getState().detenerEjecucion();

            queryClient.invalidateQueries({ queryKey: ["escenas"] });
          }, duracionMinutos * 60 * 1000);
        }
      } catch (err) {
        console.error("Error en ejecución automática:", err);
      }
    }, 30 * 1000);

    return () => clearInterval(intervalo);
  }, [navigate, queryClient]);
};
