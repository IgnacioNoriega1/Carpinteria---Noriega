import React from 'react';
import { 
  getOverheadExpenses, 
  getExpenseCategories, 
  getPaymentMethods, 
  getProjectsList,
  getSuppliersList
} from './actions';
import ExpenseList from './ExpenseList';

export const revalidate = 0;

export default async function GastosPage() {
  const [expenses, categories, paymentMethods, projects, suppliers] = await Promise.all([
    getOverheadExpenses(),
    getExpenseCategories(),
    getPaymentMethods(),
    getProjectsList(),
    getSuppliersList()
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ marginBottom: '5px' }}>Gastos Generales</h1>
        <p>Registrá y administrá costos fijos u operativos del taller que no pertenezcan exclusivamente a un proyecto.</p>
      </div>
      <ExpenseList 
        initialExpenses={expenses}
        categories={categories}
        paymentMethods={paymentMethods}
        projects={projects}
        suppliers={suppliers}
      />
    </div>
  );
}
