import React, { useState } from 'react';
import { IonContent, IonIcon, IonPage } from '@ionic/react';
import { arrowDownOutline, arrowForwardOutline, closeOutline, menuOutline } from 'ionicons/icons';

const projects = [
  {
    number: '01',
    name: 'Ruido editorial',
    type: 'IDENTIDAD · 2025',
    color: 'bg-[#ff583d]',
    art: 'editorial',
    label: 'MENOS\nPERFECTO',
  },
  {
    number: '02',
    name: 'Objeto cotidiano',
    type: 'DIRECCIÓN DE ARTE · 2024',
    color: 'bg-[#c3f56a]',
    art: 'object',
    label: 'OTRA\nPERSPECTIVA',
  },
  {
    number: '03',
    name: 'Sistema abierto',
    type: 'EXPERIMENTO DIGITAL · 2024',
    color: 'bg-[#b8a7ff]',
    art: 'system',
    label: 'ROMPE\nEL MOLDE',
  },
];

const Home: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <IonPage>
      <IonContent fullscreen className="studio-content">
        <div className="min-h-screen bg-[#f2f0e9] text-[#171714]">
          <header className="relative z-20 border-b-2 border-[#171714] bg-[#f2f0e9]">
            <div className="mx-auto flex min-h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
              <a
                href="#inicio"
                className="group inline-flex items-center gap-2 text-sm font-black uppercase tracking-tight"
                aria-label="Brutal Lab, inicio"
                onClick={closeMenu}
              >
                <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#171714] bg-[#c3f56a] text-xl transition-transform duration-300 group-hover:rotate-12">
                  B
                </span>
                <span>Brutal Lab<span className="text-[#ff583d]">®</span></span>
              </a>

              <nav
                id="main-navigation"
                aria-label="Navegación principal"
                className={`${
                  menuOpen
                    ? 'absolute left-0 right-0 top-full flex border-b-2 border-[#171714] bg-[#f2f0e9] px-5 py-5 shadow-[0_8px_0_#171714]'
                    : 'hidden'
                } flex-col gap-5 text-xs font-bold uppercase tracking-[0.12em] md:static md:flex md:flex-row md:items-center md:gap-9 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
              >
                <a className="nav-link" href="#proyectos" onClick={closeMenu}>Proyectos</a>
                <a className="nav-link" href="#manifiesto" onClick={closeMenu}>Manifiesto</a>
                <a className="nav-link" href="#contacto" onClick={closeMenu}>Contacto</a>
              </nav>

              <a
                href="#proyectos"
                className="hidden border-2 border-[#171714] bg-[#c3f56a] px-4 py-2 text-xs font-black uppercase tracking-wide transition-all duration-200 hover:-translate-y-1 hover:translate-x-1 hover:shadow-[-4px_4px_0_#171714] md:inline-flex"
              >
                Ver trabajo <IonIcon icon={arrowForwardOutline} className="ml-2 text-base" />
              </a>

              <button
                type="button"
                className="grid h-11 w-11 place-items-center border-2 border-[#171714] bg-[#c3f56a] text-xl transition-transform hover:rotate-3 md:hidden"
                aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={menuOpen}
                aria-controls="main-navigation"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <IonIcon icon={menuOpen ? closeOutline : menuOutline} />
              </button>
            </div>
          </header>

          <main>
            <section
              id="inicio"
              aria-labelledby="hero-title"
              className="relative mx-auto grid min-h-[calc(100svh-76px)] max-w-[1440px] overflow-hidden border-b-2 border-[#171714] lg:grid-cols-[1.05fr_0.95fr]"
            >
              <div className="relative z-10 flex flex-col justify-center px-5 pb-12 pt-16 sm:px-8 sm:pb-16 lg:px-12 lg:py-16">
                <p className="mb-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.22em]">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-[#ff583d]" />
                  Estudio independiente · Madrid
                </p>
                <h1
                  id="hero-title"
                  className="max-w-4xl text-[clamp(3.6rem,12vw,9rem)] font-black uppercase leading-[0.78] tracking-[-0.09em]"
                >
                  Ideas que
                  <span className="mt-3 block text-[#ff583d]">no piden</span>
                  <span className="mt-3 block">permiso<span className="text-[#ff583d]">.</span></span>
                </h1>
                <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                  <p className="max-w-sm text-base font-medium leading-relaxed sm:text-lg">
                    Diseño con carácter para marcas que prefieren hacerse notar.
                    Sin fórmulas. Sin pedir permiso.
                  </p>
                  <a
                    href="#proyectos"
                    className="group inline-flex w-fit items-center gap-3 border-b-2 border-[#171714] pb-2 text-xs font-black uppercase tracking-[0.13em]"
                  >
                    Explora el trabajo
                    <IonIcon
                      icon={arrowDownOutline}
                      className="text-lg transition-transform duration-300 group-hover:translate-y-1"
                    />
                  </a>
                </div>
              </div>

              <div className="relative min-h-[390px] overflow-hidden border-t-2 border-[#171714] bg-[#c3f56a] lg:min-h-0 lg:border-l-2 lg:border-t-0">
                <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(#171714_1px,transparent_1px),linear-gradient(90deg,#171714_1px,transparent_1px)] [background-size:34px_34px]" />
                <div className="hero-orbit absolute left-1/2 top-1/2 grid aspect-square w-[min(73vw,470px)] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-[#171714] bg-[#ff583d] shadow-[12px_12px_0_#171714] transition-transform duration-700 hover:rotate-6">
                  <div className="grid aspect-square w-[76%] place-items-center rounded-full border-2 border-[#171714] bg-[#f2f0e9]">
                    <span className="hero-type text-center text-[clamp(4rem,14vw,9rem)] font-black leading-[0.7] tracking-[-0.12em]">
                      NO
                      <br />
                      RULES
                    </span>
                  </div>
                  <span className="absolute right-[5%] top-[12%] -rotate-12 border-2 border-[#171714] bg-[#b8a7ff] px-3 py-2 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0_#171714] sm:text-sm">
                    Haz ruido ↗
                  </span>
                </div>
                <span className="absolute bottom-5 left-5 text-[10px] font-black uppercase tracking-[0.18em]">
                  Fig. 01 — Sin instrucciones
                </span>
                <span className="absolute right-5 top-5 rotate-90 origin-right text-[10px] font-black uppercase tracking-[0.18em]">
                  Desde 2021 · Siempre en proceso
                </span>
              </div>
            </section>

            <div
              aria-hidden="true"
              className="overflow-hidden border-b-2 border-[#171714] bg-[#171714] py-3 text-[#c3f56a]"
            >
              <div className="marquee-track flex w-max gap-6 text-sm font-black uppercase tracking-[0.18em]">
                {Array.from({ length: 4 }, (_, index) => (
                  <span key={index}>Diseño sin permiso ✳ ideas incómodas ✳ formas nuevas ✳</span>
                ))}
              </div>
            </div>

            <section
              id="proyectos"
              aria-labelledby="projects-title"
              className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12"
            >
              <div className="mb-10 flex flex-col gap-5 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#ff583d]">
                    Una selección, no un resumen
                  </p>
                  <h2 id="projects-title" className="text-5xl font-black uppercase leading-none tracking-[-0.07em] sm:text-7xl">
                    Trabajo<br className="sm:hidden" /> reciente<span className="text-[#ff583d]">.</span>
                  </h2>
                </div>
                <p className="max-w-xs text-sm font-medium leading-relaxed">
                  Identidades, objetos e ideas que encontraron su propia manera de existir.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <article key={project.number} className="group">
                    <a href="#contacto" className="block" aria-label={`Consultar sobre ${project.name}`}>
                      <div className={`project-art ${project.color} relative aspect-[1.15/1] overflow-hidden border-2 border-[#171714]`}>
                        <div className={`project-shape ${project.art}`} aria-hidden="true">
                          <span>{project.label.split('\n')[0]}</span>
                          <span>{project.label.split('\n')[1]}</span>
                        </div>
                        <span className="absolute left-4 top-4 border-2 border-[#171714] bg-[#f2f0e9] px-2 py-1 text-[10px] font-black">
                          {project.number} / 03
                        </span>
                        <span className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full border-2 border-[#171714] bg-[#f2f0e9] text-xl transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:bg-[#c3f56a]">
                          <IonIcon icon={arrowForwardOutline} />
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-3 border-b-2 border-[#171714] py-4">
                        <h3 className="text-lg font-black uppercase tracking-tight">{project.name}</h3>
                        <span className="pt-1 text-right text-[9px] font-bold uppercase tracking-[0.12em] text-[#55554f]">
                          {project.type}
                        </span>
                      </div>
                    </a>
                  </article>
                ))}
              </div>
            </section>

            <section
              id="manifiesto"
              aria-labelledby="manifesto-title"
              className="border-y-2 border-[#171714] bg-[#b8a7ff] px-5 py-16 sm:px-8 sm:py-24 lg:px-12"
            >
              <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em]">Manifiesto 001</p>
                  <p className="mt-8 max-w-xs text-sm font-medium leading-relaxed">
                    Lo pulido no siempre es mejor. A veces, la idea necesita espacio para
                    equivocarse, crecer y sorprender.
                  </p>
                </div>
                <h2 id="manifesto-title" className="text-4xl font-black uppercase leading-[0.95] tracking-[-0.07em] sm:text-6xl lg:text-7xl">
                  Lo imperfecto también es una decisión<span className="text-[#ff583d]">.</span>
                </h2>
              </div>
            </section>

            <footer id="contacto" className="bg-[#171714] px-5 py-14 text-[#f2f0e9] sm:px-8 sm:py-20 lg:px-12">
              <div className="mx-auto flex max-w-[1440px] flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-[#c3f56a]">
                    ¿Tienes una idea rara?
                  </p>
                  <a
                    href="mailto:hola@brutallab.studio"
                    className="group inline-flex items-center gap-3 text-3xl font-black uppercase tracking-[-0.06em] transition-colors hover:text-[#c3f56a] sm:text-5xl"
                  >
                    Hablemos<span className="text-[#ff583d]">.</span>
                    <IonIcon icon={arrowForwardOutline} className="text-2xl transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#b8b8ae]">
                  Brutal Lab® · Madrid · 2025
                </p>
              </div>
            </footer>
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
