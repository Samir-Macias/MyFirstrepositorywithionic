# Brutal Lab® — React + TypeScript + Tailwind CSS

Landing page responsive de un estudio creativo ficticio, desarrollada para el módulo **Desarrollo de Interfaces (Código 0488)** — 2.º CFGS DAM (Comunidad de Madrid).

## Estructura del Proyecto

- `src/pages/Home.tsx`: Home con hero de altura mínima basada en `100svh`, navegación accesible, galería de proyectos, manifiesto y contacto. Tailwind CSS resuelve la cuadrícula y los breakpoints de teléfono, tablet y escritorio.
- `src/theme/variables.css`: Directivas `@tailwind`, ilustraciones geométricas, microinteracciones y respeto a la preferencia de movimiento reducido.
- `vercel.json`: Configuración de compilación y fallback SPA para rutas de React Router.
- `entrega/entrega-brutal-lab.pdf`: Documento de entrega con explicación del diseño, vistas responsive y guía de despliegue.

## Puesta en marcha local (Node.js >= 20 LTS)

```bash
npm install
npm run dev
```

## Compilación de producción

```bash
npm run build
```

## Despliegue en Vercel

1. Sube el proyecto a un repositorio Git y accede a [vercel.com/new](https://vercel.com/new).
2. Importa el repositorio. Vercel detectará Vite; verifica que el comando de compilación sea `npm run build` y el directorio de salida, `dist`.
3. Pulsa **Deploy**. `vercel.json` proporciona el fallback para que las rutas de React Router sirvan la aplicación.
4. Vercel asignará una URL pública al finalizar. Para futuras entregas, cada push a la rama principal genera un despliegue de producción.

También se puede desplegar desde la terminal con `npx vercel` y publicar con `npx vercel --prod`, tras iniciar sesión en la cuenta de Vercel.
