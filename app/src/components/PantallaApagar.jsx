import { useLocation, useNavigate } from "react-router-dom";
import { ejecucionStore } from "../store/ejecucionStore";
import Button from "../components/Shared/Button";
import { API_URL } from "../helpers/constants";
import { useEffect } from "react";


const PantallaApagar = () => {
    const navigate = useNavigate();
    const { state } = useLocation();

    const ejecucion = ejecucionStore((s) => s.ejecucion);
    const fetchEjecucion = ejecucionStore((s) => s.fetchEjecucion);

    const tieneAlarma = state?.alarma;
    const tieneVibracion = state?.vibracion;
    const tieneGiroscopio = state?.giroscopio;
    const escenaId = state?.escenaId;

    useEffect(() => {
        if (!state?.giroscopio) return;

        const timeout = setTimeout(() => {
            navigate("/");
        }, 8000);

        return () => clearTimeout(timeout);
    }, [tieneGiroscopio, navigate]);


    const getLabel = () => {
        if (tieneAlarma && tieneVibracion) return "Apagar alarma y vibración";
        if (tieneAlarma) return "Apagar alarma";
        if (tieneVibracion) return "Apagar vibración";
        return "Apagar";
    };

    const handleApagar = async () => {
        if (!ejecucion?.acciones) return;

        const accionesFiltradas = ejecucion.acciones.filter((a) => {
            if (tieneAlarma && a.funcionalidad === "alarma") return false;
            if (tieneVibracion && a.funcionalidad === "vibracion") return false;
            return true;
        });

        await fetch(`${API_URL}/ejecucion.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                acciones: accionesFiltradas,
                activa: true,
                escenaId: escenaId,
                updatedAt: Date.now(), // SOLO PARA NOTIFICAR
            }),
        });

        console.log(escenaId);
        await fetchEjecucion();
        navigate("/");
    };


    return (
        <div className="h-screen w-full bg-linear-to-br from-pink-200 via-violet-200 to-blue-200 flex items-center justify-center p-8">
            {!tieneGiroscopio ? (
                <div className="w-full flex flex-col gap-y-55 pb-60 items-center">
                    <img src="/LOGO.webp" alt="logo" className="w-45" />
                    <Button
                        type="button"
                        variante="primario"
                        label={getLabel()}
                        onClick={handleApagar}
                    />
                </div>

            ) : (
                <p className="text-center text-xl font-semibold text-gray-700 max-w-xs">
                    Girá o incliná el WakeyCube para apagar
                    {tieneAlarma && tieneVibracion
                        ? " la alarma y la vibración"
                        : tieneAlarma
                            ? " la alarma"
                            : " la vibración"}
                </p>
            )}
        </div>

    );
};



export default PantallaApagar;
