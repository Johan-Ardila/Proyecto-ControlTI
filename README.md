# Proyecto Control TI 🖥️📊

Sistema web integral desarrollado para la gestión, control y trazabilidad de inventario de equipos tecnológicos y recursos de hardware. Este proyecto fue diseñado e implementado como parte fundamental del proceso formativo en el programa de Análisis y Desarrollo de Software (ADSO).

---

##  Características Principales

* **Gestión de Inventario de Hardware:** Registro detallado, actualización de estados, categorías y consulta rápida de equipos tecnológicos.
* **Control de Asignaciones:** Seguimiento preciso de la asignación de equipos a usuarios, áreas o departamentos.
* **Sistema de Autenticación:** Control de acceso seguro mediante un módulo de inicio de sesión gestionado desde el servidor.
* **Arquitectura Modular:** Organización del código basada en el patrón de diseño lógico (Rutas, Controladores y Modelos).

---

##  Tecnologías y Stack

El proyecto fue construido utilizando tecnologías modernas del ecosistema de JavaScript y bases de datos relacionales:

* **Entorno de ejecución:** Node.js
* **Framework Backend:** Express.js
* **Base de Datos:** MySQL / MariaDB
* **Frontend / Vistas:** HTML5, CSS3, JavaScript (con integración de motor de plantillas o vistas modulares)
* **Control de Versiones:** Git / GitHub

---

## Estructura del Proyecto

```text
Proyecto-ControlTI/
│
├── public/            # Archivos estáticos (hojas de estilo CSS, scripts de cliente, imágenes)
├── src/
│   ├── config/        # Configuración de la conexión a la base de datos
│   ├── controllers/   # Lógica de negocio y controladores de rutas
│   ├── models/        # Consultas y modelos de interacción con la base de datos
│   ├── routes/        # Definición de rutas y endpoints de la aplicación
│   └── views/         # Interfaz de usuario (vistas o plantillas)
│
├── .env.example       # Plantilla de variables de entorno requeridas
├── package.json       # Dependencias y scripts de configuración del proyecto
└── server.js          # Punto de entrada principal de la aplicación
