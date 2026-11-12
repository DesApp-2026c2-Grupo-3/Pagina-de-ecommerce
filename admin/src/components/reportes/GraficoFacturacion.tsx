
import {
  PieChart,
  Pie,
  Sector,
  Tooltip,
  ResponsiveContainer,
  type PieSectorShapeProps,
} from "recharts";

interface DatoFacturacion {
  nombre: string;
  facturacion: number;
}

interface GraficoFacturacionProps {
  datos: DatoFacturacion[];
}

const COLORES = [
  "#ea580c",
  "#64748b",
  "#16a34a",
  "#7c3aed",
  "#0891b2",
];

const formatoDinero = (valor: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor);

function SectorColoreado(props: PieSectorShapeProps) {
  const indice = Number(props.index ?? 0);

  return (
    <Sector
      {...props}
      fill={COLORES[indice % COLORES.length]}
    />
  );
}

export default function GraficoFacturacion({ datos}: GraficoFacturacionProps) {

  const datosGrafico = datos
    .filter((producto) => producto.facturacion > 0)
    .map((producto) => ({
      ...producto,
      nombre:
        producto.nombre.length > 22
          ? `${producto.nombre.slice(0, 22)}…`
          : producto.nombre,
    }));

    const facturacionTotal = datosGrafico.reduce(
        (total, producto) => total + producto.facturacion,
            0
        );

  if (datosGrafico.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-gray-500">
        No hay facturación para mostrar.
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center">
    <div className="h-90 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={datosGrafico}
            dataKey="facturacion"
            nameKey="nombre"
            cx="50%"
            cy="45%"
            innerRadius={65}
            outerRadius={115}
            paddingAngle={3}
            shape={SectorColoreado}
          >
          </Pie>

          <text 
            x="50%"
            y="40%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-500"
            fontSize={11}>
                Facturación total
            </text>

            <text
            x="50%"
            y="47%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-900"
            fontSize={13}
            fontWeight={700}
            >
            {new Intl.NumberFormat("es-AR", {
                style: "currency",
                currency: "ARS",
                maximumFractionDigits: 0,
                }).format(facturacionTotal)}
            </text>

          <Tooltip
            formatter={(valor) => formatoDinero(Number(valor))}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>

     <div className="flex w-full flex-wrap justify-center gap-x-4 gap-y-2 px-2">
      {datosGrafico.map((producto, indice) => (
        <div
          key={`${producto.nombre}-${indice}`}
          className="flex items-center gap-1.5 text-xs text-gray-600"
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{
              backgroundColor: COLORES[indice % COLORES.length],
            }}
          />
          <span>{producto.nombre}</span>
        </div>
      ))}
    </div>

    <div className="mt-5 border-t border-gray-100 pt-3 text-center">
      <p className="text-xs font-medium text-gray-500">
        Facturación total de los productos mostrados
      </p>
      <p className="mt-1 text-xl font-bold text-gray-900">
        {formatoDinero(facturacionTotal)}
      </p>
    </div>
  </div>
  );
}
