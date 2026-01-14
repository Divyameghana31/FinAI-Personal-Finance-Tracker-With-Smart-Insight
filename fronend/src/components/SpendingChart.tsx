import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

interface Transaction {
  id: number;
  description: string;
  amount: number;
  category: string;
}

interface Props {
  transactions: Transaction[];
}

const SpendingChart: React.FC<Props> = ({ transactions }) => {
  // Group by category and sum amounts
  const data = transactions.reduce((acc: any[], t) => {
    const existing = acc.find(item => item.category === t.category);
    if (existing) {
      existing.amount += t.amount;
    } else {
      acc.push({ category: t.category, amount: t.amount });
    }
    return acc;
  }, []);

  return (
    <div style={{ width: '90%', height: 300, margin: '2rem auto' }}>
      <h2>Spending by Category</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="amount" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SpendingChart;
