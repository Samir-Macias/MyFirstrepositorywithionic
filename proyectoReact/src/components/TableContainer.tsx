import React from 'react';

function MiTabla(): React.JSX.Element {
  return (
    <div style={{ padding: '20px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Columna 1</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Columna 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '8px' }}>Fila 1, Celda 1</td>
            <td style={{ border: '1px solid #ccc', padding: '8px' }}>Fila 1, Celda 2</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '8px' }}>Fila 2, Celda 1</td>
            <td style={{ border: '1px solid #ccc', padding: '8px' }}>Fila 2, Celda 2</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '8px' }}>Fila 3, Celda 1</td>
            <td style={{ border: '1px solid #ccc', padding: '8px' }}>Fila 3, Celda 2</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default MiTabla;
