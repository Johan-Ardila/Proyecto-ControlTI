let listaSolicitudes = [];
let solicitudSeleccionadaActual = null;

document.addEventListener('DOMContentLoaded', () => {
  cargarSolicitudes();
  configurarEventosModal();
});

//Función robusta para obtener los datos de la sesión actual
function obtenerDatosSesion() {
  let esTipoUno = true; // Por defecto asumimos usuario normal
  let currentUserId = Number(localStorage.getItem('id_usuario') || 0);
  let currentUserEmail = '';

  //Revisar localStorage de forma prioritaria (id_rol o tipo)
  const idRolLocal = localStorage.getItem('id_rol');
  if (idRolLocal) {
    const rolNum = Number(idRolLocal);
    esTipoUno = (rolNum === 1);
  }

  //Revisar si hay un objeto de sesión guardado
  const sesionRaw = localStorage.getItem('usuario_session');
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

  //Respaldo por el DOM (ignorando explícitamente "Cargando...")
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

  return { esTipoUno, currentUserId, currentUserEmail };
}

//Obtener todas las solicitudes del backend y filtrar si es usuario normal
async function cargarSolicitudes() {
  const tbody = document.getElementById('tabla-solicitudes-body');
  try {
    const response = await fetch('/api/solicitudes');
    const result = await response.json();

    if (result.status === 'success') {
      const { esTipoUno, currentUserId, currentUserEmail } = obtenerDatosSesion();
      let todasLasSolicitudes = result.data;

      if (esTipoUno) {
        //Usuario normal: solo ve sus propias solicitudes
        listaSolicitudes = todasLasSolicitudes.filter(sol => {
          const matchId = currentUserId && Number(sol.id_usuario) === currentUserId;
          const matchEmail = currentUserEmail && sol.correo && sol.correo.toLowerCase().trim() === currentUserEmail;
          return matchId || matchEmail;
        });
      } else {
        //Admin o Técnico: ve TODAS las solicitudes
        listaSolicitudes = todasLasSolicitudes;
      }

      renderizarTablaSolicitudes(listaSolicitudes);
      actualizarKPIs(listaSolicitudes);
    } else {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center">No se encontraron solicitudes.</td></tr>`;
    }
  } catch (error) {
    console.error('Error al cargar solicitudes:', error);
    tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="color: red;">Error al conectar con el servidor.</td></tr>`;
  }
}

//Renderizar la tabla aplicando restricciones de estado y botón de ticket oculto para admins/técnicos
function renderizarTablaSolicitudes(solicitudes) {
  const tbody = document.getElementById('tabla-solicitudes-body');
  tbody.innerHTML = '';

  if (solicitudes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center">No hay registros de solicitudes.</td></tr>`;
    return;
  }

  const { esTipoUno, currentUserId, currentUserEmail } = obtenerDatosSesion();

  solicitudes.forEach(sol => {
    const fechaFormateada = new Date(sol.fecha_solicitud).toLocaleDateString();
    
    let estadoLower = (sol.estado || 'pendiente').toLowerCase();
    let badgeClaseEstado = 'badge--disponible'; 
    if (estadoLower === 'en_proceso') badgeClaseEstado = 'badge--asignado';
    if (estadoLower === 'resuelto') badgeClaseEstado = 'badge--disponible';
    if (estadoLower === 'rechazado' || estadoLower === 'mantenimiento') badgeClaseEstado = 'badge--mantenimiento';

    //Comprobar si esta solicitud pertenece al usuario actual en sesión
    const esMiSolicitud = (currentUserId && Number(sol.id_usuario) === currentUserId) || 
                          (currentUserEmail && sol.correo && sol.correo.toLowerCase().trim() === currentUserEmail);

    let columnaEstadoHtml = '';
    
    if (esTipoUno || esMiSolicitud) {
      //Si es usuario normal O es una solicitud propia (aunque seas admin), el estado es fijo
      columnaEstadoHtml = `<td><span class="badge ${badgeClaseEstado}">${sol.estado}</span></td>`;
    } else {
      //Si eres admin/técnico y la solicitud es de OTRO usuario, puedes cambiar el estado
      columnaEstadoHtml = `
        <td>
          <select class="form-select-estado" onchange="cambiarEstado(${sol.id_solicitud}, this.value)">
            <option value="pendiente" ${sol.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="en_proceso" ${sol.estado === 'en_proceso' ? 'selected' : ''}>En Proceso</option>
            <option value="resuelto" ${sol.estado === 'resuelto' ? 'selected' : ''}>Resuelto</option>
            <option value="rechazado" ${sol.estado === 'rechazado' ? 'selected' : ''}>Rechazado</option>
          </select>
        </td>
      `;
    }

    //Botón de Ticket: Oculto para administradores y técnicos, visible solo para usuarios normales
    let botonTicketHtml = '';
    if (esTipoUno) {
      botonTicketHtml = `
        <button class="btn btn--sm btn--primary btn-abrir-ticket" data-id="${sol.id_solicitud}" title="Ver detalles y crear Ticket">
          <i class="ri-ticket-line"></i> Ticket
        </button>
      `;
    }

    const nombreFila = sol.usuario_nombre || 'Usuario';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${sol.id_solicitud}</td>
      <td><span class="badge badge--${sol.tipo_solicitud}">${sol.tipo_solicitud}</span></td>
      <td>${sol.marca ? `${sol.marca} ${sol.modelo} (${sol.codigo_inventario})` : '<em>Ninguno / General</em>'}</td>
      <td>${sol.descripcion}</td>
      <td><span class="badge badge--prioridad-${sol.prioridad}">${sol.prioridad}</span></td>
      <td>${fechaFormateada}</td>
      ${columnaEstadoHtml}
      <td class="text-center" style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
        <small>Por: ${nombreFila} ${esMiSolicitud ? '<span class="badge badge--primary" style="font-size: 9px;">Tú</span>' : ''}</small>
        ${botonTicketHtml}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

//Función lógica para abrir el modal buscando por ID
function abrirModalTicket(idSolicitud) {
  const sol = listaSolicitudes.find(s => s.id_solicitud === Number(idSolicitud));
  
  if (!sol) {
    alert('No se encontraron los datos de esta solicitud.');
    return;
  }

  solicitudSeleccionadaActual = sol;

  document.getElementById('ticket-id-equipo').value = sol.id_equipo || 'Ninguno / General';
  document.getElementById('ticket-nombre').value = sol.usuario_nombre || 'Usuario';
  document.getElementById('ticket-nombre-usuario').value = sol.usuario_nombre || 'Usuario';
  document.getElementById('ticket-correo').value = sol.correo || sol.email || 'No registrado';
  document.getElementById('ticket-mensaje').value = '';

  const modal = document.getElementById('modal-ticket');
  if (modal) modal.style.display = 'flex';
}

//Actualizar estado de la solicitud vía PUT
async function cambiarEstado(idSolicitud, nuevoEstado) {
  try {
    const response = await fetch(`/api/solicitudes/${idSolicitud}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    const data = await response.json();
    if (response.ok && data.status === 'success') {
      cargarSolicitudes(); 
    } else {
      alert('No se pudo actualizar el estado: ' + (data.message || 'Error'));
    }
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    alert('Error de conexión con el servidor.');
  }
}

//Configuración global de eventos
function configurarEventosModal() {
  const btnAbrir = document.getElementById('btn-nueva-solicitud');
  if (btnAbrir) {
    btnAbrir.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/pages/Index.html#equipos';
    });
  }

  const inputBuscar = document.getElementById('inputBuscar');
  if (inputBuscar) {
    inputBuscar.addEventListener('input', (e) => {
      const texto = e.target.value.toLowerCase();
      const filtradas = listaSolicitudes.filter(sol => 
        sol.tipo_solicitud.toLowerCase().includes(texto) ||
        sol.descripcion.toLowerCase().includes(texto) ||
        (sol.marca && sol.marca.toLowerCase().includes(texto)) ||
        (sol.usuario_nombre && sol.usuario_nombre.toLowerCase().includes(texto))
      );
      renderizarTablaSolicitudes(filtradas);
    });
  }

  const tbodyTabla = document.getElementById('tabla-solicitudes-body');
  if (tbodyTabla) {
    tbodyTabla.addEventListener('click', (e) => {
      const btnTicket = e.target.closest('.btn-abrir-ticket');
      if (btnTicket) {
        const idSolicitud = btnTicket.getAttribute('data-id');
        abrirModalTicket(idSolicitud);
      }
    });
  }

  const modalTicket = document.getElementById('modal-ticket');
  const btnCerrar = document.getElementById('btn-close-modal-ticket');
  const btnCancelar = document.getElementById('btn-cancelar-ticket');

  const cerrarModal = () => {
    if (modalTicket) modalTicket.style.display = 'none';
  };

  if (btnCerrar) btnCerrar.addEventListener('click', cerrarModal);
  if (btnCancelar) btnCancelar.addEventListener('click', cerrarModal);

  const formTicket = document.getElementById('form-ticket');
  if (formTicket) {
    formTicket.addEventListener('submit', async (e) => {
      e.preventDefault();

      const id_equipo = document.getElementById('ticket-id-equipo').value;
      const nombre_usuario = document.getElementById('ticket-nombre-usuario').value;
      const correo_usuario = document.getElementById('ticket-correo').value;
      const mensaje_usuario = document.getElementById('ticket-mensaje').value;

      let nombre_equipo = 'General';
      if (solicitudSeleccionadaActual && solicitudSeleccionadaActual.marca) {
        nombre_equipo = `${solicitudSeleccionadaActual.marca} ${solicitudSeleccionadaActual.modelo || ''}`.trim();
      }

      const payload = {
        id_equipo: id_equipo || 'N/A',
        nombre_equipo: nombre_equipo,
        nombre_usuario: nombre_usuario || 'Usuario',
        correo_usuario: correo_usuario || 'No registrado',
        mensaje_usuario: mensaje_usuario
      };

      try {
        const response = await fetch('/api/incidencias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
          alert('¡Incidencia registrada correctamente!');
          formTicket.reset();
          cerrarModal();
        } else {
          alert('No se pudo registrar la incidencia: ' + (result.message || 'Error desconocido'));
        }
      } catch (error) {
        console.error('Error al enviar la incidencia:', error);
        alert('Error de conexión con el servidor.');
      }
    });
  }
}

//Actualizar tarjeta KPI total
function actualizarKPIs(solicitudes) {
  const kpiTotal = document.getElementById('kpi-total-solicitudes');
  if (kpiTotal) kpiTotal.textContent = solicitudes.length;
}