import { FaLightbulb, FaQuestionCircle, FaClock, FaSun, FaCalculator, FaWaveSquare, FaSyncAlt } from "react-icons/fa";
import { labelFuncionalidad } from "../helpers/text";
import IconButton from "./Shared/IconButton";


const iconosPorAccion = {
  luz: (
    <IconButton variante="small" icon={FaLightbulb} bgColor="bg-yellow-50" textColor="text-yellow-500" />
  ),
  giro: (
    <IconButton variante="small" icon={FaSyncAlt} bgColor="bg-blue-100" textColor="text-sky-600" />
  ),
  ajuste_luz: (
    <IconButton variante="small" icon={FaSun}  bgColor="bg-orange-50" textColor="text-amber-500"/>
  ),
  alarma: (
    <IconButton variante="small" icon={FaClock} />
  ),
  juego_matematico: (
    <IconButton variante="small" icon={FaCalculator} bgColor="bg-rose-100" textColor="text-rose-500" />
  ),
  vibracion: (
    <IconButton variante="small" icon={FaWaveSquare} />
  )
};

const BloqueAcciones = ({ acciones }) => {

  return (
    <article className="bg-white rounded-xl shadow-sm p-4">
      <h2 className="text-sm font-semibold mb-2"> Acciones asociadas al cubito </h2>

      {acciones.length === 0 ? (
        <p className="text-sm text-gray-500">  No hay acciones configuradas para esta escena. </p>
      ) : (
        <ul className="space-y-2">
          {acciones.map((accion, index) => {
            const icono = iconosPorAccion[accion.funcionalidad] || <FaQuestionCircle className="text-gray-400" />

            return (
              <li key={index} className="text-sm text-gray-700 border border-gray-100 rounded-lg px-3 py-2">
               
                {/* Título con icono */}
                <div className="flex items-center gap-2">
                  {icono}
                  <p className="font-medium"> {labelFuncionalidad(accion.funcionalidad)} </p>
                </div>

                {/* Parámetros */}
                {accion.parametros &&
                  Object.keys(accion.parametros).length > 0 ? (
                  <ul className="mt-1 ml-6 text-xs text-gray-600">
                    {Object.entries(accion.parametros).map(
                      ([param, valor]) => (
                        <li key={param}> <strong>{labelFuncionalidad(param)}:</strong> {valor}</li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="mt-1 ml-6 text-xs text-gray-400"> Sin parámetros </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
};

export default BloqueAcciones;
