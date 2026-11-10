# Modal de Confirmación - Demostración Visual

## 🎬 Flujo de Uso

### 1️⃣ Estado Inicial - Tabla de Clientes
```
┌─────────────────────────────────────────┐
│ Clientes                                │
│ ┌───────────────────────────────────────┤
│ │ ID │ Nombre │ Email │ Teléfono │ ... │
│ ├────┼────────┼───────┼──────────┤     │
│ │ 1  │ Juan   │ ...   │ ...      │ 🗑️  │  ← Usuario hace clic en "Eliminar"
│ └─────────────────────────────────────────┘
```

### 2️⃣ Modal Abierto - Confirmación
```
┌──────────────────────────────────────────────────────────┐
│                      [MODAL SOBREPUESTO]                 │
│  ╔════════════════════════════════════════════════════╗  │
│  ║  ⚠️ Confirmar eliminación                   ✕     ║  │ ← Encabezado rojo
│  ╠════════════════════════════════════════════════════╣  │
│  ║                                                    ║  │
│  ║  ¿Está seguro de que desea eliminar a Juan?      ║  │ ← Mensaje personalizado
│  ║                                                    ║  │
│  ║  Esta acción no se puede deshacer.                ║  │ ← Advertencia
│  ║                                                    ║  │
│  ╠════════════════════════════════════════════════════╣  │
│  ║              [Cancelar]  [🗑️ Sí, eliminar]      ║  │ ← Botones
│  ╚════════════════════════════════════════════════════╝  │
│                   (Fondo oscuro/overlay)                  │
└──────────────────────────────────────────────────────────┘
```

### 3️⃣ Durante Eliminación - Estado de Carga
```
┌──────────────────────────────────────────────────────────┐
│                      [MODAL SOBREPUESTO]                 │
│  ╔════════════════════════════════════════════════════╗  │
│  ║  ⚠️ Confirmar eliminación                   ✕     ║  │
│  ╠════════════════════════════════════════════════════╣  │
│  ║                                                    ║  │
│  ║  ¿Está seguro de que desea eliminar a Juan?      ║  │
│  ║                                                    ║  │
│  ║  Esta acción no se puede deshacer.                ║  │
│  ║                                                    ║  │
│  ╠════════════════════════════════════════════════════╣  │
│  ║       [Cancelar] [⟳ Eliminando...]               ║  │ ← Spinner y botón deshabilitado
│  ║       (deshabilitado)  (deshabilitado)            ║  │
│  ╚════════════════════════════════════════════════════╝  │
└──────────────────────────────────────────────────────────┘
```

### 4️⃣ Después - Modal Cerrado
```
┌─────────────────────────────────────────┐
│ Clientes                                │
│ ┌───────────────────────────────────────┤
│ │ ID │ Nombre │ Email │ Teléfono │ ... │
│ ├────┼────────┼───────┼──────────┤     │
│ │ 2  │ Ana    │ ...   │ ...      │ 🗑️  │  ← Cliente eliminado
│ │ 3  │ Carlos │ ...   │ ...      │ 🗑️  │      No aparece "Juan"
│ └─────────────────────────────────────────┘
```

## 🎨 Detalles de Estilo

### Encabezado
```css
.modal-header {
    background-color: #dc3545;  /* Red */
    color: white;
    padding: 1.5rem;
    border-radius: 0.5rem 0.5rem 0 0;
}

.modal-title {
    font-size: 1.25rem;
    font-weight: 600;
}
```

### Cuerpo
```css
.modal-body {
    padding: 1.5rem;
    font-size: 1rem;
    line-height: 1.6;
}

.modal-body strong {
    font-weight: 700;
    color: #333;
}

.modal-body .text-danger {
    color: #dc3545;
    font-size: 0.875rem;
}
```

### Footer
```css
.modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #dee2e6;
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
}

.btn-secondary {
    background-color: #6c757d;  /* Gray */
}

.btn-danger {
    background-color: #dc3545;  /* Red */
    color: white;
}

.btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
}
```

### Backdrop
```css
.modal.show {
    display: block;
    background-color: rgba(0, 0, 0, 0.5);  /* Semi-transparent black */
}

.modal-dialog-centered {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
}
```

## 💻 Código React

### ConfirmDeleteModal.tsx
```tsx
export default function ConfirmDeleteModal({
    clientName,
    onConfirm,
    onCancel
}: ConfirmDeleteModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    return (
        <div className="modal fade show" style={{ display: 'block' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    {/* HEADER */}
                    <div className="modal-header bg-danger text-white">
                        <h5 className="modal-title">⚠️ Confirmar eliminación</h5>
                    </div>

                    {/* BODY */}
                    <div className="modal-body">
                        <p>¿Está seguro de que desea eliminar a <strong>{clientName}</strong>?</p>
                        <p className="text-danger small">Esta acción no se puede deshacer.</p>
                    </div>

                    {/* FOOTER */}
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onCancel}>
                            Cancelar
                        </button>
                        <button className="btn btn-danger" onClick={onConfirm} disabled={isDeleting}>
                            {isDeleting ? '⟳ Eliminando...' : '🗑️ Sí, eliminar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
```

## 🎯 Casos de Uso

### En ClientsPage
```tsx
const handleDelete = (id: number, name: string) => {
    setDeleteModal({ id, name });  // Mostrar modal
};

const confirmDelete = async () => {
    if (!deleteModal) return;
    await ClientsService.deleteClient(deleteModal.id);
    setClients(clients.filter(c => c.id !== deleteModal.id));
    setDeleteModal(null);  // Cerrar modal
};
```

### En EditClientPage
```tsx
const remove = () => {
    setShowDeleteModal(true);  // Mostrar modal
};

const confirmDelete = async () => {
    await ClientsService.deleteClient(Number(id));
    navigate('/home');  // Redirigir después de eliminar
};
```

## ✨ Mejoras Futuras

1. **Animaciones**
   - Fade in/out del modal
   - Slide de los botones
   - Pulse del icono de advertencia

2. **Notificaciones**
   - Toast de éxito: "Cliente eliminado"
   - Toast de error: "No se pudo eliminar"

3. **Teclado**
   - ESC para cancelar
   - Enter para confirmar (si está enfocado)

4. **Accesibilidad**
   - focus-trap
   - ARIA labels
   - Screen reader support

5. **Personalizaciones**
   - Color del modal según gravedad
   - Texto personalizable
   - Iconos customizables

