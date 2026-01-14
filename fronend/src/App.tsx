import { useState, useEffect } from 'react';
import './App.css';
import TransactionForm from './components/TransactionForm';
import SpendingChart from './components/SpendingChart';

interface Transaction {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
}

const API_URL = 'http://127.0.0.1:8000';

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<number>(0);
  const [budgetInput, setBudgetInput] = useState<string>('');
  const [alert, setAlert] = useState<string>('');
  const [features, setFeatures] = useState<number[]>(Array(8).fill(0));
  const [prediction, setPrediction] = useState<number | null>(null);

  // Surplus + investment suggestion state
  const [surplus, setSurplus] = useState<number>(0);
  const [fdSuggestion, setFdSuggestion] = useState<number>(0);
  const [sipSuggestion, setSipSuggestion] = useState<number>(0);
  const [emergencySuggestion, setEmergencySuggestion] = useState<number>(0);
  const [showPlans, setShowPlans] = useState<boolean>(false);

  // Smart Saving Goal Advisor state
  const [goalName, setGoalName] = useState<string>('');
  const [goalAmount, setGoalAmount] = useState<number>(0);
  const [goalMonths, setGoalMonths] = useState<number>(0);
  const [requiredPerMonth, setRequiredPerMonth] = useState<number>(0);

  // Overspending alert + surplus + suggestion logic
  useEffect(() => {
    const totalSpent = transactions.reduce((a, t) => a + t.amount, 0);
    const remaining = budget - totalSpent;
    const positiveSurplus = remaining > 0 ? remaining : 0;

    setSurplus(positiveSurplus);

    if (budget > 0 && totalSpent > budget) {
      setAlert('Warning: You are overspending your budget!');
    } else {
      setAlert('');
    }

    if (positiveSurplus > 0) {
      setFdSuggestion(positiveSurplus * 0.6);
      setSipSuggestion(positiveSurplus * 0.3);
      setEmergencySuggestion(positiveSurplus * 0.1);
    } else {
      setFdSuggestion(0);
      setSipSuggestion(0);
      setEmergencySuggestion(0);
      setShowPlans(false);
    }
  }, [transactions, budget]);

  // Fetch all transactions on mount
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const ym = `${year}-${month}`;

    fetch(`${API_URL}/transactions/${ym}`)
      .then(res => res.json())
      .then(data => {
        const mapped = data.map((tx: any) => ({
          id: tx.id,
          description: tx.description,
          amount: tx.amount,
          category: tx.category,
          date: tx.date,
        }));
        setTransactions(mapped);
      })
      .catch(console.error);
  }, []);

  // Autofill function to fetch from backend /autofill/{year_month}
  const autoFillFeatures = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const currentMonthStr = `${year}-${String(month).padStart(2, '0')}`;

    try {
      const response = await fetch(`${API_URL}/autofill/${currentMonthStr}`);
      const data = await response.json();

      if (data.features && Array.isArray(data.features) && data.features.length === 8) {
        setFeatures(data.features);
      } else {
        console.error('Invalid features data from backend autofill', data);
      }
    } catch (error) {
      console.error('Failed to fetch autofill features:', error);
    }
  };

  const handleAddTransaction = (description: string, amount: number, category: string, date: string) => {
    fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, amount, category, date }),
    })
      .then(res => res.json())
      .then(newTx => {
        setTransactions([{ id: newTx.id, description, amount, category, date }, ...transactions]);
      })
      .catch(console.error);
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = parseFloat(value);
    setFeatures(newFeatures);
  };

  const handlePredict = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features }),
    })
      .then(res => res.json())
      .then(data => setPrediction(data.predicted_expense))
      .catch(console.error);
  };

  // Smart Saving Goal Advisor calculation
  const handleSetGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim() || goalAmount <= 0 || goalMonths <= 0) return;
    setRequiredPerMonth(goalAmount / goalMonths);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h1>FinAI Personal Finance Tracker</h1>
      <p>
        Budget smart. Track expenses. Predict the future.
        <br />
        Welcome to your AI-powered money management dashboard!
      </p>

      <div style={{ marginBottom: '2rem' }}>
        <input
          type="number"
          placeholder="Set monthly budget ($)"
          value={budgetInput}
          onChange={(e) => setBudgetInput(e.target.value)}
          style={{ marginRight: '1rem', padding: '0.5rem' }}
        />
        <button
          onClick={() => {
            const amount = Number(budgetInput);
            if (amount > 0) {
              setBudget(amount);
              setAlert('');
            }
          }}
        >
          Set Budget
        </button>
      </div>

      <TransactionForm onAddTransaction={handleAddTransaction} />

      <div style={{ margin: '2rem 0' }}>
        <h2>Budget Summary</h2>
        <p>Total Spent: ${transactions.reduce((a, t) => a + t.amount, 0).toFixed(2)}</p>
        <p>Budget: ${budget.toFixed(2)}</p>
        <p>
          Remaining:{' '}
          {budget > 0
            ? `$${(budget - transactions.reduce((a, t) => a + t.amount, 0)).toFixed(2)}`
            : 'Set your budget to see remaining amount'}
        </p>
        {alert && <p style={{ color: 'red', fontWeight: 'bold' }}>{alert}</p>}
        {budget === 0 && (
          <p style={{ color: 'orange', fontWeight: 'bold' }}>
            Please set your monthly budget above.
          </p>
        )}

        <button
          onClick={() => setShowPlans(!showPlans)}
          disabled={surplus <= 0}
          style={{
            marginTop: '0.5rem',
            padding: '0.4em 1em',
            borderRadius: '6px',
            border: 'none',
            background: surplus > 0 ? '#4caf50' : '#888',
            color: 'white',
            cursor: surplus > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          {showPlans ? 'Hide Investment Plan' : 'Show Investment Plan'}
        </button>

        {showPlans && surplus > 0 && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              border: '1px dashed #4caf50',
              borderRadius: '8px',
            }}
          >
            <h3>Suggested Investment Split for Surplus</h3>
            <p>Surplus available: ₹{surplus.toFixed(2)}</p>
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
              <li>• 60% in safe deposits (FD-like): ₹{fdSuggestion.toFixed(2)}</li>
              <li>• 30% in SIP / investment plans: ₹{sipSuggestion.toFixed(2)}</li>
              <li>• 10% kept as emergency fund: ₹{emergencySuggestion.toFixed(2)}</li>
            </ul>
            <small style={{ fontSize: '0.8rem' }}>
              This is a simple suggestion, not real financial advice.
            </small>
          </div>
        )}
      </div>

      {/* Smart Saving Goal Advisor */}
      <div style={{ margin: '2rem 0', maxWidth: '500px', marginInline: 'auto', textAlign: 'left' }}>
        <h2 style={{ textAlign: 'center' }}>Smart Saving Goal Advisor</h2>
        <form onSubmit={handleSetGoal}>
          <label style={{ display: 'block', marginBottom: '0.8rem' }}>
            <b>Goal Name</b>
            <br />
            <small>Example: New phone, trip, laptop</small>
            <br />
            <input
              type="text"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              style={{ width: '100%', padding: '0.5em', marginTop: '0.3em' }}
            />
          </label>
          <label style={{ display: 'block', marginBottom: '0.8rem' }}>
            <b>Total Goal Amount (₹)</b>
            <br />
            <input
              type="number"
              value={goalAmount || ''}
              onChange={(e) => setGoalAmount(Number(e.target.value))}
              style={{ width: '100%', padding: '0.5em', marginTop: '0.3em' }}
            />
          </label>
          <label style={{ display: 'block', marginBottom: '0.8rem' }}>
            <b>Months to Reach Goal</b>
            <br />
            <input
              type="number"
              value={goalMonths || ''}
              onChange={(e) => setGoalMonths(Number(e.target.value))}
              style={{ width: '100%', padding: '0.5em', marginTop: '0.3em' }}
            />
          </label>
          <button
            type="submit"
            style={{
              marginTop: '0.5rem',
              padding: '0.6em 1.3em',
              background: '#646cff',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: 600,
              fontSize: '1em',
              cursor: 'pointer',
            }}
          >
            Set Goal
          </button>
        </form>

        {requiredPerMonth > 0 && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: '8px',
              background: '#1f2933',
              color: '#fafafa',
            }}
          >
            <p>
              To reach <b>{goalName || 'your goal'}</b> of ₹{goalAmount.toFixed(2)} in {goalMonths}{' '}
              month(s), you need to save about <b>₹{requiredPerMonth.toFixed(2)}</b> per month.
            </p>

            {surplus > 0 && (
              <p>
                Current surplus this month: ₹{surplus.toFixed(2)}.{' '}
                {surplus >= requiredPerMonth
                  ? 'Great! Your surplus is enough to stay on track for this goal.'
                  : 'Try to increase your surplus to stay on track for this goal.'}
              </p>
            )}

            {surplus <= 0 && (
              <p>
                You have no surplus this month. Try reducing expenses or increasing your budget to
                start saving for this goal.
              </p>
            )}
          </div>
        )}
      </div>

      <h2>Transactions</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {transactions.map(({ id, description, amount, category, date }) => (
          <li key={id} style={{ marginBottom: '0.5rem', position: 'relative' }}>
            {category} - {description}: ${amount.toFixed(2)} - {new Date(date).toLocaleDateString()}
          </li>
        ))}
      </ul>

      <SpendingChart transactions={transactions} />

      <div
        style={{
          marginTop: '3rem',
          maxWidth: '500px',
          margin: 'auto',
          textAlign: 'left',
          background: '#292929',
          borderRadius: 16,
          padding: '2em',
          color: '#fafafa',
        }}
      >
        <h2 style={{ textAlign: 'center' }}>Predict Monthly Expense</h2>

        <button
          onClick={autoFillFeatures}
          style={{
            marginBottom: '1rem',
            padding: '0.6em 1.3em',
            background: '#646cff',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 600,
            fontSize: '1em',
            marginRight: '1em',
            cursor: 'pointer',
          }}
        >
          Auto-Fill Features
        </button>

        <form onSubmit={handlePredict}>
          {[
            { idx: 0, label: 'Total Expense', note: 'The total money spent this month (sum of all expenses)' },
            { idx: 1, label: 'Transaction Count', note: 'Number of expense transactions entered' },
            { idx: 2, label: 'Food Total', note: 'Amount spent on food (meals, groceries, etc.)' },
            { idx: 3, label: 'Rent Total', note: 'Amount spent on rent this month' },
            { idx: 4, label: 'Travel Total', note: 'Amount spent on travel/transportation' },
            { idx: 5, label: 'Other Total', note: 'Amount spent on other categories' },
            { idx: 6, label: 'Month (numeric)', note: 'Current month as a number (e.g., 11 for November)' },
            { idx: 7, label: 'Percent Change', note: 'Percent change ratio compared to last month (e.g., -0.2 for -20%)' },
          ].map(({ idx, label, note }) => (
            <label key={idx} style={{ display: 'block', marginBottom: '0.8rem' }}>
              <b>{label}</b>
              <br />
              <small>{note}</small>
              <br />
              <input
                type="number"
                value={features[idx]}
                onChange={(e) => handleFeatureChange(idx, e.target.value)}
                style={{ width: '100%', padding: '0.5em', marginTop: '0.3em' }}
              />
            </label>
          ))}
          <button
            type="submit"
            style={{
              marginTop: '1rem',
              padding: '0.6em 1.3em',
              background: '#646cff',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: 600,
              fontSize: '1em',
              cursor: 'pointer',
            }}
          >
            Predict
          </button>
        </form>

        {prediction !== null && (
          <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>
            Predicted Expense: ${prediction.toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
