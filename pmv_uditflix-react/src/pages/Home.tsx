import { IonContent, IonHeader, IonPage, IonText, IonTitle, IonToolbar } from '@ionic/react';
import { useEffect, useState } from 'react';

import ProductCard from '../components/ProductCard';
import type { Product } from '../models/product';
import { getProducts } from '../services/products';
import './Home.css';

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Home</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="products-grid">
          {loading &&
            [0, 1, 2, 3].map((n) => <div key={n} className="product-card product-card--grey product-card--skeleton" />)}
          {error && (
            <IonText color="danger" className="products-state">
              <p>{error}</p>
            </IonText>
          )}
          {!loading && !error && products.length === 0 && (
            <IonText color="medium" className="products-state">
              <p>No hay productos todavía.</p>
            </IonText>
          )}
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
