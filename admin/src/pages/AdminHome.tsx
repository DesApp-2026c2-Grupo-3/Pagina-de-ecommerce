import UltimosMovimientos from "../components/UltimosMovimientos"

export default function AdminHome() {
  return (
    <main className="min-h-screen p-8">
      <div className="flex flex-col gap-4 m-2">
        <h1 className="text-3xl font-bold">
          Panel de administración
        </h1>

        <p className="mt-2 text-gray-600">
          Bienvenido al panel administrativo.
        </p>
      </div>
      <UltimosMovimientos />
    </main>
  )
}