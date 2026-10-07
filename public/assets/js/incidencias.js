let listaIncidencias = [];

document.addEventListener('DOMContentLoaded', () => {
  cargarIncidencias();
  configurarEventosIncidencias();
});

//Obtener todas las incidencias del backend
async function cargarIncidencias() {
  const tbody = document.getElementById('tabla-incidencias-body');
  try {
    const response = await fetch('/api/incidencias');
    const result = await response.json();

    if (result.status === 'success') {
      let todasLasIncidencias = result.data;

      //Mira si es administrador (Tipo 1)
      const idRolLocal = localStorage.getItem('id_rol');
      let esTipoUno = (idRolLocal && Number(idRolLocal) === 1);
      const sesionRaw = localStorage.getItem('usuario_session');
      let currentUserEmail = '';
      let currentUserId = Number(localStorage.getItem('id_usuario') || 0);

      if (sesionRaw) {
        try {
          const usuario = JSON.parse(sesionRaw);
          const tipoUsuario = Number(usuario.tipo || usuario.id_rol || usuario.rol || 1);
          esTipoUno = (tipoUsuario === 1);
          if (usuario.id_usuario || usuario.id) currentUserId = Number(usuario.id_usuario || usuario.id);
          if (usuario.email) currentUserEmail = usuario.email.toLowerCase().trim();
        } catch (e) {
          console.error('Error al leer sesión:', e);
        }
      }

      const spanRol = document.getElementById('rol-usuario');
      if (spanRol) {
        const textoRol = spanRol.textContent.toLowerCase().trim();
        if (textoRol && textoRol !== 'cargando...' && textoRol !== '') {
          if (textoRol.includes('admin') || textoRol.includes('técnico') || textoRol.includes('tipo 2') || textoRol.includes('tipo 3')) {
            esTipoUno = false;
          } else if (textoRol.includes('usuario') || textoRol.includes('tipo 1')) {
            esTipoUno = true;
          }
        }
      }

      // Si es empleado (tipo 3), filtramos solo sus incidencias. 
      // Si es Admin o Técnico (usuario tipo 1 y 2), se muestran TODAS las incidencias sin filtrar.
      if (esTipoUno) {
        const spanNombre = document.getElementById('nombre-usuario');
        const currentUserName = spanNombre ? spanNombre.textContent.toLowerCase().trim() : '';

        listaIncidencias = todasLasIncidencias.filter(inc => {
          const matchId = currentUserId && Number(inc.id_usuario) === currentUserId;
          const matchEmail = currentUserEmail && (inc.correo_usuario || inc.correo || inc.email) && 
            (inc.correo_usuario || inc.correo || inc.email).toLowerCase().trim() === currentUserEmail;
          const matchName = currentUserName && currentUserName !== 'cargando...' && inc.nombre_usuario && 
            inc.nombre_usuario.toLowerCase().trim() === currentUserName;
          return matchId || matchEmail || matchName;
        });
      } else {
        listaIncidencias = todasLasIncidencias;
      }

      renderizarTablaIncidencias(listaIncidencias);
      actualizarKPIsIncidencias(listaIncidencias);
    } else {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center">No se encontraron incidencias.</td></tr>`;
    }
  } catch (error) {
    console.error('Error al cargar incidencias:', error);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="color: red;">Error al conectar con el servidor.</td></tr>`;
  }
}

//Renderizar la tabla y bloquear modificación de estado en incidencias propias usando #nombre-usuario
function renderizarTablaIncidencias(incidencias) {
  const tbody = document.getElementById('tabla-incidencias-body');
  tbody.innerHTML = '';

  if (incidencias.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center">No hay registros de incidencias.</td></tr>`;
    return;
  }

  // Obtener estrictamente el nombre del usuario logueado desde el DOM (#nombre-usuario)
  const spanNombreUsuario = document.getElementById('nombre-usuario');
  const currentUserName = spanNombreUsuario ? spanNombreUsuario.textContent.toLowerCase().trim() : '';

  // Determinar si es usuario tipo 1 para bloqueo general si aplica
  const idRolLocal = localStorage.getItem('id_rol');
  let esTipoUno = (idRolLocal && Number(idRolLocal) === 1);
  const spanRol = document.getElementById('rol-usuario');
  if (spanRol) {
    const textoRol = spanRol.textContent.toLowerCase().trim();
    if (textoRol.includes('usuario') || textoRol.includes('tipo 1')) esTipoUno = true;
    if (textoRol.includes('admin') || textoRol.includes('técnico') || textoRol.includes('tipo 2') || textoRol.includes('tipo 3')) esTipoUno = false;
  }

  incidencias.forEach(inc => {
    const fechaFormateada = new Date(inc.fecha_creacion).toLocaleDateString();
    let estadoLower = (inc.estado || 'pendiente').toLowerCase();

    let badgeClaseEstado = 'badge--disponible';
    if (estadoLower === 'en_proceso' || estadoLower === 'en proceso') badgeClaseEstado = 'badge--asignado';
    if (estadoLower === 'resuelto') badgeClaseEstado = 'badge--disponible';
    if (estadoLower === 'rechazado' || estadoLower === 'mantenimiento') badgeClaseEstado = 'badge--mantenimiento';

    //Comprobación exacta basada en el texto de #nombre-usuario para bloquear el menú desplegable en la incidencia propia
    const incNombre = (inc.nombre_usuario || '').toLowerCase().trim();
    const esMiIncidencia = currentUserName && currentUserName !== 'cargando...' && incNombre === currentUserName;

    let columnaEstadoHtml = '';

    if (esTipoUno || esMiIncidencia) {
      //Si empleado O es su propia incidencia (aunque sea admin), se muestra en texto plano (badge fijo)
      columnaEstadoHtml = `<td><span class="badge ${badgeClaseEstado}">${inc.estado || 'pendiente'}</span></td>`;
    } else {
      //Si es admin/técnico y la incidencia es de OTRO usuario, se permite cambiar el estado con el <select>
      columnaEstadoHtml = `
        <td>
          <select class="form-select-estado" onchange="cambiarEstadoIncidencia(${inc.id_incidencia}, this.value)">
            <option value="pendiente" ${estadoLower === 'pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="en_proceso" ${estadoLower === 'en_proceso' || estadoLower === 'en proceso' ? 'selected' : ''}>En Proceso</option>
            <option value="resuelto" ${estadoLower === 'resuelto' ? 'selected' : ''}>Resuelto</option>
            <option value="rechazado" ${estadoLower === 'rechazado' ? 'selected' : ''}>Rechazado</option>
          </select>
        </td>
      `;
    }

    const nombreUsuario = inc.nombre_usuario || 'Usuario';
    const correoUsuario = inc.correo_usuario || inc.correo || inc.email || 'No registrado';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${inc.id_incidencia}</td>
      <td><span class="badge badge--primary">${inc.nombre_equipo || 'General'}</span></td>
      <td>${nombreUsuario} ${esMiIncidencia ? '<span class="badge badge--primary" style="font-size: 9px;">Tú</span>' : ''}</td>
      <td>${inc.mensaje_usuario}</td>
      <td>${fechaFormateada}</td>
      ${columnaEstadoHtml}
      <td class="text-center">
        <small class="text-muted">${correoUsuario}</small>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

//Actualizar estado de la incidencia vía PUT
async function cambiarEstadoIncidencia(idIncidencia, nuevoEstado) {
  try {
    const response = await fetch(`/api/incidencias/${idIncidencia}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    const data = await response.json();
    if (response.ok && data.status === 'success') {
      cargarIncidencias(); 
    } else {
      alert('No se pudo actualizar el estado de la incidencia: ' + (data.message || 'Error'));
    }
  } catch (error) {
    console.error('Error al cambiar estado de la incidencia:', error);
    alert('Error de conexión con el servidor.');
  }
}

//Configuración global de eventos (Buscador en tiempo real)
function configurarEventosIncidencias() {
  const inputBuscar = document.getElementById('inputBuscar');
  if (inputBuscar) {
    inputBuscar.addEventListener('input', (e) => {
      const texto = e.target.value.toLowerCase();
      const filtradas = listaIncidencias.filter(inc => 
        inc.mensaje_usuario.toLowerCase().includes(texto) ||
        (inc.nombre_usuario && inc.nombre_usuario.toLowerCase().includes(texto)) ||
        (inc.nombre_equipo && inc.nombre_equipo.toLowerCase().includes(texto)) ||
        (inc.correo_usuario && inc.correo_usuario.toLowerCase().includes(texto))
      );
      renderizarTablaIncidencias(filtradas);
    });
  }
}

//Actualizar tarjetas KPI de totales, en proceso y pendientes
function actualizarKPIsIncidencias(incidencias) {
  const kpiTotal = document.getElementById('kpi-total-incidencias');
  if (kpiTotal) kpiTotal.textContent = incidencias.length;

  const totalEnProceso = incidencias.filter(inc => {
    const est = (inc.estado || '').toLowerCase();
    return est === 'en_proceso' || est === 'en proceso';
  }).length;

  const totalPendientes = incidencias.filter(inc => {
    const est = (inc.estado || '').toLowerCase();
    return est === 'pendiente';
  }).length;

  const kpiEnProceso = document.getElementById('kpi-en-proceso');
  if (kpiEnProceso) kpiEnProceso.textContent = totalEnProceso;

  const kpiPendientes = document.getElementById('kpi-pendientes');
  if (kpiPendientes) kpiPendientes.textContent = totalPendientes;
}