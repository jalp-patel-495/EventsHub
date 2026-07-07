import React, { useState } from 'react';
import api from '../api/api';

const AICateringPlanner = () => {
  const [eventType, setEventType] = useState('Wedding');
  const [guests, setGuests] = useState(100);
  const [budget, setBudget] = useState(50000);
  const [cuisine, setCuisine] = useState('Gujarati');
  const [activeTab, setActiveTab] = useState('menu'); // menu, quantity, budget
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Results states
  const [menuData, setMenuData] = useState(null);
  const [quantityData, setQuantityData] = useState(null);
  const [budgetData, setBudgetData] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'menu') {
        const res = await api.post('/api/ai/catering-planner/', {
          action: 'menu_recommendation',
          event_type: eventType,
          guest_count: guests,
          budget: budget,
          cuisine_type: cuisine
        });
        setMenuData(res.data);
      } else if (activeTab === 'quantity') {
        const res = await api.post('/api/ai/catering-planner/', {
          action: 'quantity_estimation',
          event_type: eventType,
          guest_count: guests,
          budget: budget,
          cuisine_type: cuisine
        });
        setQuantityData(res.data);
      } else if (activeTab === 'budget') {
        const res = await api.post('/api/ai/catering-planner/', {
          action: 'budget_planner',
          event_type: eventType,
          guest_count: guests,
          budget: budget,
          cuisine_type: cuisine
        });
        setBudgetData(res.data);
      }
    } catch (err) {
      setError('AI generation failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-brand-primary/10 to-rose-500/10 blur-3xl -z-10 rounded-full" />
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold font-display text-slate-800 dark:text-white">AI Catering Smart Planner</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Estimate plate cost, ingredients, and get menu recommendations instantly</p>
        </div>
        <span className="px-3 py-1 bg-brand-primary/15 text-brand-primary text-xs font-semibold rounded-full">
          AI Powered
        </span>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Event Type</label>
          <select 
            value={eventType} 
            onChange={(e) => setEventType(e.target.value)}
            className="w-full text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          >
            <option>Wedding</option>
            <option>Birthday Party</option>
            <option>Corporate</option>
            <option>Garba Night</option>
            <option>Concert</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Guests</label>
          <input 
            type="number"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className="w-full text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Budget (₹)</label>
          <input 
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Cuisine</label>
          <select 
            value={cuisine} 
            onChange={(e) => setCuisine(e.target.value)}
            className="w-full text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          >
            <option>Gujarati</option>
            <option>Punjabi</option>
            <option>South Indian</option>
            <option>Italian</option>
            <option>Chinese</option>
            <option>Multi-Cuisine</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
        <button 
          onClick={() => { setActiveTab('menu'); setMenuData(null); }}
          className={`flex-1 py-2 text-sm font-semibold transition-all border-b-2 ${activeTab === 'menu' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
        >
          Menu Advisor
        </button>
        <button 
          onClick={() => { setActiveTab('quantity'); setQuantityData(null); }}
          className={`flex-1 py-2 text-sm font-semibold transition-all border-b-2 ${activeTab === 'quantity' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
        >
          Quantity Estimator
        </button>
        <button 
          onClick={() => { setActiveTab('budget'); setBudgetData(null); }}
          className={`flex-1 py-2 text-sm font-semibold transition-all border-b-2 ${activeTab === 'budget' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
        >
          Budget Planner
        </button>
      </div>

      {/* Generate Action Button */}
      <button 
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-brand-primary hover:bg-rose-600 text-white font-medium py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 mb-6"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            Generate AI Estimates
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-100 text-red-700 text-sm rounded-xl mb-4 text-center">
          {error}
        </div>
      )}

      {/* Results Rendering */}
      <div className="min-h-[120px]">
        {/* Menu Recommendation view */}
        {activeTab === 'menu' && menuData && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Appetizers</h4>
                <ul className="text-sm space-y-1 text-slate-700 dark:text-slate-300">
                  {menuData.appetizers?.map((item, idx) => <li key={idx}>• {item}</li>)}
                </ul>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Mains</h4>
                <ul className="text-sm space-y-1 text-slate-700 dark:text-slate-300">
                  {menuData.mains?.map((item, idx) => <li key={idx}>• {item}</li>)}
                </ul>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Desserts</h4>
                <ul className="text-sm space-y-1 text-slate-700 dark:text-slate-300">
                  {menuData.desserts?.map((item, idx) => <li key={idx}>• {item}</li>)}
                </ul>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Beverages</h4>
                <ul className="text-sm space-y-1 text-slate-700 dark:text-slate-300">
                  {menuData.beverages?.map((item, idx) => <li key={idx}>• {item}</li>)}
                </ul>
              </div>
            </div>
            <p className="text-xs italic text-slate-500 dark:text-slate-400 mt-2 bg-brand-primary/5 p-3 rounded-xl">
              💡 {menuData.reason}
            </p>
          </div>
        )}

        {/* Quantity estimation view */}
        {activeTab === 'quantity' && quantityData && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Estimated Raw Ingredients</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quantityData.raw_ingredients?.map((item, idx) => (
                  <div key={idx} className="flex justify-between border-b border-slate-100 dark:border-slate-700 py-1 text-sm">
                    <span className="text-slate-700 dark:text-slate-300">{item.item}</span>
                    <span className="font-semibold text-brand-primary">{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl text-xs space-y-1">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-1">Serving Guidelines</h4>
              {quantityData.portion_sizes?.map((item, idx) => <p key={idx}>• {item}</p>)}
            </div>
          </div>
        )}

        {/* Budget breakdown view */}
        {activeTab === 'budget' && budgetData && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase">Cost Allocations</h4>
              {budgetData.breakdown?.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{item.item} ({item.percentage})</span>
                    <span className="text-slate-900 dark:text-white">{item.cost}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand-primary h-full rounded-full" 
                      style={{ width: item.percentage }} 
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 bg-brand-primary/5 p-3 rounded-xl">
              💡 {budgetData.summary}
            </p>
          </div>
        )}

        {/* Prompt state */}
        {!menuData && !quantityData && !budgetData && (
          <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
            <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <p className="text-sm">Click "Generate AI Estimates" to build plans</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AICateringPlanner;
