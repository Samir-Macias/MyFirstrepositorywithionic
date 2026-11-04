# M9.4 - Patrón 7-1 de Arquitectura CSS3 / Sass

Proyecto didáctico listo para abrir en **Visual Studio Code** y enseñar la arquitectura modular en Sass/SCSS.

## Estructura del Patrón 7-1

```text
scss/
├── main.scss               # Manifiesto: importa todo en orden lógico
├── 1-abstracts/            # Variables, funciones y mixins (no emite CSS por sí mismo)
├── 2-base/                 # Reglas generales, reset y tipografía
├── 3-components/           # Piezas de UI independientes y reutilizables
├── 4-layout/               # Estructura de página (header, footer, grid)
├── 5-pages/                # Estilos específicos de vistas/páginas
├── 6-themes/               # Modos (oscuro/claro, alto contraste)
└── 7-vendors/              # Código de librerías de terceros (normalize, etc.)
```

## Cómo compilar

### Opción 1: Con npm (Sass CLI)
```bash
npm install
npm run compile:sass  # Compila una vez en dist/css/main.css
npm run watch:sass    # Escucha cambios en tiempo real
```

### Opción 2: Con la extensión Live Sass Compiler en VS Code
1. Abre esta carpeta en VS Code.
2. Pulsa en **"Watch Sass"** en la barra de estado inferior.
