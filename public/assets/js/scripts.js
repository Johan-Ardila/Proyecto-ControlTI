/*======================== SLIDER ========================*/
const slides = [
  { imagen: '../assets/img/Slider/slide1.png', color: '#7F77DD', eyebrow: 'Autenticación', titulo: 'Acceso seguro para cada usuario del sistema' },
  { imagen: '../assets/img/Slider/slide2.jpg', color: '#1D9E75', eyebrow: 'Inventario', titulo: 'Control en tiempo real de equipos y ubicaciones' },
  { imagen: '../assets/img/Slider/slide3.jpg', color: '#D85A30', eyebrow: 'Reportes', titulo: 'Genera informes claros para la toma de decisiones' },
];

const capaBase = document.getElementById('capaBase');
const capaEntrante = document.getElementById('capaEntrante');
const cont = document.getElementById('indicadores');
const DURACION = 5000; // ms entre slides

if (cont && capaBase && capaEntrante) {
  slides.forEach((_, i) => {
    const p = document.createElement('div');
    p.className = 'punto';
    cont.appendChild(p);
  });
  const puntos = cont.querySelectorAll('.punto');

  function pintarCapa(capa, slide) {
    capa.style.backgroundImage = `linear-gradient(180deg, rgba(2,13,29,.15) 0%, rgba(2,13,29,.85) 100%), url('${slide.imagen}')`;
    capa.style.backgroundSize = 'cover'; 
    capa.style.backgroundPosition = 'center';
    capa.style.backgroundRepeat = 'no-repeat';    
    capa.style.backgroundColor = slide.color; 
    capa.querySelector('.eyebrow').textContent = slide.eyebrow;   
    capa.querySelector('h2').textContent = slide.titulo;             
    capa.querySelector('.franja').style.background = slide.color;    
  }

  let actual = 0;
  pintarCapa(capaBase, slides[actual]);

  function marcarPunto(i) {
    puntos.forEach(p => p.classList.remove('activo'));
    void puntos[i].offsetWidth; // Fuerza reflow
    puntos[i].classList.add('activo');
  }

  function siguienteSlide() {
    const nuevo = (actual + 1) % slides.length;
    pintarCapa(capaEntrante, slides[nuevo]);

    capaEntrante.style.transition = 'none';
    capaEntrante.classList.remove('activa');
    void capaEntrante.offsetWidth;
    capaEntrante.style.transition = '';
    capaEntrante.classList.add('activa');

    capaEntrante.addEventListener('transitionend', function limpiar() {
      capaEntrante.removeEventListener('transitionend', limpiar);
      pintarCapa(capaBase, slides[nuevo]);
      capaEntrante.style.transition = 'none';
      capaEntrante.classList.remove('activa');
      void capaEntrante.offsetWidth;
      capaEntrante.style.transition = '';
      actual = nuevo;
    });
  }

  marcarPunto(actual);
  setInterval(() => {
    siguienteSlide();
    marcarPunto((actual + 1) % slides.length);
  }, DURACION);
}

/*======================== TRANSPARENCIA NAVBAR ========================*/
const scrollHeader = () => {
  const header = document.getElementById('header');
  if (header) {
    window.scrollY >= 50 ? header.classList.add('bg-header') 
                         : header.classList.remove('bg-header');
  }
};
window.addEventListener('scroll', scrollHeader);

/*=============== SHOW MENU ===============*/
const showMenu = (toggleId, navId) => {
  const toggle = document.getElementById(toggleId),
        nav = document.getElementById(navId);

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('show-menu');
      toggle.classList.toggle('show-icon');
    });
  }
};
showMenu('nav-toggle', 'nav-menu');

/*======================== SECCIÓN EQUIPOS Y BUSCADOR ========================*/
let todosLosEquipos = []; // Guardará los datos traídos de la API

// Renderizar tarjetas en el HTML
const renderizarEquipos = (equipos) => {
  const container = document.getElementById('equipos-container');
  if (!container) return;

  if (equipos.length === 0) {
    container.innerHTML = '<p class="equipos__empty">No se encontraron equipos que coincidan con la búsqueda.</p>';
    return;
  }

  container.innerHTML = equipos.map(equipo => {
    const specs = equipo.especificaciones || {};
    const esDisponible = (equipo.estado || 'disponible').toLowerCase() === 'disponible';

    // Resolver ruta de la imagen
    const imgNombre = equipo.imagen_url || specs.imagen_url;
    const imgPath = imgNombre ? `/assets/img/${imgNombre}` : '/assets/img/default-laptop.png';

    return `
      <article class="equipo__card">
        <div class="equipo__img-wrapper">
          <img src="${imgPath}" alt="${equipo.marca} ${equipo.modelo}" class="equipo__img" loading="lazy">
        </div><br>
        <div class="equipo__content">
          <h3 class="equipo__name">${equipo.marca} ${equipo.modelo}</h3>
          <p class="equipo__spec">RAM: ${specs.ram || 'N/A'}</p>
          <p class="equipo__spec">ALMACENAMIENTO: ${specs.almacenamiento || 'N/A'}</p>
          <p class="equipo__spec">CPU: ${specs.procesador || 'N/A'}</p>
          <button onclick="solicitarEquipo('${equipo.id_equipo}')" class="equipo__btn" ${!esDisponible ? 'disabled' : ''}>
            ${esDisponible ? 'Solicitar' : 'Agotado'}
          </button>
        </div>
      </article>
    `;
  }).join('');
};

// Obtener equipos desde la API de Express
const obtenerEquipos = async () => {
  const container = document.getElementById('equipos-container');
  if (!container) return;

  try {
    const response = await fetch('/api/equipos');
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

    const result = await response.json();
    todosLosEquipos = Array.isArray(result) ? result : (result.data || []);

    renderizarEquipos(todosLosEquipos);

  } catch (error) {
    console.error('Error al cargar equipos:', error);
    container.innerHTML = '<p class="equipos__error">No se pudo cargar la lista de equipos.</p>';
  }
};

// Lógica de búsqueda en tiempo real
const inicializarBuscador = () => {
  const inputBuscar = document.getElementById('searchEquipos') || document.getElementById('inputBuscar');
  if (!inputBuscar) return;

  inputBuscar.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();

    const filtrados = todosLosEquipos.filter(equipo => {
      const specs = equipo.especificaciones || {};
      return (
        (equipo.codigo_inventario || '').toLowerCase().includes(term) ||
        (equipo.marca || '').toLowerCase().includes(term) ||
        (equipo.modelo || '').toLowerCase().includes(term) ||
        (specs.procesador || '').toLowerCase().includes(term) ||
        (specs.ram || '').toLowerCase().includes(term)
      );
    });

    renderizarEquipos(filtrados);
  });
};

// Placeholder para la interacción de solicitud
const solicitarEquipo = (id) => {
  console.log(`Iniciando solicitud para el equipo ID: ${id}`);
};

/*======================== CAPTURA FORMULARIO CONTACTO ========================*/
const contactoForm = document.querySelector('.contacto__form');

if (contactoForm) {
  contactoForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const submitBtn = contactoForm.querySelector('.contacto__btn');
    const originalBtnText = submitBtn.textContent;

  const formData = {
      nombre: contactoForm.querySelector('input[placeholder*="Johan"]')?.value || '',
      correo: contactoForm.querySelector('input[type="email"]')?.value || '', 
      asunto: contactoForm.querySelector('input[placeholder*="Solicitud"]')?.value || '',
      mensaje: contactoForm.querySelector('.contacto__textarea')?.value || ''
    };

    try {
      submitBtn.textContent = 'Enviando...';
      submitBtn.disabled = true;

      const response = await fetch('/api/contacto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('¡Mensaje enviado correctamente! Nos pondremos en contacto pronto.');
        contactoForm.reset();
      } else {
        throw new Error('Error al procesar la solicitud');
      }

    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un problema al enviar el mensaje. Inténtalo nuevamente.');
    } finally {
      submitBtn.textContent = originalBtnText;
      submitBtn.disabled = false;
    }
  });
}

/*======================== INICIALIZACIÓN ========================*/
document.addEventListener('DOMContentLoaded', () => {
  obtenerEquipos();
  inicializarBuscador();
});