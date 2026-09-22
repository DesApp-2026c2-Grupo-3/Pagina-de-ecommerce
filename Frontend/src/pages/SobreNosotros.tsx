import CompanySection from '../components/home/CompanySection'

function SobreNosotros() {
  return (
    <div>
      <div className="bg-brand-red px-4 py-12 text-center text-white">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Sobre nosotros</h1>
        <p className="mx-auto mt-2 max-w-2xl text-white/90">
          Somos una marca de comida rápida que crece barrio a barrio, siempre cerca tuyo.
        </p>
      </div>
      <CompanySection />
    </div>
  )
}

export default SobreNosotros
