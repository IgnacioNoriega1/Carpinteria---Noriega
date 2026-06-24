import React from 'react';
import { getInventory, getMaterialCategories, getSuppliersList } from './actions';
import InventoryList from './InventoryList';

export const revalidate = 0;

export default async function InventarioPage() {
  const [inventory, categories, suppliers] = await Promise.all([
    getInventory(),
    getMaterialCategories(),
    getSuppliersList()
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ marginBottom: '5px' }}>Inventario de Materiales</h1>
        <p>Control de stock en taller, alertas por faltantes de maderas/herrajes y registro de transacciones de stock.</p>
      </div>
      <InventoryList 
        initialInventory={inventory}
        categories={categories}
        suppliers={suppliers}
      />
    </div>
  );
}
