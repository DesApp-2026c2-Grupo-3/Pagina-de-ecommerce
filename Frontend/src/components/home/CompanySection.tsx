function CompanySection() {
  return (
    <section id="sobre-nosotros" className="mx-auto  scroll-mt-24 px-4 py-16 
    bg-gradient-to-tl from-stone-900 via-stone-700 to-stone-900 ">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-1 p-2 ">

        <div className="relative overflow-hidden flex flex-col gap-4 p-2 bg-red-950
        rounded-2xl border-2 border-stone-700 min-h-[50vh]">

          <img src="/homeImg/coso2.jpg" alt="imagen de repartidor" 
          className="absolute right-0 top-0 h-full sm:w-1/2 object-cover" />

          
            <div className="flex flex-col sm:h-full gap-4 justify-center my-auto 
            relative z-10 p-8 text-white sm:w-1/2 rounded-xl sm:rounded-l-xl sm:rounded-r-none
             bg-white/10 backdrop-blur-md text-center sm:text-left
             sm:bg-gradient-to-r sm:from-red-900 sm:to-red-700">
              <h2 className="text-[2rem] font-extrabold text-white">Nuestra misión</h2>
              <p className=" text-gray-100">
                Acercarte la mejor hamburguesa de la ciudad, hecha con ingredientes frescos y
                entregada rápido, sin resignar calidad ni sabor.
              </p>
            
          </div>
          </div>
        

        <div className="relative overflow-hidden flex flex-col gap-4 p-2  bg-red-950
        rounded-2xl border-2 border-stone-600 min-h-[50vh]">

          <img src="/homeImg/coso1.jpg" alt="imagen de sustentabilidad" 
          className="absolute left-0 top-0 h-full sm:w-1/2 object-cover" />

            <div className="flex flex-col  sm:h-full gap-4 relative rounded-xl sm:rounded-r-xl sm:rounded-l-none  my-auto
            z-10 p-8 sm:w-1/2 ml-auto text-white bg-white/10 backdrop-blur-md justify-center text-center sm:text-right
             sm:bg-gradient-to-r sm:from-red-700 sm:to-red-900">
              <h2 className="text-[2rem] font-extrabold text-white">
                Compromiso sustentable
              </h2>
              <p className="text-gray-100">
                Trabajamos con packaging reciclable, reducimos el desperdicio de alimentos y
                elegimos proveedores locales siempre que podemos.
              </p>
            
          </div>
        </div>

          <div className="relative overflow-hidden flex flex-col gap-4 p-2 bg-red-950
          rounded-2xl border-2 border-stone-600 min-h-[50vh]">

            <img src="/homeImg/coso3.jpg" alt="imagen de hamburguesa" 
            className="absolute right-0 top-0 h-full sm:w-1/2 w-full object-cover" />
            
            <div className="flex flex-col gap-4 relative z-10 sm:w-1/2 p-8  sm:h-full justify-center text-center sm:text-left
             bg-white/10 backdrop-blur-md rounded-xl sm:rounded-l-xl sm:rounded-r-none my-auto
              sm:bg-gradient-to-r sm:from-red-900 sm:to-red-700">

              <h2 className="text-[2rem] font-extrabold text-white">Por qué elegirnos</h2>
              <p className="text-gray-100">
                Ingredientes frescos, entrega rápida, seguimiento de tu pedido en tiempo real y
                múltiples medios de pago para que pedir sea siempre fácil.
              </p>
            </div>
          </div>

      </div>
    </section>
  )
}

export default CompanySection
