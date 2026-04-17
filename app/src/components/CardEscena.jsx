import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { MdPlayArrow, MdStop } from "react-icons/md";

import { DIAS_SEMANA, API_URL } from "../helpers/constants";
import { IMAGENES_ESCENAS } from "../helpers/constants";
import { ejecucionStore } from "../store/ejecucionStore";
import { useEscenasStore } from "../store/escenasStore";
import IconButtonPlay from "./Shared/IconButtonPlay";

const guardarHistorial = async (escena) => {
  const ahora = new Date();

  const registro = {
    fecha: ahora.toLocaleString("es-UY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    dia: DIAS_SEMANA[ahora.getDay()],
    modo: "manual",
  };

  const historialActual = Array.isArray(escena.historial)
    ? escena.historial
    : [];

  await fetch(`${API_URL}/escenas/${escena.id}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      historial: [...historialActual, registro],
    }),
  });
};


const limpiarRuta = (ruta) =>
  ruta?.replace(/^public\//, "/").replace(/^\/public\//, "/") ?? "";

const CardEscena = ({ id }) => {
  const navigate = useNavigate();

  const escena = useEscenasStore((s) => s.getEscena(id));
  const { ejecucion, hayEjecucionActiva, iniciarEjecucion, detenerEjecucion } = ejecucionStore();

  const [animando, setAnimando] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!escena) return null;

  const { titulo, imagenIndex, imagen, acciones = [] } = escena;

  const estaEscenaEnEjecucion = hayEjecucionActiva() && ejecucion?.escenaId === id;
  const hayOtraEscenaEnEjecucion = hayEjecucionActiva() && ejecucion?.escenaId !== id;

  const indexValido = Number.isInteger(imagenIndex) && IMAGENES_ESCENAS.length > 0 ? Math.abs(imagenIndex) % IMAGENES_ESCENAS.length : 0;

  // Se limpia la ruta en caso de que venga con "public/..."
  const imagenLimpia = imagen ? limpiarRuta(imagen) : null;
  const img = imagenLimpia && imagenLimpia.length > 0 ? imagenLimpia : IMAGENES_ESCENAS[indexValido];

  const handlePlay = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    if (hayOtraEscenaEnEjecucion) return;

    // STOP
    if (estaEscenaEnEjecucion) {
      setLoading(true);
      detenerEjecucion();
      setTimeout(() => setLoading(false), 400);
      return;
    }

    // PLAY
    setLoading(true);
    setAnimando(true);

    iniciarEjecucion({
      escenaId: escena.id,
      acciones: escena.acciones,
    });

    guardarHistorial(escena);

    // Detectar acciones
    const tieneAlarma = acciones.some((a) => a.funcionalidad === "alarma");
    const tieneVibracion = acciones.some((a) => a.funcionalidad === "vibracion");
    const accionJuego = acciones.some((a) => a.funcionalidad === "juego_matematico");
    const tieneGiroscopio = acciones.some(a => a.funcionalidad === "giro");

    // PRIORIDAD: juego matemático
    if (accionJuego) {
      const dificultad = accionJuego.parametros?.dificultad || "facil";

      navigate(`/juego-matematico?dificultad=${dificultad}`, {
        state: {
          alarma: tieneAlarma,
          vibracion: tieneVibracion,
          escenaId: escena.id
        },
      });
      return;
    }

    // 2️ Sin juego → pantalla de apagado directo
    if (tieneAlarma || tieneVibracion) {
      navigate("/apagar", {
        state: {
          alarma: tieneAlarma,
          vibracion: tieneVibracion,
          giroscopio: tieneGiroscopio,
          escenaId: escena.id
        },
      });
      return;
    }

    setTimeout(() => setAnimando(false), 150);
    setTimeout(() => setLoading(false), 900);
  };

  // icono cambia según estado: play si detenida, stop si en ejecución
  const Icon = estaEscenaEnEjecucion ? MdStop : MdPlayArrow;



  return (
    <Link
      to={`/escena/${id}`}
      className="relative h-32 md:w-48 rounded-2xl overflow-hidden shadow-sm flex items-end bg-cover bg-center"
      style={{ backgroundImage: `url(${img})` }}
    >
      <div className="absolute top-1 left-1 px-2 py-1 rounded-md text-[0.90rem] font-semibold text-gray-800">
        {titulo}
      </div>

      <IconButtonPlay
        icon={Icon}
        onClick={handlePlay}
        loading={loading}
        animando={animando}
        disabled={hayOtraEscenaEnEjecucion}

      />
    </Link>
  );
};

export default CardEscena;
