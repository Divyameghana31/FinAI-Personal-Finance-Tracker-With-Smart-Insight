import { useState } from 'react';

interface Props {
  onAddTransaction: (description: string, amount: number, category: string, date: string) => void;
}

const categories = ['Food', 'Rent', 'Travel', 'Other'];

function TransactionForm({ onAddTransaction }: Props) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState(categories[0]);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  // New state for custom category
  const [customCategory, setCustomCategory] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || description.trim() === '' || !date) return;
    // If "Other" selected, use customCategory, else use the category selected
    const finalCategory = category === "Other" && customCategory.trim() ? customCategory : category;
    onAddTransaction(description, Number(amount), finalCategory, date);
    setDescription('');
    setAmount('');
    setCategory(categories[0]);
    setDate(new Date().toISOString().split('T')[0]);
    setCustomCategory('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '300px', margin: '2rem auto' }}>
      <h2>Add Transaction</h2>
      <div>
        <input
          type="text"
          placeholder="Description (e.g. Food)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          style={{ width: '100%', marginBottom: '1rem' }}
        />
      </div>
      <div>
        <input
          type="number"
          placeholder="Amount ($)"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          required
          style={{ width: '100%', marginBottom: '1rem' }}
        />
      </div>
      <div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ width: '100%', marginBottom: '1rem' }}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      {/* Show custom category input when "Other" is selected */}
      {category === "Other" && (
        <div>
          <input
            type="text"
            placeholder="Custom Category (e.g. Books)"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            style={{ width: '100%', marginBottom: '1rem' }}
            required
          />
        </div>
      )}
      <div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          style={{ width: '100%', marginBottom: '1rem' }}
        />
      </div>
      <button type="submit">Add</button>
    </form>
  );
}

export default TransactionForm;
