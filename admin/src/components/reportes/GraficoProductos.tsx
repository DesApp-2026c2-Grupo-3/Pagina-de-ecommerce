import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DatoGrafico {
  nombre: string;
  cantidad: number;
}

interface GraficoProductosProps {
  datos: DatoGrafico[];
  color: string;
  etiqueta: string;
}

export default function GraficoProductos({
  datos,
  color,
  etiqueta,
}: GraficoProductosProps) {
  const datosGrafico = datos.map((producto) => ({
    ...producto,
    nombre:
      producto.nombre.length > 20
        ? `${producto.nombre.slice(0, 20)}…`
        : producto.nombre,
  }));

  return (
    <div className="h-72 w-full">
      {datosGrafico.length === 0 ? (
        <p className="flex h-full items-center justify-center text-sm text-gray-500">
          No hay datos para mostrar.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={datosGrafico}
            layout="vertical"
            margin={{ top: 8, right: 20, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="nombre"
              width={125}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(valor) => [valor, etiqueta]}
              cursor={{ fill: "#f3f4f6" }}
            />
            <Bar
              dataKey="cantidad"
              name={etiqueta}
              fill={color}
              radius={[0, 6, 6, 0]}
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}