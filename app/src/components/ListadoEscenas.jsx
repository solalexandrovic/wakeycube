import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_URL, DIAS_SEMANA } from "../helpers/constants";
import { useEscenasStore } from "../store/escenasStore";
import { ejecucionStore } from "../store/ejecucionStore";
import SeccionEscenaDash from "./SeccionEscenaDash";
import Loader from "./Shared/Loader";
import Message from "./Shared/Message";

const minutosHastaProximaEjecucion = (escena) => {
  if (!Array.isArray(escena.diasHorarios) || escena.diasHorarios.length === 0) {
    return null;
  }

  const ahora = new Date();
  const diaActual = ahora.getDay(); // 0=domingo
  let mejorDiff = null; // guarda el menor número de minutos encontrado

  for (const linea of escena.diasHorarios) {
    if (!linea) continue;

    const [diaTexto, horaTexto] = linea.split(" ");
    if (!diaTexto || !horaTexto) continue;

    // Convertir el día textual a índice
    const idxDia = DIAS_SEMANA.indexOf(diaTexto);
    if (idxDia === -1) continue;

    // Parseo de la hora
    const [hhStr, mmStr] = horaTexto.split(":");
    const hh = Number(hhStr);
    const mm = Number(mmStr);
    if (Number.isNaN(hh) || Number.isNaN(mm)) continue;

    // Generar una fecha con ese día y hora
    const proxima = new Date(ahora);
    proxima.setHours(hh, mm, 0, 0);

    let diffDias = idxDia - diaActual;
    if (diffDias < 0) diffDias += 7; // si el día ya pasó, va a la semana siguiente

    proxima.setDate(proxima.getDate() + diffDias);

    // Si la hora ya pasó hoy, va a la próxima semana
    if (proxima <= ahora) {
      proxima.setDate(proxima.getDate() + 7);
    }

    // Diferencia en minutos
    const diffMin = (proxima - ahora) / 60000;

    // Nos quedamos con la ejecución más cercana
    if (mejorDiff === null || diffMin < mejorDiff) {
      mejorDiff = diffMin;
    }
  }

  return mejorDiff;
};


const ListadoEscenas = ({ search = "" }) => {
  const { escenas, setEscenas } = useEscenasStore();

  const ejecucion = ejecucionStore((s) => s.ejecucion);
  const ejecucionLoading = ejecucionStore((s) => s.loading);
  const fetchEjecucion = ejecucionStore((s) => s.fetchEjecucion);

  useEffect(() => {
    fetchEjecucion();
  }, [fetchEjecucion]);

  // Obtener las escenas desde Firebase 
  const { isLoading, error } = useQuery({
    queryKey: ["escenas"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/escenas.json`);
      if (!res.ok) throw new Error("Error al cargar escenas");
      const data = await res.json();
      const arr = data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [];
      setEscenas(arr);
      return arr;
    },
  });

  // Esperamos a que esté TODO listo
  if (isLoading || ejecucionLoading) return <Loader />;
  if (error) return <Message variant="error" message={error.message} />;

  // Search
  const normalizado = search.trim().toLowerCase();
  const escenasFiltradas = normalizado ? escenas.filter((e) => e.titulo?.toLowerCase().includes(normalizado)) : escenas;

  // ESCENA EN EJECUCIÓN (UNA SOLA)
  const escenaEnEjecucionId = ejecucion?.escenaId ?? null;
  const escenasEnEjecucion = escenaEnEjecucionId ? escenasFiltradas.filter((e) => e.id === escenaEnEjecucionId) : [];

  // Mis escenas / resto que no está en ejecución
  const escenasNoEjecutadas = escenasFiltradas.filter((e) => e.id !== escenaEnEjecucionId);


  return (
    <>
      {escenasFiltradas.length > 0 && (
        <div className="flex flex-col gap-6 w-full">
          <SeccionEscenaDash
            tituloSeccion="Escena en ejecución"
            tipoEscena={escenasEnEjecucion}
            mensaje="No hay ninguna escena ejecutándose en este momento."
          />

          <SeccionEscenaDash
            tituloSeccion="Mis escenas"
            tipoEscena={escenasNoEjecutadas}
            mensaje="No tenés escenas creadas."
          />
        </div>
      )}

      {escenas.length === 0 && (
        <Message
          variant="info"
          message="No hay escenas disponibles, agregá una para comenzar"
        />
      )}

      {escenas.length > 0 && escenasFiltradas.length === 0 && (
        <Message
          variant="info"
          message="No se encontraron escenas que coincidan con la búsqueda"
        />
      )}
    </>
  );
};

export default ListadoEscenas;
