import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { crearSucursal } from "../../services/sucursales";

export default function NuevaSucursal() {
  const [nombre, setNombre] = useState("");
  const [calle, setCalle] = useState("");
  const [numero, setNumero] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [provincia, setProvincia] = useState("");
  const [telefono, setTelefono] = useState("");
  const [horario, setHorario] = useState("");
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [radioEntregaKm, setRadioEntregaKm] = useState("");

  const [errorNombre, setErrorNombre] = useState("");
  const [errorCalle, setErrorCalle] = useState("");
  const [errorLocalidad, setErrorLocalidad] = useState("");
  const [errorProvincia, setErrorProvincia] = useState("");
  const [errorLatitud, setErrorLatitud] = useState("");
  const [errorLongitud, setErrorLongitud] = useState("");
  const [errorRadio, setErrorRadio] = useState("");

  const { mostrarToast } = useToast();
  const navigate = useNavigate();

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Nueva sucursal</h1>

      <form
        className="max-w-xl flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();

          let hayErrores = false;

          if (nombre.trim().length < 3) {
            setErrorNombre(
              "El nombre debe tener al menos 3 caracteres.",
            );
            hayErrores = true;
          }

          if (calle.trim().length < 3) {
            setErrorCalle(
              "La calle debe tener al menos 3 caracteres.",
            );
            hayErrores = true;
          }

          if (localidad.trim().length < 2) {
            setErrorLocalidad(
              "La localidad debe tener al menos 2 caracteres.",
            );
            hayErrores = true;
          }

          if (provincia.trim().length < 2) {
            setErrorProvincia(
              "La provincia debe tener al menos 2 caracteres.",
            );
            hayErrores = true;
          }

          if (latitud === "") {
            setErrorLatitud("La latitud no puede estar vacía.");
            hayErrores = true;
          }

          if (longitud === "") {
            setErrorLongitud("La longitud no puede estar vacía.");
            hayErrores = true;
          }

          if (radioEntregaKm === "" || Number(radioEntregaKm) <= 0) {
            setErrorRadio(
              "El radio de entrega debe ser mayor a 0.",
            );
            hayErrores = true;
          }

          if (hayErrores) {
            return;
          }

          try {
            await crearSucursal({
              nombre,
              calle,
              numero,
              localidad,
              provincia,
              telefono,
              horario,
              latitud: Number(latitud),
              longitud: Number(longitud),
              codigoPostal,
              radioEntregaKm: Number(radioEntregaKm),
              
            });

            mostrarToast("Sucursal creada!");
            navigate("/admin/sucursales");
          } catch (error) {
            console.error("Error al crear sucursal:", error);
            mostrarToast(
    error instanceof Error ? error.message : "Error al crear la sucursal"
  );
          }
        }}
      >
        <div>
          <label>Nombre</label>
          <input
            type="text"
            value={nombre}
            maxLength={50}
            onChange={(e) => {
              setNombre(e.target.value);
              setErrorNombre("");
            }}
            className="w-full border rounded p-2"
            placeholder="Ej: Sucursal Centro"
          />

          {errorNombre && (
            <p className="text-red-600 text-sm mt-1">
              {errorNombre}
            </p>
          )}
        </div>

        <div>
          <label>Calle</label>
          <input
            type="text"
            value={calle}
            maxLength={100}
            onChange={(e) => {
              setCalle(e.target.value);
              setErrorCalle("");
            }}
            className="w-full border rounded p-2"
            placeholder="Ej: Avenida Rivadavia"
          />

          {errorCalle && (
            <p className="text-red-600 text-sm mt-1">
              {errorCalle}
            </p>
          )}
        </div>

        <div>
          <label>Número</label>
          <input
            type="text"
            value={numero}
            maxLength={10}
            onChange={(e) => setNumero(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Ej: 1234"
          />
        </div>

        <div>
          <label>Localidad</label>
          <input
            type="text"
            value={localidad}
            maxLength={50}
            onChange={(e) => {
              setLocalidad(e.target.value);
              setErrorLocalidad("");
            }}
            className="w-full border rounded p-2"
            placeholder="Ej: Hurlingham"
          />

          {errorLocalidad && (
            <p className="text-red-600 text-sm mt-1">
              {errorLocalidad}
            </p>
          )}
        </div>

        <div>
          <label>Provincia</label>
          <input
            type="text"
            value={provincia}
            maxLength={50}
            onChange={(e) => {
              setProvincia(e.target.value);
              setErrorProvincia("");
            }}
            className="w-full border rounded p-2"
            placeholder="Ej: Buenos Aires"
          />

          {errorProvincia && (
            <p className="text-red-600 text-sm mt-1">
              {errorProvincia}
            </p>
          )}
        </div>

        <div>
          <label>Código postal</label>
          <input
            type="text"
            value={codigoPostal}
            maxLength={10}
            onChange={(e) => setCodigoPostal(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Ej: 1686"
          />
        </div>

        <div>
          <label>Teléfono</label>
          <input
            type="text"
            value={telefono}
            maxLength={30}
            onChange={(e) => setTelefono(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Ej: 11-1234-5678"
          />
        </div>

        <div>
          <label>Horario</label>
          <input
            type="text"
            value={horario}
            maxLength={100}
            onChange={(e) => setHorario(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Ej: Lunes a viernes de 9 a 22 hs"
          />
        </div>

        <div>
          <label>Latitud</label>
          <input
            type="number"
            step="any"
            value={latitud}
            onChange={(e) => {
              setLatitud(e.target.value);
              setErrorLatitud("");
            }}
            className="w-full border rounded p-2"
            placeholder="Ej: -34.5895"
          />

          {errorLatitud && (
            <p className="text-red-600 text-sm mt-1">
              {errorLatitud}
            </p>
          )}
        </div>

        <div>
          <label>Longitud</label>
          <input
            type="number"
            step="any"
            value={longitud}
            onChange={(e) => {
              setLongitud(e.target.value);
              setErrorLongitud("");
            }}
            className="w-full border rounded p-2"
            placeholder="Ej: -58.6384"
          />

          {errorLongitud && (
            <p className="text-red-600 text-sm mt-1">
              {errorLongitud}
            </p>
          )}
        </div>

        <div>
          <label>Radio de entrega (km)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={radioEntregaKm}
            onChange={(e) => {
              setRadioEntregaKm(e.target.value);
              setErrorRadio("");
            }}
            className="w-full border rounded p-2"
            placeholder="Ej: 5"
          />

          {errorRadio && (
            <p className="text-red-600 text-sm mt-1">
              {errorRadio}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate("/admin/sucursales")}
            className="bg-danger hover:bg-danger-hover text-white
            border border-red-300 px-4 py-2 rounded transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="bg-action hover:bg-action-hover
            border border-orange-300 text-white px-4 py-2 rounded transition-colors"
          >
            Crear sucursal
          </button>
        </div>
      </form>
    </main>
  );
}