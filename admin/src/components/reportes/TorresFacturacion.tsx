import { useEffect, useRef, useState, type CSSProperties } from "react";

import { Corona, IconoComida } from "./efectos/IconosComida";
import { iconoPorCategoria } from "./efectos/iconoPorCategoria";

/* =========================================================
   LAS TORRES DE MONEDAS (Mayor facturación)
   Cada producto es una pila de monedas: cuanto más factura,
   más alta. Al abrir la pestaña llueven monedas y las torres
   se arman. Al tocar la ganadora, se cae y se vuelve a armar.
   ========================================================= */

export type FilaFacturacion = {
  id: number | string;
  nombre: string;
  categoria: string | null;
  facturacion: number;            // número crudo
  unidades: number | null;        // del reporte de más vendidos
  puestoUnidades: number | null;  // su puesto en más vendidos
};

type Props = {
  filas: FilaFacturacion[];   // ordenadas de mayor a menor facturación
  totalFacturado: number;     // suma de TODOS los productos
  contexto: string;           // "Todas las sucursales" o el nombre de una
  limite?: number;
};

type Id = number | string;

const MAXIMO_MONEDAS = 14;
const DURACION_CONTADOR_MS = 1200;
const DURACION_LLUVIA_MS = 2800;

/* ---------- Utilidades ---------- */

const formatearDinero = (valor: number) =>
  valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

/* "$ 12,2 M", "$ 850 mil" o "$ 900" para que entre arriba de cada torre */
function dineroCorto(valor: number): string {
  if (valor >= 1_000_000) {
    return `$ ${(valor / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })} M`;
  }
  if (valor >= 1_000) {
    return `$ ${Math.round(valor / 1_000).toLocaleString("es-AR")} mil`;
  }
  return `$ ${Math.round(valor).toLocaleString("es-AR")}`;
}

/* Redondea a 1, 2, 5, 10, 20, 50... para que la leyenda sea legible */
function escalaRedonda(valor: number): number {
  if (valor <= 1) return 1;
  const potencia = 10 ** Math.floor(Math.log10(valor));
  const base = valor / potencia;
  const redondeo = base <= 1 ? 1 : base <= 2 ? 2 : base <= 5 ? 5 : 10;
  return redondeo * potencia;
}

/* Arma las monedas de una torre "a mano": cada una corrida y torcida */
function armarMonedas(cantidad: number, torre: number, rapido: boolean) {
  const inclinacion = (torre % 2 ? 1 : -1) * (0.25 + (torre % 3) * 0.15);
  const monedas = [];
  let altura = 0;

  for (let k = 0; k < cantidad; k++) {
    const ruido = ((k * 7 + torre * 11) % 9) - 4;
    monedas.push({
      abajo: altura,
      x: Math.round(ruido * 0.9 + k * inclinacion),
      giro: ((k * 5 + torre * 3) % 13) - 6,
      color: (k + torre) % 4 === 0 ? "#fcd34d" : "#fbbf24",
      // Al rearmarse (rapido) se llena más ligero que en el armado inicial
      retraso: rapido ? 0.3 + k * 0.07 : 0.25 + k * 0.1 + torre * 0.04,
      // Hacia dónde sale volando si se derrumba
      dx: ((k * 37 + 11) % 150) - 75,
      dy: 140 + (k % 5) * 28,
      giroCaida: ((k * 53) % 540) - 270,
      retrasoCaida: (cantidad - k) * 0.025,
      esLaDeArriba: k === cantidad - 1,
    });
    altura += 8 + ((k + torre) % 3);
  }

  return { monedas, altura };
}

/* Gotas de la lluvia de monedas (posiciones fijas) */
const LLUVIA = Array.from({ length: 18 }, (_, i) => ({
  izquierda: `${(i * 37 + 5) % 92}%`,
  tamanio: 16 + ((i * 7) % 12),
  retraso: (i * 0.13) % 1.1,
  duracion: 1.4 + (i % 4) * 0.25,
  giro: (i % 2 ? 1 : -1) * (180 + ((i * 29) % 300)),
}));

/* Moneda en SVG para la lluvia */
function MonedaSvg({ tamanio }: { tamanio: number }) {
  return (
    <svg viewBox="0 0 24 24" width={tamanio} height={tamanio} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="7" fill="none" stroke="#d97706" strokeWidth="1" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="800" fill="#92400e">
        $
      </text>
    </svg>
  );
}

/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */

export default function TorresFacturacion({
  filas,
  totalFacturado,
  contexto,
  limite = 5,
}: Props) {
  const visibles = filas.slice(0, limite);

  const [seleccionadoId, setSeleccionadoId] = useState<Id | null>(null);
  const [impresion, setImpresion] = useState(0);         // reimprime el comprobante
  const [totalMostrado, setTotalMostrado] = useState(0); // contador de la caja
  const [lloviendo, setLloviendo] = useState(true);      // lluvia del armado inicial
  const [cayendo, setCayendo] = useState(0);             // id de la caída en curso (0 = nada)
  const [rapido, setRapido] = useState(false);           // la ganadora se rearma ligero
  const [version, setVersion] = useState(0);             // sube en cada caída: monedas nuevas
  const [cajonAbierto, setCajonAbierto] = useState(false);
  const [cartel, setCartel] = useState(0);

  const temporizadores = useRef<ReturnType<typeof setTimeout>[]>([]);

  const despues = (fn: () => void, ms: number) => {
    temporizadores.current.push(setTimeout(fn, ms));
  };

  // Al aparecer: la caja cuenta el total y la lluvia arma las torres
  useEffect(() => {
    let inicio: number | null = null;
    let cuadro = 0;

    const contar = (ahora: number) => {
      if (inicio === null) inicio = ahora; // el primer cuadro marca el arranque
      const avance = Math.min(1, (ahora - inicio) / DURACION_CONTADOR_MS);
      const suave = 1 - (1 - avance) ** 3; // frena al final
      setTotalMostrado(Math.round(totalFacturado * suave));
      if (avance < 1) cuadro = requestAnimationFrame(contar);
    };
    cuadro = requestAnimationFrame(contar);

    const lista = temporizadores.current;
    lista.push(setTimeout(() => setLloviendo(false), DURACION_LLUVIA_MS));

    return () => {
      cancelAnimationFrame(cuadro);
      lista.forEach(clearTimeout);
    };
  }, [totalFacturado]);

  /* ---------- Escala ---------- */

  const maximo = Math.max(...visibles.map((fila) => fila.facturacion), 0);
  const porMoneda = escalaRedonda(maximo / MAXIMO_MONEDAS);
  const elegido = visibles.find((fila) => fila.id === seleccionadoId) ?? visibles[0];

  /* ---------- Eventos ---------- */

  const tocarTorre = (fila: FilaFacturacion, esLaGanadora: boolean) => {
    setSeleccionadoId(fila.id);
    setImpresion((n) => n + 1);

    if (!esLaGanadora || cayendo !== 0) return;

    // Las monedas viejas se caen y, sin pausa, las nuevas ya llueven sobre la misma torre
    const id = version + 1; // cada caída tiene su número
    setCayendo(id);
    setVersion(id);
    setRapido(true);
    setLloviendo(true);
    setCajonAbierto(true);
    setCartel(id);

    despues(() => setCajonAbierto(false), 2400);
    despues(() => {
      setLloviendo(false);
      setCayendo(0);
    }, 2600);
    despues(() => setCartel((actual) => (actual === id ? 0 : actual)), 3800);
  };

  if (!elegido) return null;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-w-0 flex-col gap-3">
        {/* ===================== CAJA REGISTRADORA ===================== */}
        <div className="flex flex-col items-end">
          <div
            aria-live="polite"
            className="flex min-w-[230px] items-center justify-between gap-3 rounded-t-xl rounded-b-sm bg-green-900 px-4 py-2 font-mono shadow-[0_2px_6px_rgb(20_83_45/0.35)]"
          >
            <span className="text-[11px] tracking-widest text-green-300">TOTAL</span>
            <strong className="text-lg tracking-wide text-green-100">
              {formatearDinero(totalMostrado)}
            </strong>
          </div>
          <div
            aria-hidden="true"
            className={`rep-cajon mx-2 flex min-w-[214px] items-end justify-center gap-1 rounded-b-lg bg-gray-200 shadow-[inset_0_3px_6px_rgb(0_0_0/0.15)] ${
              cajonAbierto ? "rep-abierto" : ""
            }`}
          >
            {cajonAbierto &&
              [0, 0.08, 0.16, 0.24].map((retraso) => (
                <span
                  key={retraso}
                  className="rep-billete mb-1 flex h-[26px] w-[34px] items-center justify-center rounded-sm border border-green-700 bg-green-400 text-[11px] font-extrabold text-green-900"
                  style={{ animationDelay: `${retraso}s` }}
                >
                  $
                </span>
              ))}
          </div>
        </div>

        {/* ===================== LAS TORRES ===================== */}
        <div className="relative overflow-hidden rounded-xl bg-green-50 px-2 pt-3 shadow-[inset_0_2px_10px_rgb(21_128_61/0.07)] ring-1 ring-green-200 sm:px-3">
          {/* Lluvia de monedas */}
          {lloviendo && (
            <div key={cayendo} className="rep-lluvia" aria-hidden="true">
              {LLUVIA.map((gota, i) => (
                <span
                  key={i}
                  className="rep-gota"
                  style={
                    {
                      left: gota.izquierda,
                      width: gota.tamanio,
                      height: gota.tamanio,
                      animationDelay: `${gota.retraso}s`,
                      animationDuration: `${gota.duracion}s`,
                      "--giro": `${gota.giro}deg`,
                    } as CSSProperties
                  }
                >
                  <MonedaSvg tamanio={gota.tamanio} />
                </span>
              ))}
            </div>
          )}

          {/* Cartel */}
          {cartel !== 0 && (
            <div
              key={cartel}
              role="status"
              className="rep-cartel flex items-center gap-2 rounded-full border border-green-300 bg-white px-4 py-2 text-sm font-bold text-gray-900 shadow-md"
            >
              <span className="rep-corona">
                <Corona tamanio={22} />
              </span>
              ¡Cha-ching! {visibles[0].nombre} es la que más factura
            </div>
          )}

          <p className="relative mb-1 px-1 text-xs text-green-800">
            Cada moneda equivale a{" "}
            <strong>{formatearDinero(porMoneda)}</strong> facturados.
          </p>

          <div className="relative flex min-h-[300px] items-end justify-around gap-1 pt-8">
            {visibles.map((fila, indice) => {
              const esLaGanadora = indice === 0 && maximo > 0;
              const elegida = fila.id === elegido.id;
              const cantidad =
                fila.facturacion > 0
                  ? Math.max(2, Math.round(fila.facturacion / porMoneda))
                  : 0;
              const { monedas, altura } = armarMonedas(
                cantidad,
                indice,
                esLaGanadora && rapido,
              );
              const seEstaCayendo = esLaGanadora && cayendo !== 0;
              const valeOro =
                fila.puestoUnidades !== null && indice + 1 < fila.puestoUnidades;

              return (
                <button
                  key={fila.id}
                  type="button"
                  onClick={() => tocarTorre(fila, esLaGanadora)}
                  aria-pressed={elegida}
                  aria-label={`${fila.nombre}, ${dineroCorto(fila.facturacion)} facturados, puesto ${indice + 1}.${
                    esLaGanadora ? " Tocá para celebrar." : ""
                  }`}
                  className={`rep-torre relative flex min-w-0 max-w-[120px] flex-1 flex-col items-center gap-1.5 rounded-xl px-0.5 pb-2.5 pt-2 ${
                    esLaGanadora ? "z-10" : "z-0"
                  } ${elegida ? "bg-white shadow-[0_4px_12px_rgb(21_128_61/0.15)] ring-2 ring-green-300" : ""}`}
                >
                  {esLaGanadora && (
                    <span className="rep-corona">
                      <Corona tamanio={26} titulo="Primer puesto" />
                    </span>
                  )}

                  <span className="whitespace-nowrap text-[11px] font-extrabold text-green-900 sm:text-xs">
                    {dineroCorto(fila.facturacion)}
                  </span>

                  {/* La pila */}
                  <span
                    className={`relative w-16 sm:w-[84px] ${esLaGanadora ? "rep-torre-oro" : ""}`}
                    style={{ height: altura + 10 }}
                  >
                    {/* Monedas viejas cayéndose (solo durante la caída) */}
                    {seEstaCayendo &&
                      monedas.map((moneda, k) => (
                        <span
                          key={`cae-${k}`}
                          aria-hidden="true"
                          className="rep-moneda rep-cayendo"
                          style={
                            {
                              bottom: moneda.abajo,
                              "--x": `${moneda.x}px`,
                              "--r": `${moneda.giro}deg`,
                              "--dx": `${moneda.dx}px`,
                              "--dy": `${moneda.dy}px`,
                              "--giro": `${moneda.giroCaida}deg`,
                              "--d": `${moneda.retrasoCaida}s`,
                            } as CSSProperties
                          }
                        >
                          <span className="rep-moneda-cara" style={{ "--c": moneda.color } as CSSProperties}>
                            {moneda.esLaDeArriba ? "$" : ""}
                          </span>
                        </span>
                      ))}

                    {/* Monedas de la torre (la key nueva hace que vuelvan a caer desde arriba) */}
                    {monedas.map((moneda, k) => (
                      <span
                        key={`${esLaGanadora ? version : 0}-${k}`}
                        aria-hidden="true"
                        className="rep-moneda"
                        style={
                          {
                            bottom: moneda.abajo,
                            animationDelay: `${moneda.retraso}s`,
                            "--x": `${moneda.x}px`,
                            "--r": `${moneda.giro}deg`,
                          } as CSSProperties
                        }
                      >
                        <span
                          className={`rep-moneda-cara ${moneda.esLaDeArriba ? "rep-moneda-top" : ""}`}
                          style={{ "--c": moneda.color } as CSSProperties}
                        >
                          {moneda.esLaDeArriba ? "$" : ""}
                        </span>
                      </span>
                    ))}

                    {/* Monedas sueltas al pie */}
                    {cantidad > 0 &&
                      [
                        { izquierda: 2, giro: -8, empuje: -8 },
                        { izquierda: 54, giro: 10, empuje: 16 },
                      ]
                        .slice(0, indice < 2 ? 2 : 1)
                        .map((suelta, k) => (
                          <span
                            key={k}
                            aria-hidden="true"
                            className={`absolute bottom-0 h-2.5 w-[30px] ${seEstaCayendo ? "rep-empujada" : ""}`}
                            style={{ left: `${suelta.izquierda}%`, "--ex": `${suelta.empuje}px` } as CSSProperties}
                          >
                            <span
                              className="rep-moneda-suelta left-0"
                              style={{
                                animationDelay: `${0.35 + cantidad * 0.1 + k * 0.15}s`,
                                transform: `rotate(${suelta.giro}deg)`,
                                "--r": `${suelta.giro}deg`,
                              } as CSSProperties}
                            />
                          </span>
                        ))}

                    {/* La moneda de canto de la ganadora */}
                    {esLaGanadora && (
                      <span
                        aria-hidden="true"
                        className="rep-moneda-canto"
                        style={{ animationDelay: "2s", transform: "rotate(14deg)", "--r": "14deg" } as CSSProperties}
                      >
                        $
                      </span>
                    )}

                    {/* Chispitas "$" al pasar el mouse */}
                    {["34%", "50%", "64%"].map((izquierda, k) => (
                      <span
                        key={izquierda}
                        aria-hidden="true"
                        className="rep-chispa"
                        style={{ left: izquierda, bottom: altura + 10, animationDelay: `${k * 0.3}s` }}
                      >
                        $
                      </span>
                    ))}
                  </span>

                  {/* El piso */}
                  <span className="h-1 w-full rounded-sm bg-green-300" />

                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white ring-1 ring-gray-300">
                    <IconoComida tipo={iconoPorCategoria(fila.categoria)} tamanio={22} />
                  </span>

                  <span className="line-clamp-2 min-h-[30px] w-full text-center text-[11px] font-semibold leading-tight text-gray-800 sm:text-xs">
                    {fila.nombre}
                  </span>

                  {valeOro && (
                    <span className="rep-etiqueta-oro whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide">
                      VALE ORO
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===================== EL COMPROBANTE ===================== */}
      <aside
        aria-label="Comprobante del producto"
        className="mx-auto w-full max-w-sm py-2.5 lg:max-w-none"
      >
        <Comprobante
          key={`${elegido.id}-${impresion}`}
          fila={elegido}
          puestoPlata={visibles.indexOf(elegido) + 1}
          totalFacturado={totalFacturado}
          contexto={contexto}
        />
      </aside>
    </div>
  );
}

/* =========================================================
   COMPROBANTE DE FACTURACIÓN
   ========================================================= */

function Renglon({ concepto, valor }: { concepto: string; valor: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="min-w-0">{concepto}</span>
      <span className="min-w-3 flex-1 border-b border-dotted border-green-300" />
      <strong className="shrink-0 whitespace-nowrap text-gray-900">{valor}</strong>
    </div>
  );
}

type ComprobanteProps = {
  fila: FilaFacturacion;
  puestoPlata: number;
  totalFacturado: number;
  contexto: string;
};

function Comprobante({ fila, puestoPlata, totalFacturado, contexto }: ComprobanteProps) {
  const porcentaje = totalFacturado > 0 ? (fila.facturacion / totalFacturado) * 100 : 0;
  const precioPromedio =
    fila.unidades && fila.unidades > 0 ? fila.facturacion / fila.unidades : null;

  // Comparamos el puesto en plata con el puesto en unidades
  const valeOro = fila.puestoUnidades !== null && puestoPlata < fila.puestoUnidades;
  const altoVolumen = fila.puestoUnidades !== null && puestoPlata > fila.puestoUnidades;

  return (
    <div
      aria-live="polite"
      className="rep-ticket-verde min-h-[440px] border-x border-green-300 px-5 py-6 font-mono text-gray-700 shadow-[0_2px_4px_rgb(21_128_61/0.12),0_14px_32px_rgb(21_128_61/0.18)]"
    >
      <div className="rep-imprimir flex flex-col gap-3">
        {/* Encabezado */}
        <div className="text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-green-800">BURGERFAST</p>
          <p className="text-[11px] tracking-[0.12em] text-green-800">
            COMPROBANTE DE FACTURACIÓN
          </p>
          <p className="text-[11px] text-gray-500">{contexto} · Pedidos entregados</p>
        </div>

        <div className="border-t-2 border-dashed border-green-300" />

        {/* Producto */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-sans text-xl font-extrabold leading-tight text-gray-900">
              {fila.nombre}
            </p>
            <p className="mt-1 text-xs text-gray-500">{fila.categoria ?? "Sin categoría"}</p>
          </div>
          {puestoPlata === 1 && (
            <span className="rep-corona shrink-0">
              <Corona tamanio={34} titulo="Mayor facturación" />
            </span>
          )}
        </div>

        {/* Números */}
        <div className="flex flex-col gap-1.5 text-[13px]">
          <Renglon concepto="Facturación" valor={formatearDinero(fila.facturacion)} />
          <Renglon
            concepto="Unidades vendidas"
            valor={fila.unidades !== null ? `${fila.unidades.toLocaleString("es-AR")} u.` : "—"}
          />
          <Renglon
            concepto="Precio promedio"
            valor={precioPromedio !== null ? formatearDinero(precioPromedio) : "—"}
          />
        </div>

        {/* Parte del total */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span>Parte de la facturación total</span>
            <strong className="text-gray-900">
              {porcentaje.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%
            </strong>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-green-100 ring-1 ring-green-200">
            <div
              className="rep-barra h-full rounded-full bg-green-600"
              style={{ width: `${Math.min(porcentaje, 100)}%` }}
            />
          </div>
        </div>

        <div className="border-t-2 border-dashed border-green-300" />

        {/* Puesto en plata vs. puesto en unidades */}
        <div className="grid grid-cols-2 gap-2 font-sans">
          <div className="rounded-lg bg-white px-2 py-2 text-center ring-1 ring-green-200">
            <span className="block text-[11px] text-gray-500">Puesto en plata</span>
            <strong className="text-2xl text-green-700">{puestoPlata}.º</strong>
          </div>
          <div className="rounded-lg bg-white px-2 py-2 text-center ring-1 ring-gray-200">
            <span className="block text-[11px] text-gray-500">Puesto en unidades</span>
            <strong className="text-2xl text-gray-700">
              {fila.puestoUnidades !== null ? `${fila.puestoUnidades}.º` : "—"}
            </strong>
          </div>
        </div>

        {valeOro && (
          <div className="flex flex-col gap-1.5">
            <span className="rep-sello self-start border-2 border-amber-700 px-2 py-0.5 text-xs font-bold tracking-wider text-amber-800">
              VALE ORO
            </span>
            <span className="text-xs text-gray-700">
              Se vende menos que otros, pero deja más plata por cada venta.
            </span>
          </div>
        )}
        {altoVolumen && (
          <div className="flex flex-col gap-1.5">
            <span className="rep-sello self-start border-2 border-green-700 px-2 py-0.5 text-xs font-bold tracking-wider text-green-800">
              ALTO VOLUMEN
            </span>
            <span className="text-xs text-gray-700">
              Se vende mucho, pero a precio bajo: cada venta deja poco.
            </span>
          </div>
        )}
        {!valeOro && !altoVolumen && fila.puestoUnidades !== null && (
          <span className="text-xs text-gray-700">
            Vende y factura parejo: está donde tiene que estar.
          </span>
        )}

        {/* Código de barras decorativo */}
        <div
          aria-hidden="true"
          className="mt-1 h-8 bg-[repeating-linear-gradient(90deg,#1f2937_0_2px,transparent_2px_4px,#1f2937_4px_7px,transparent_7px_9px,#1f2937_9px_10px,transparent_10px_13px)]"
        />
      </div>
    </div>
  );
}