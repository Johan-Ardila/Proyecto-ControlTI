const express = require('express');
const router = express.Router();
const incidenciaController = require('../controllers/incidencia.controller');

// Consulta pública
router.get('/', incidenciaController.getIncidencias);

// Operaciones protegidas
router.post('/', incidenciaController.createIncidencia);
router.put('/:id/estado', incidenciaController.updateEstadoIncidencia);

module.exports = router;