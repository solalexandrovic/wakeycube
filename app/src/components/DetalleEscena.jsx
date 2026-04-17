import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { API_URL } from "../helpers/constants";

import Message from "./Shared/Message";
import Loader from "./Shared/Loader";
import Button from "./Shared/Button";
import TextButton from "./Shared/TextButton";
import BloqueHistorial from "./BloqueHistorial";
import BloqueTexto from "./BloqueTexto";
import BloqueLista from "./BloqueLista";
import BloqueAcciones from "./BloqueAcciones";

const DetalleEscena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Todos los hooks primero
  const { data: escena, isLoading, error } = useQuery({
    queryKey: ["escena", id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/escenas/${id}.json`);
      if (!res.ok) throw new Error("Error al cargar escena");
      const data = await res.json();
      return data ? { id, ...data } : null;
    },
  });

  const { mutate: eliminarEscena, isPending } = useMutation({
    mutationFn: async () => {
      await fetch(`${API_URL}/escenas/${id}.json`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escenas"] });
      navigate("/");
    },
  });

  if (isLoading) return <Loader />;
  if (error) return <Message variant="error" message={error.message || "Error al cargar la escena"} />;

  // Redirigir si no existe la escena
  if (!escena) {
    navigate("*");
    return null;
  }

  const { titulo, descripcion, duracion = 0, diasHorarios = [], acciones = [], historial = [], } = escena;

  return (
    <section className="p-4 pb-24 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <TextButton label="Volver" onClick={() => navigate("/")} variante="volver" />
        <h1 className="text-lg font-semibold text-center flex-1">{titulo}</h1>
        <span className="w-10" />
      </header>

      <BloqueTexto titulo="Descripción" texto={descripcion} />
      <BloqueLista titulo="Días y horarios programados" items={diasHorarios} mensaje="No hay horarios definidos." />
      <BloqueAcciones acciones={acciones} />
      <BloqueHistorial historial={historial} />

      <article className="mt-4 flex flex-col gap-2">
        <Button label="Editar escena" variante="secundario" onClick={() => navigate(`/escena/${id}/editar`)} />
        <Button label="Eliminar escena" variante="peligro" onClick={eliminarEscena} disabled={isPending} />
      </article>
    </section>
  );
};

export default DetalleEscena;
