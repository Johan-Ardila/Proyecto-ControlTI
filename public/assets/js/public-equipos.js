let listaEquiposPublicos = [];

document.addEventListener('DOMContentLoaded', () => {
  cargarEquiposPublicos();
});

//Obtiene los equipos desde la API Backend
async function cargarEquiposPublicos() {
  const container = document.getElementById('equipos-container');
  try {
    const response = await fetch('/api/equipos');
    const result = await response.json();

    if (result.status === 'success' || Array.isArray(result)) {
      listaEquiposPublicos = result.data || result;
      renderizarTarjetas(listaEquiposPublicos);
    } else {
      container.innerHTML = '<p class="equipos__loading">No hay equipos registrados.</p>';
    }
  } catch (error) {
    console.error('Error al cargar catálogo público:', error);
    container.innerHTML = '<p class="equipos__loading">Error al cargar el inventario.</p>';
  }
}

//Dibuja las tarjetas en el HTML
function renderizarTarjetas(equipos) {
  const container = document.getElementById('equipos-container');
  container.innerHTML = '';

  if (equipos.length === 0) {
    container.innerHTML = '<p style="color: #ffffff; grid-column: 1 / -1; text-align: center;">No se encontraron equipos que coincidan con la búsqueda.</p>';
    return;
  }

  equipos.forEach(equipo => {
    const esDisponible = equipo.estado === 'disponible';
    
    //Obtener especificaciones de MongoDB / MariaDB
    const specs = equipo.especificaciones || {};
    const ram = specs.ram || equipo.ram || 'N/A';
    const almacenamiento = specs.almacenamiento || equipo.almacenamiento || 'N/A';
    const cpu = specs.procesador || equipo.procesador || 'N/A';
    
    //Resolver la ruta de la imagen
    const imgNombre = equipo.imagen_url || specs.imagen_url;
    let imgPath = 'https://cdn-icons-png.flaticon.com/512/3474/3474360.png'; // Fallback por defecto

    if (imgNombre && imgNombre.trim() !== '') {
      imgPath = imgNombre.startsWith('/assets/') 
        ? imgNombre 
        : `/assets/img/${imgNombre}`;
    }

    //Crear tarjeta HTML
    const card = document.createElement('article');
    card.className = 'equipo__card';
    card.innerHTML = `
      <div class="equipo__img-wrapper">
        <img 
          src="${imgPath}" 
          alt="${equipo.marca || ''} ${equipo.modelo || ''}"
          onerror="this.onerror=null; this.src='https://cdn-icons-png.flaticon.com/512/3474/3474360.png';"
        />
      </div>
      <h3 class="equipo__name">${equipo.nombre || (equipo.marca + ' ' + equipo.modelo)}</h3>
      <p class="equipo__spec">RAM: ${ram}</p>
      <p class="equipo__spec">ALMACENAMIENTO: ${almacenamiento}</p>
      <p class="equipo__spec">CPU: ${cpu}</p>
      <button 
        class="equipo__btn" 
        ${esDisponible ? `onclick="procesarSolicitud(${equipo.id_equipo})"` : 'disabled'}
      >
        ${esDisponible ? 'Solicitar' : 'Agotado'}
      </button>
    `;
    container.appendChild(card);
  });
}

//Filtrar en tiempo real con la barra de búsqueda
function filtrarEquiposPublicos() {
  const texto = document.getElementById('searchEquipos').value.toLowerCase();
  
  const filtrados = listaEquiposPublicos.filter(eq => {
    const nombre = (eq.nombre || '').toLowerCase();
    const marca = (eq.marca || '').toLowerCase();
    const modelo = (eq.modelo || '').toLowerCase();
    const cpu = (eq.especificaciones?.procesador || eq.procesador || '').toLowerCase();

    return nombre.includes(texto) || marca.includes(texto) || modelo.includes(texto) || cpu.includes(texto);
  });

  renderizarTarjetas(filtrados);
}

//Conexión con la tabla solicitudes de MariaDB (CORREGIDO)
// Conexión con la tabla solicitudes de MariaDB incluyendo el correo del usuario
async function procesarSolicitud(idEquipo) {
  // Extraer la sesión desde 'usuario_session'
  const sesionRaw = localStorage.getItem('usuario_session');

  if (!sesionRaw) {
    alert('Debes iniciar sesión para realizar una solicitud.');
    window.location.href = '/login';
    return;
  }

  let usuario = null;
  try {
    usuario = JSON.parse(sesionRaw);
  } catch (e) {
    console.error('Error al leer el objeto de sesión:', e);
  }

  if (!usuario || !usuario.id_usuario) {
    alert('Sesión no encontrada o expirada. Por favor, inicia sesión de nuevo.');
    window.location.href = '/login';
    return;
  }

  if (!confirm('¿Deseas enviar una solicitud para este equipo?')) return;

  //Extraer el correo de la sesión (validando si la propiedad se llama 'correo' o 'email')
  const correoUsuario = usuario.correo || usuario.email || '';

  try {
    const response = await fetch('/api/solicitudes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_usuario: Number(usuario.id_usuario),
        correo: correoUsuario, // <--- Enviamos el correo capturado de la sesión
        id_equipo: idEquipo,
        tipo_solicitud: 'asignacion',
        descripcion: 'Solicitud enviada desde el catálogo web principal',
        prioridad: 'media'
      })
    });

    const data = await response.json();

    if (response.ok && data.status === 'success') {
      alert('¡Solicitud registrada con éxito! Podrás ver su estado desde el panel.');
    } else {
      alert('Error: ' + (data.message || 'No se pudo registrar la solicitud.'));
    }
  } catch (error) {
    console.error('Error al solicitar:', error);
    alert('Fallo de conexión con el servidor.');
  }
}