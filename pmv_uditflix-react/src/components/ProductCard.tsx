import { useState } from 'react';

import type { Product } from '../models/product';
import './ProductCard.css';

const COLORS = ['orange', 'black', 'blue', 'grey', 'amber', 'lime'];
const SIZES = ['wide', 'normal', 'tall', 'normal', 'normal', 'wide'];

// YouTube y Vimeo no se pueden reproducir con <video>; se incrustan con iframe
function toEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/);
  if (yt) {
    return `https://www.youtube.com/embed/${yt[1]}?autoplay=1`;
  }
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return vimeo ? `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1` : null;
}

const ProductCard: React.FC<{ product: Product; index: number }> = ({ product, index }) => {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const date = new Date(product.fecha_creacion).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const video = product.enlace_video ?? product.enlace_teaser;
  const embedUrl = video ? toEmbedUrl(video) : null;
  const color = COLORS[index % COLORS.length];
  const size = SIZES[index % SIZES.length];

  return (
    <article className={`product-card product-card--${color} product-card--${size}`}>
      {playing && video ? (
        <>
          {embedUrl ? (
            <iframe
              className="product-card__video"
              src={embedUrl}
              title={product.titulo}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <video
              className="product-card__video"
              src={video}
              controls
              autoPlay
              playsInline
              onError={() => setFailed(true)}
            />
          )}
          <button
            type="button"
            className="product-card__close"
            onClick={() => setPlaying(false)}
            aria-label="Cerrar vídeo"
          >
            ✕
          </button>
          {failed && (
            <p className="product-card__error">
              No se pudo reproducir el vídeo.{' '}
              <a href={video} target="_blank" rel="noopener noreferrer">
                Abrir enlace
              </a>
            </p>
          )}
        </>
      ) : (
        <>
          {product.imagen && (
            <figure className="product-card__figure">
              <img src={product.imagen} alt={product.titulo} loading="lazy" />
            </figure>
          )}
          <h2 className="product-card__title">{product.titulo}</h2>
          <div className="product-card__footer">
            <time dateTime={product.fecha_creacion}>{date}</time>
            <div className="product-card__actions">
              {video && (
                <button type="button" onClick={() => setPlaying(true)}>
                  ▶ Vídeo
                </button>
              )}
              {product.enlace_comic && (
                <a href={product.enlace_comic} target="_blank" rel="noopener noreferrer">
                  Cómic
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </article>
  );
};

export default ProductCard;
