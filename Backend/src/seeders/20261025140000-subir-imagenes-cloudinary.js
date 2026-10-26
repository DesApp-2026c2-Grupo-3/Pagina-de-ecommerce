'use strict';

// Pasa a Cloudinary las imágenes de los productos que todavía tienen una ruta local (/imagenes/...).
// Se corre DESPUÉS de las semillas del catálogo (20261020000000 y 20261021120000).
//
// - Lee cada archivo de Frontend/public/imagenes, lo comprime (WebP, máx. 1200 px) y lo sube
//   con un nombre fijo (ej: productos/hamburguesas-fast-classic), así no se duplica si se corre de nuevo.
// - Si dos productos usan la misma foto, se sube una sola vez y los dos apuntan a ella.
// - Solo toca productos sin imagenPublicId: los que ya están en Cloudinary no se procesan otra vez.
// - Si falta un archivo, ese producto queda con su ruta local y se avisa al final.
// - Necesita las credenciales de Cloudinary en Backend/.env.

const fs = require('fs');
const path = require('path');
const { cloudinaryConfigurado } = require('../config/cloudinary');
const { CARPETA_PRODUCTOS, subirImagenProducto } = require('../utils/imagenesCloudinary');

const CARPETA_PUBLICA = path.join(__dirname, '../../../Frontend/public');

// "Hamburguesas/Fast & Onion.png" → "hamburguesas-fast-onion"
const aNombreCloudinary = (ruta) =>
  ruta
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

module.exports = {
  async up(queryInterface) {
    if (!cloudinaryConfigurado()) {
      throw new Error(
        'Faltan las credenciales de Cloudinary en Backend/.env (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)'
      );
    }

    const { sequelize } = queryInterface;
    // Incluye los productos eliminados: los pedidos viejos los siguen mostrando
    const [productos] = await sequelize.query(`
      SELECT id, nombre, imagen FROM "Productos"
      WHERE imagen LIKE '/imagenes/%' AND "imagenPublicId" IS NULL
      ORDER BY id`);

    const subidas = new Map(); // ruta local → { url, publicId }
    const faltantes = [];
    let actualizados = 0;

    for (const producto of productos) {
      let subida = subidas.get(producto.imagen);

      if (!subida) {
        const archivo = path.join(CARPETA_PUBLICA, producto.imagen);
        if (!fs.existsSync(archivo)) {
          faltantes.push(`${producto.nombre} (${producto.imagen})`);
          continue;
        }
        const nombre = aNombreCloudinary(producto.imagen.replace(/^\/imagenes\//, ''));
        subida = await subirImagenProducto(fs.readFileSync(archivo), { publicId: `${CARPETA_PRODUCTOS}/${nombre}` });
        subidas.set(producto.imagen, subida);
        console.log(`  ↑ ${producto.imagen}`);
      }

      await sequelize.query(
        `UPDATE "Productos" SET imagen = :url, "imagenPublicId" = :publicId, "updatedAt" = NOW() WHERE id = :id`,
        { replacements: { url: subida.url, publicId: subida.publicId, id: producto.id } }
      );
      actualizados++;
    }

    console.log(`✅ ${actualizados} productos con imagen en Cloudinary (${subidas.size} archivos subidos).`);
    if (faltantes.length > 0) {
      console.warn(`⚠️  Sin archivo, quedan con la ruta local: ${faltantes.join(', ')}`);
    }
  },

  // No se vuelve atrás: las rutas locales viejas no se guardan. Para empezar de cero,
  // recrear la base (db:drop + db:create + db:migrate + db:seed:all).
  async down() {
    console.log('ℹ️  Esta semilla no se deshace: las imágenes quedan en Cloudinary.');
  },
};