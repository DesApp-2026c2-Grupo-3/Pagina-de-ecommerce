import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "../../context/ToastContext";
import {
  obtenerSucursalPorId,
  actualizarSucursal,
} from "../../services/sucursalService";

export default function EditarSucursal() {
  const { id } = useParams();
  const { mostrarToast } = useToast();
  const navigate = useNavigate();

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

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const sucursal = await obtenerSucursalPorId(Number(id));

        setNombre(sucursal.nombre);
        setCalle(sucursal.calle);
        setNumero(sucursal.numero || "");
        setLocalidad(sucursal.localidad);
        setProvincia(sucursal.provincia);
        setTelefono(sucursal.telefono || "");
        setHorario(sucursal.horario || "");
        setLatitud(sucursal.latitud.toString());
        setLongitud(sucursal.longitud.toString());
        setCodigoPostal(sucursal.codigoPostal || "");
        setRadioEntregaKm(sucursal.radioEntregaKm.toString());
      } catch (error) {
        console.error("Error al cargar la sucursal:", error);
      }
    };

    cargarDatos();
  }, [id]);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Editar sucursal</h1>

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
            await actualizarSucursal(Number(id), {
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

            mostrarToast("Sucursal modificada!");
            navigate("/admin/sucursales");
          } catch (error) {
            console.error("Error al modificar sucursal:", error);
          }
        }}
      >
        <div>
          <label>Nombre</label>
          <input
            type="text"
            maxLength={50}
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setErrorNombre("");
            }}
            className="w-full border rounded p-2"
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
            maxLength={100}
            value={calle}
            onChange={(e) => {
              setCalle(e.target.value);
              setErrorCalle("");
            }}
            className="w-full border rounded p-2"
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
            maxLength={10}
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label>Localidad</label>
          <input
            type="text"
            maxLength={50}
            value={localidad}
            onChange={(e) => {
              setLocalidad(e.target.value);
              setErrorLocalidad("");
            }}
            className="w-full border rounded p-2"
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
            maxLength={50}
            value={provincia}
            onChange={(e) => {
              setProvincia(e.target.value);
              setErrorProvincia("");
            }}
            className="w-full border rounded p-2"
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
            maxLength={10}
            value={codigoPostal}
            onChange={(e) => setCodigoPostal(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label>Teléfono</label>
          <input
            type="text"
            maxLength={30}
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label>Horario</label>
          <input
            type="text"
            maxLength={100}
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
            className="w-full border rounded p-2"
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
            Guardar cambios
          </button>
        </div>
      </form>
    </main>
  );
}