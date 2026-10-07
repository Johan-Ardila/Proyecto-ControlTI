// ==========================================
// 1. VALIDACIÓN STRICTA DE SESIÓN Y CONTROL "ATRÁS"
// ==========================================
function verificarSesionStrict() {
  const sesionRaw = localStorage.getItem('usuario_session');
  
  try {
    const usuario = sesionRaw ? JSON.parse(sesionRaw) : null;

    if (!usuario || !usuario.id_usuario) {
      localStorage.clear();
      window.location.replace('/');
      return false;
    }

    const esAdmin = usuario.id_rol === 1 || (usuario.rol && usuario.rol.toLowerCase() === 'administrador');
    if (window.location.pathname.includes('/usuarios') && !esAdmin) {
      window.location.replace('/mis-solicitudes');
      return false;
    }

    return true;
  } catch (error) {
    localStorage.clear();
    window.location.replace('/');
    return false;
  }
}

verificarSesionStrict();

window.addEventListener('pageshow', () => {
  verificarSesionStrict();
});

// =================================================================
// 2. LÓGICA DE LA INTERFAZ (DENTRO DE DOMCONTENTLOADED)
// =================================================================
document.addEventListener('DOMContentLoaded', () => {

  let idRolActual = 1;
  const sesionGuardada = localStorage.getItem('usuario_session');
  
  if (sesionGuardada) {
    const usuarioActual = JSON.parse(sesionGuardada);
    const elemNombre = document.getElementById('nombre-usuario');
    const elemRol = document.getElementById('rol-usuario');

    if (elemNombre) elemNombre.textContent = usuarioActual.nombre;
    if (elemRol) elemRol.textContent = usuarioActual.rol;

    idRolActual = usuarioActual.id_rol || (usuarioActual.rol && usuarioActual.rol.toLowerCase() === 'administrador' ? 1 : 2);

    const esAdmin = usuarioActual.id_rol === 1 || (usuarioActual.rol && usuarioActual.rol.toLowerCase() === 'administrador');
    const menuUsuarios = document.getElementById('menu-usuarios');
    if (menuUsuarios && !esAdmin) {
      menuUsuarios.style.display = 'none';
    }
  }

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.replace('/');
    });
  }

  // ==========================================
  // REFERENCIAS DOM
  // ==========================================
  const tablaBody = document.getElementById('tabla-equipos-body');
  const modal = document.getElementById('modal-equipo');
  const formEquipo = document.getElementById('form-equipo');
  const modalTitulo = document.getElementById('modalTitulo');
  const inputBuscar = document.getElementById('inputBuscar');

  const sidebar = document.getElementById('sidebar');
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  const btnNuevo = document.getElementById('btn-nuevo-equipo');
  const btnCerrar = document.getElementById('btn-close-modal');
  const btnCancelar = document.getElementById('btn-cancelar');

  const kpiTotal = document.getElementById('kpi-total');
  const kpiDisponibles = document.getElementById('kpi-disponibles');
  const kpiMantenimiento = document.getElementById('kpi-mantenimiento');

  let listaEquipos = [];

  // ==========================================
  // CONTROL DEL MENÚ RESPONSIVE
  // ==========================================
  if (btnToggleSidebar && sidebar) {
    btnToggleSidebar.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
    });
  }

  // ==========================================
  // OBTENER Y RENDERIZAR EQUIPOS
  // ==========================================
  async function cargarEquipos() {
    try {
      const res = await fetch('/api/equipos');
      const data = await res.json();

      listaEquipos = Array.isArray(data) ? data : (data.data || []);
      
      actualizarKPIs(listaEquipos);
      renderTabla(listaEquipos);
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      if (tablaBody) {
        tablaBody.innerHTML = `<tr><td colspan="8" class="text-center" style="color:red;">Error al conectar con el servidor</td></tr>`;
      }
    }
  }

  function renderTabla(equipos) {
    if (!tablaBody) return;
    if (equipos.length === 0) {
      tablaBody.innerHTML = `<tr><td colspan="8" class="text-center">No hay equipos registrados</td></tr>`;
      return;
    }

    tablaBody.innerHTML = equipos.map(eq => {
      const specs = eq.especificaciones || {};
      
      let imgPath = '/assets/img/default-pc.png';
      const imgNombre = eq.imagen_url || specs.imagen_url;

      if (imgNombre && imgNombre.trim() !== '') {
        imgPath = imgNombre.startsWith('DB/') 
          ? `/assets/img/${imgNombre}` 
          : `/assets/img/${imgNombre}`;
      }

      // Visualización clara incluyendo la Tarjeta Gráfica
      const specsTexto = `
        <strong>CPU:</strong> ${specs.procesador || 'N/A'} | 
        <strong>RAM:</strong> ${specs.ram || 'N/A'}<br>
        <strong>Disco:</strong> ${specs.almacenamiento || 'N/A'} <br>
        <strong>Gráfica:</strong> <span style="color: #2563eb;">${specs.grafica || 'Integrada'}</span>
      `;

      const estadoClass = eq.estado ? eq.estado.toLowerCase() : 'disponible';

      return `
        <tr>
          <td><strong>${eq.codigo_inventario}</strong></td>
          <td>${eq.marca} ${eq.modelo}</td>
          <td>
            <img src="${imgPath}" alt="${eq.marca}" style="width: 45px; height: 45px; object-fit: contain; border-radius: 4px; border: 1px solid #ddd; background: #fff;">
          </td>
          <td>${eq.tipo_equipo}</td>
          <td>${eq.ubicacion || 'Sin asignar'}</td>
          <td style="font-size: 0.85rem;">${specsTexto}</td>
          <td><span class="badge badge--${estadoClass}">${(eq.estado || 'disponible').toUpperCase()}</span></td>
          <td>
            <button class="btn-icon btn-edit" onclick="editarEquipo(${eq.id_equipo})" title="Editar">
              <i class="ri-edit-line"></i>
            </button>
            <button class="btn-icon btn-delete" onclick="eliminarEquipo(${eq.id_equipo})" title="Eliminar">
              <i class="ri-delete-bin-line"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function actualizarKPIs(equipos) {
    if (!kpiTotal) return;
    kpiTotal.textContent = equipos.length;
    kpiDisponibles.textContent = equipos.filter(e => (e.estado || '').toLowerCase() === 'disponible').length;
    kpiMantenimiento.textContent = equipos.filter(e => (e.estado || '').toLowerCase() === 'mantenimiento').length;
  }

  // ==========================================
  // SUBIDA DE IMAGEN Y GUARDADO DE EQUIPO
  // ==========================================
  if (formEquipo) {
    formEquipo.addEventListener('submit', async (e) => {
      e.preventDefault();

      const idEquipo = document.getElementById('equipo-id').value;
      const fileInput = document.getElementById('modal-imagen');
      let nombreImagen = document.getElementById('imagen-url-actual').value;

      if (fileInput && fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('imagen', fileInput.files[0]);

        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 
              'x-user-role': String(idRolActual) 
            },
            body: formData
          });
          const uploadData = await uploadRes.json();

          if (uploadData.status === 'success') {
            nombreImagen = uploadData.filename;
          } else {
            alert('Error al subir la imagen: ' + uploadData.message);
            return;
          }
        } catch (err) {
          console.error('Error en la petición de upload:', err);
          alert('No se pudo subir la imagen al servidor');
          return;
        }
      }

      const cantidadLoteInput = document.getElementById('cantidad_lote');

      // Payload estructurado con lote y especificaciones técnicas (incluyendo Gráfica)
      const payload = {
        codigo_inventario: document.getElementById('codigo_inventario').value,
        tipo_equipo: document.getElementById('tipo_equipo').value.toLowerCase(),
        marca: document.getElementById('marca').value,
        modelo: document.getElementById('modelo').value,
        ubicacion: document.getElementById('ubicacion').value,
        estado: document.getElementById('estado').value,
        cantidad_lote: !idEquipo && cantidadLoteInput ? parseInt(cantidadLoteInput.value) || 1 : 1,
        imagen_url: nombreImagen,
        especificaciones: {
          procesador: document.getElementById('procesador').value || 'N/A',
          ram: document.getElementById('ram').value || 'N/A',
          almacenamiento: document.getElementById('almacenamiento').value || 'N/A',
          sistema_operativo: document.getElementById('sistema_operativo').value || 'N/A',
          grafica: document.getElementById('grafica') ? document.getElementById('grafica').value || 'Integrada' : 'Integrada',
          imagen_url: nombreImagen
        }
      };

      const url = idEquipo ? `/api/equipos/${idEquipo}` : '/api/equipos';
      const method = idEquipo ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method: method,
          headers: { 
            'Content-Type': 'application/json',
            'x-user-role': String(idRolActual) 
          },
          body: JSON.stringify(payload)
        });

        const result = await res.json();
        
        if (res.ok || result.status === 'success') {
          cerrarModal();
          cargarEquipos();
        } else {
          alert('Error al guardar equipo: ' + (result.message || 'Error desconocido'));
        }
      } catch (error) {
        console.error('Error al guardar equipo:', error);
      }
    });
  }

  // ==========================================
  // FUNCIONES DEL MODAL
  // ==========================================
  function abrirModalNuevo() {
    formEquipo.reset();
    document.getElementById('equipo-id').value = '';
    document.getElementById('imagen-url-actual').value = '';
    
    // Mostrar campo de lote al crear uno nuevo
    const grupoLote = document.getElementById('cantidad_lote') ? document.getElementById('cantidad_lote').closest('.form-group') : null;
    if (grupoLote) grupoLote.style.display = 'block';
    if (document.getElementById('cantidad_lote')) document.getElementById('cantidad_lote').value = 1;

    modalTitulo.textContent = 'Registrar Nuevo Equipo';
    modal.classList.add('active');
  }

  function cerrarModal() {
    modal.classList.remove('active');
    formEquipo.reset();
  }

  window.editarEquipo = (id) => {
    const equipo = listaEquipos.find(e => Number(e.id_equipo) === Number(id));
    if (!equipo) return;

    modalTitulo.textContent = 'Editar Equipo';
    
    document.getElementById('equipo-id').value = equipo.id_equipo;
    document.getElementById('codigo_inventario').value = equipo.codigo_inventario || '';
    document.getElementById('tipo_equipo').value = equipo.tipo_equipo || 'Laptop';
    document.getElementById('marca').value = equipo.marca || '';
    document.getElementById('modelo').value = equipo.modelo || '';
    document.getElementById('ubicacion').value = equipo.ubicacion || '';
    document.getElementById('estado').value = equipo.estado || 'disponible';

    // Ocultar campo de lote al editar unidades individuales
    const grupoLote = document.getElementById('cantidad_lote') ? document.getElementById('cantidad_lote').closest('.form-group') : null;
    if (grupoLote) grupoLote.style.display = 'none';

    document.getElementById('imagen-url-actual').value = equipo.imagen_url || '';
    document.getElementById('modal-imagen').value = '';

    const specs = equipo.especificaciones || {};
    document.getElementById('procesador').value = specs.procesador || '';
    document.getElementById('ram').value = specs.ram || '';
    document.getElementById('almacenamiento').value = specs.almacenamiento || '';
    document.getElementById('sistema_operativo').value = specs.sistema_operativo || '';
    
    if (document.getElementById('grafica')) {
      document.getElementById('grafica').value = specs.grafica || '';
    }

    modal.classList.add('active');
  };

  window.eliminarEquipo = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este equipo?')) return;

    let rolParaEnviar = '1';
    const sesionRaw = localStorage.getItem('usuario_session');
    if (sesionRaw) {
      try {
        const usuario = JSON.parse(sesionRaw);
        rolParaEnviar = String(usuario.id_rol || (usuario.rol && usuario.rol.toLowerCase() === 'administrador' ? 1 : 2));
      } catch (e) {
        console.error('Error leyendo sesión para eliminar:', e);
      }
    }

    try {
      const res = await fetch(`/api/equipos/${id}`, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': rolParaEnviar
        }
      });

      const dataJson = await res.json().catch(() => ({}));

      if (res.ok && (dataJson.status === 'success' || res.status === 200)) {
        cargarEquipos();
      } else {
        console.error('Error devuelto por el servidor:', dataJson);
        alert('No se pudo eliminar el equipo: ' + (dataJson.message || 'Error desconocido del servidor'));
      }
    } catch (error) {
      console.error('Error de red eliminando equipo:', error);
      alert('Error de conexión con el servidor.');
    }
  };

  // BÚSQUEDA EN TIEMPO REAL
  if (inputBuscar) {
    inputBuscar.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtrados = listaEquipos.filter(eq => {
        const specs = eq.especificaciones || {};
        return (
          (eq.codigo_inventario || '').toLowerCase().includes(term) ||
          (eq.marca || '').toLowerCase().includes(term) ||
          (eq.modelo || '').toLowerCase().includes(term) ||
          (specs.procesador || '').toLowerCase().includes(term) ||
          (specs.grafica || '').toLowerCase().includes(term)
        );
      });
      renderTabla(filtrados);
    });
  }

  // EVENTOS DE BOTONES
  if (btnNuevo) btnNuevo.addEventListener('click', abrirModalNuevo);
  if (btnCerrar) btnCerrar.addEventListener('click', cerrarModal);
  if (btnCancelar) btnCancelar.addEventListener('click', cerrarModal);

  // CARGA INICIAL DE DATOS
  cargarEquipos();
});