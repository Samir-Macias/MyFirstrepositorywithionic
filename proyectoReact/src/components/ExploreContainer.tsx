import './ExploreContainer.css';

import miImagen from '../resources/images.jpeg';

import MiTabla from './TableContainer';

const ExploreContainer: React.FC = () => {
  return (
    <div id="container">
  
        <img src={miImagen} alt="Descripción de la imagen" />
          <h2>UI Components</h2>
      <MiTabla />

    </div>
  );
};

export default ExploreContainer;
