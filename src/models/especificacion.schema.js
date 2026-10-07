const mongoose = require('mongoose');

// Esquema de especificaciones técnicas
const especificacionSchema = new mongoose.Schema({
  id_equipo: {
    type: Number,
    required: true,
    unique: true
  },
  procesador: { type: String, default: 'N/A' },
  ram: { type: String, default: 'N/A' },
  almacenamiento: { type: String, default: 'N/A' },
  sistema_operativo: { type: String, default: 'N/A' },
  imagen_url: { type: String, default: '' } 
}, {
  timestamps: true,
  collection: 'especificaciones'
}); 

module.exports = mongoose.model('Especificacion', especificacionSchema);
