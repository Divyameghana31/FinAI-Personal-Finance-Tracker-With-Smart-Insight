import React, { useState } from 'react';

const ExpensePredictor: React.FC = () => {
  const [totalExpense, setTotalExpense] = useState<string>('');
  const [transactionCount, setTransactionCount] = useState<string>('');
  const [foodTotal, setFoodTotal] = useState<string>('');
  const [rentTotal, setRentTotal] = useState<string>('');
  const [travelTotal, setTravelTotal] = useState<string>('');
  const [otherTotal, setOtherTotal] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [percentChange, setPercentChange] = useState<string>('');

  const [predictedExpense, setPredictedExpense] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setPredictedExpense(null);

    // Build features array ordered as expected by backend
    const features = [
      Number(totalExpense),
      Number(transactionCount),
      Number(foodTotal),
      Number(rentTotal),
      Number(travelTotal),
      Number(otherTotal),
      Number(month),
      Number(percentChange),
    ];

    // Validate inputs - check for empty or invalid numeric values
    if (features.some(val => isNaN(val))) {
      setError('Please enter valid numeric values for all fields.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || `Error: ${response.status}`);
      }

      const data = await response.json();
      setPredictedExpense(data.predicted_expense);
    } catch (err: any) {
      setError(err.message);
      setPredictedExpense(null);
    } finally {
      setLoading(false);
    }
  };

  // Check if any input is empty to disable Predict button
  const disablePredict = loading || [
    totalExpense,
    transactionCount,
    foodTotal,
    rentTotal,
    travelTotal,
    otherTotal,
    month,
    percentChange,
  ].some(val => val.trim() === '');

  return (
    <div>
      <h3>Predict Next Month Expense</h3>

      <input
        type="number"
        value={totalExpense}
        onChange={e => setTotalExpense(e.target.value)}
        placeholder="Enter total expense"
      />
      <input
        type="number"
        value={transactionCount}
        onChange={e => setTransactionCount(e.target.value)}
        placeholder="Enter transaction count"
      />
      <input
        type="number"
        value={foodTotal}
        onChange={e => setFoodTotal(e.target.value)}
        placeholder="Enter food total"
      />
      <input
        type="number"
        value={rentTotal}
        onChange={e => setRentTotal(e.target.value)}
        placeholder="Enter rent total"
      />
      <input
        type="number"
        value={travelTotal}
        onChange={e => setTravelTotal(e.target.value)}
        placeholder="Enter travel total"
      />
      <input
        type="number"
        value={otherTotal}
        onChange={e => setOtherTotal(e.target.value)}
        placeholder="Enter other total"
      />
      <input
        type="number"
        value={month}
        onChange={e => setMonth(e.target.value)}
        placeholder="Enter month (1-12)"
        min={1}
        max={12}
      />
      <input
        type="number"
        value={percentChange}
        onChange={e => setPercentChange(e.target.value)}
        placeholder="Enter percent change (decimal)"
        step="0.01"
      />

      <button onClick={handlePredict} disabled={disablePredict}>
        {loading ? 'Predicting...' : 'Predict'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {predictedExpense !== null && !error && (
        <p>Predicted Expense: ₹{predictedExpense.toFixed(2)}</p>
      )}
    </div>
  );
};

export default ExpensePredictor;
