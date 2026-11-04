# M9.3 - Preprocesamiento de CSS con Sass

Proyecto didáctico modular enfocado en explicar los pilares y fundamentos de Sass (sintaxis SCSS moderna con `@use`).

## Conceptos abordados en el código:
1. **Variables y Mapas:** Tokens de color, espaciado, mapas tipográficos y acceso con `map.get`.
2. **Anidamiento (Nesting) y Selector Padre (`&`):** Pseudoclases, pseudoelementos y convención BEM.
3. **Mixins y Parámetros:** Directiva `@mixin`, parámetros por defecto, directiva `@content` y responsive design mobile-first.
4. **Funciones y Cálculos:** `@function`, validación de unidades con `math.div` / operadores nativos y conversión `px` a `rem`.
5. **Herencia con `@extend` y Placeholders (`%`):** Reutilización de estilos sin duplicación de CSS (`%placeholder`).
6. **Estructuras de Control:** Bucles `@each` para generación automatizada de clases utilitarias de color y espaciado.

---

## Cómo ponerlo en marcha en VS Code

### Opción A: Vía Terminal con Node.js
```bash
# 1. Instalar el compilador oficial de Sass
npm install

# 2. Iniciar el compilador en modo escucha (recompila al guardar)
npm run watch:sass
```

### Opción B: Con extensiones de VS Code
1. Instala **Live Sass Compiler** y **Live Server**.
2. Pulsa en **"Watch Sass"** en la barra inferior de estado.
3. Haz clic derecho en `index.html` -> **Open with Live Server**.
