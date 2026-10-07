// Qué hace: Importa la conexión a la base de datos MariaDB y el esquema de MongoDB para las especificaciones de los equipos[cite: 4].
const dbMariaDB = require('../config/db/db');
const EspecificacionMongo = require('./especificacion.schema');

// Auxiliar para parsear especificaciones si llegan como string desde el cliente[cite: 4]
const parseSpecs = (specs) => {
  if (!specs) return {};
  if (typeof specs === 'string') {
    try {
      return JSON.parse(specs);
    } catch (e) {
      return {};
    }
  }
  return specs;
};

// Estructura Principal del Modelo de Equipos[cite: 4]
const EquipoModel = {
  // Método getAll (Obtener todos los equipos combinando MariaDB y MongoDB)[cite: 4]
  getAll: async () => {
    const query = `
      SELECT e.*, i.stock_comprado, i.costo_unitario, i.ubicacion AS inventario_ubicacion, i.observaciones 
      FROM equipos e 
      LEFT JOIN inventario i ON e.id_equipo = i.id_equipo
    `;
    const [rows] = await dbMariaDB.query(query);
    
    const equiposConSpecs = await Promise.all(
      rows.map(async (equipo) => {
        const specs = await EspecificacionMongo.findOne({ id_equipo: equipo.id_equipo });
        const specsObj = specs ? specs.toObject() : {};
        
        const finalImg = equipo.imagen_url || specsObj.imagen_url || '';

        return {
          ...equipo,
          stock_comprado: equipo.stock_comprado || 0,
          costo_unitario: equipo.costo_unitario || 0,
          imagen_url: finalImg,
          especificaciones: {
            ...specsObj,
            grafica: specsObj.grafica || 'Integrada',
            imagen_url: finalImg
          }
        };
      })
    );

    return equiposConSpecs;
  },

  // Método create (Soporta creación por lotes con códigos incrementales y tarjeta gráfica)[cite: 4]
  create: async (data) => {
    const { codigo_inventario, tipo_equipo, marca, modelo, ubicacion, estado, costo_unitario } = data;
    const cantidadLote = parseInt(data.cantidad_lote) || 1;
    const especificaciones = parseSpecs(data.especificaciones);
    const imgUrl = data.imagen_url || especificaciones.imagen_url || null;

    const equiposCreados = [];

    for (let i = 1; i <= cantidadLote; i++) {
      const codigoFinal = cantidadLote > 1 ? `${codigo_inventario}-${i}` : codigo_inventario;

      // 1. Insertar en la tabla equipos
      const queryEquipo = `
        INSERT INTO equipos (codigo_inventario, tipo_equipo, marca, modelo, ubicacion, estado, imagen_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await dbMariaDB.query(queryEquipo, [
        codigoFinal,
        tipo_equipo,
        marca,
        modelo,
        ubicacion || 'Sin asignar',
        estado || 'disponible',
        imgUrl
      ]);

      const newId = result.insertId;

      // 2. Insertar en la tabla inventario
      const queryInventario = `
        INSERT INTO inventario (id_equipo, stock_comprado, costo_unitario, ubicacion)
        VALUES (?, ?, ?, ?)
      `;
      await dbMariaDB.query(queryInventario, [
        newId,
        1,
        Number(costo_unitario) || 0.00,
        ubicacion || 'Sin asignar'
      ]);

      // 3. Insertar especificaciones (incluyendo gráfica) en MongoDB
      if (Object.keys(especificaciones).length > 0 || imgUrl) {
        await EspecificacionMongo.create({
          id_equipo: newId,
          procesador: especificaciones.procesador || 'N/A',
          ram: especificaciones.ram || 'N/A',
          almacenamiento: especificaciones.almacenamiento || 'N/A',
          sistema_operativo: especificaciones.sistema_operativo || 'N/A',
          grafica: especificaciones.grafica || 'Integrada',
          imagen_url: imgUrl || ''
        });
      }

      equiposCreados.push({
        id_equipo: newId,
        codigo_inventario: codigoFinal,
        tipo_equipo,
        marca,
        modelo,
        ubicacion: ubicacion || 'Sin asignar',
        estado: estado || 'disponible',
        imagen_url: imgUrl,
        especificaciones: { ...especificaciones, grafica: especificaciones.grafica || 'Integrada', imagen_url: imgUrl || '' }
      });
    }

    return cantidadLote > 1 ? equiposCreados : equiposCreados[0];
  },

  // Método update (Actualizar equipo, inventario y especificaciones con gráfica)[cite: 4]
  update: async (id, data) => {
    const { codigo_inventario, tipo_equipo, marca, modelo, numero_serie, ubicacion, estado, stock_comprado, costo_unitario } = data;
    const especificaciones = parseSpecs(data.especificaciones);
    const imgUrl = data.imagen_url || especificaciones.imagen_url || '';

    const queryEquipo = `
      UPDATE equipos 
      SET codigo_inventario = ?, tipo_equipo = ?, marca = ?, modelo = ?, numero_serie = ?, ubicacion = ?, estado = ?, imagen_url = ?
      WHERE id_equipo = ?
    `;
    await dbMariaDB.query(queryEquipo, [
      codigo_inventario,
      tipo_equipo,
      marca,
      modelo,
      numero_serie || null,
      ubicacion || 'Sin asignar',
      estado || 'disponible',
      imgUrl,
      id
    ]);

    const queryInventario = `
      INSERT INTO inventario (id_equipo, stock_comprado, costo_unitario, ubicacion)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        stock_comprado = VALUES(stock_comprado),
        costo_unitario = VALUES(costo_unitario),
        ubicacion = VALUES(ubicacion)
    `;
    await dbMariaDB.query(queryInventario, [
      Number(id),
      Number(stock_comprado) || 0,
      Number(costo_unitario) || 0.00,
      ubicacion || 'Sin asignar'
    ]);

    await EspecificacionMongo.findOneAndUpdate(
      { id_equipo: Number(id) },
      { 
        $set: {
          procesador: especificaciones.procesador || 'N/A',
          ram: especificaciones.ram || 'N/A',
          almacenamiento: especificaciones.almacenamiento || 'N/A',
          sistema_operativo: especificaciones.sistema_operativo || 'N/A',
          grafica: especificaciones.grafica || 'Integrada',
          imagen_url: imgUrl
        }
      },
      { upsert: true, new: true }
    );

    return { 
      id_equipo: id, 
      ...data, 
      stock_comprado: Number(stock_comprado) || 0,
      imagen_url: imgUrl,
      especificaciones: { ...especificaciones, grafica: especificaciones.grafica || 'Integrada', imagen_url: imgUrl }
    };
  },

  // Método delete (Eliminar equipo)[cite: 4]
  delete: async (id) => {
    await dbMariaDB.query('DELETE FROM inventario WHERE id_equipo = ?', [id]);
    const [result] = await dbMariaDB.query('DELETE FROM equipos WHERE id_equipo = ?', [id]);
    await EspecificacionMongo.deleteOne({ id_equipo: Number(id) });

    return result.affectedRows > 0;
  }
};

module.exports = EquipoModel;