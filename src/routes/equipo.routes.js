const express = require('express');
const router = express.Router();
const equipoController = require('../controllers/equipo.controller');
const { esAdmin, tecnicoOAdmin } = require('../middlewares/authMiddleware');

// Consulta pública (Cualquiera puede listar los equipos sin bloqueo)
router.get('/', equipoController.getAll);

// Operaciones protegidas
router.post('/', tecnicoOAdmin, equipoController.create);
router.put('/:id', tecnicoOAdmin, equipoController.update);
router.delete('/:id', tecnicoOAdmin, equipoController.delete);

module.exports = router;