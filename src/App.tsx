/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  History, 
  LayoutDashboard, 
  Settings, 
  ChevronRight, 
  Utensils, 
  ShoppingCart, 
  Zap, 
  Car, 
  Film,
  X,
  CreditCard,
  UserPlus,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface Member {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  payerId: string;
  participantIds: string[];
  date: string;
  category?: string;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

// --- Icons Mapping ---

const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'food': return <Utensils className="w-5 h-5" />;
    case 'groceries': return <ShoppingCart className="w-5 h-5" />;
    case 'utilities': return <Zap className="w-5 h-5" />;
    case 'transport': return <Car className="w-5 h-5" />;
    case 'entertainment': return <Film className="w-5 h-5" />;
    default: return <CreditCard className="w-5 h-5" />;
  }
};

// --- Initialization ---

const INITIAL_MEMBERS: Member[] = [
  { id: '1', name: 'You', email: 'you@example.com' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah.j@email.com' },
  { id: '3', name: 'Marcus Chen', email: 'm.chen@studio.com' },
  { id: '4', name: 'Elena Rodriguez', email: 'elena.rod@design.co' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'history'>('dashboard');
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('splitease_members');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('splitease_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem('splitease_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('splitease_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // --- Calculations ---

  const balanceStats = useMemo(() => {
    const netBalances: Record<string, number> = {};
    members.forEach(m => netBalances[m.id] = 0);

    expenses.forEach(exp => {
      const splitAmount = exp.amount / exp.participantIds.length;
      
      // Payer gets credit
      netBalances[exp.payerId] += exp.amount;
      
      // Participants get "debt"
      exp.participantIds.forEach(pid => {
        netBalances[pid] -= splitAmount;
      });
    });

    const totalOwed = Math.max(0, netBalances['1']); // What is owed TO you
    const totalOwe = Math.max(0, -netBalances['1']); // What you OWE

    // Settlement algorithm (Who owes whom)
    const settlements: Settlement[] = [];
    const debtors = members
      .map(m => ({ id: m.id, balance: netBalances[m.id] }))
      .filter(m => m.balance < -0.01)
      .sort((a, b) => a.balance - b.balance);
      
    const creditors = members
      .map(m => ({ id: m.id, balance: netBalances[m.id] }))
      .filter(m => m.balance > 0.01)
      .sort((a, b) => b.balance - a.balance);

    const d = [...debtors];
    const c = [...creditors];

    while (d.length > 0 && c.length > 0) {
      const debtor = d[0];
      const creditor = c[0];
      const amount = Math.min(Math.abs(debtor.balance), creditor.balance);

      settlements.push({
        from: debtor.id,
        to: creditor.id,
        amount: amount
      });

      debtor.balance += amount;
      creditor.balance -= amount;

      if (Math.abs(debtor.balance) < 0.01) d.shift();
      if (Math.abs(creditor.balance) < 0.01) c.shift();
    }

    return { totalOwe, totalOwed, settlements, netBalances };
  }, [expenses, members]);

  // --- Actions ---

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = { ...expense, id: Date.now().toString() };
    setExpenses([newExpense, ...expenses]);
    setActiveTab('dashboard');
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const clearData = () => {
    if (confirm('Clear all data?')) {
      setExpenses([]);
      setMembers(INITIAL_MEMBERS);
    }
  };

  return (
    <div className="min-h-screen font-sans text-slate-900 bg-fixed bg-[radial-gradient(circle_at_top_left,_#ffdbcf_0%,_#fbf9f8_40%,_#caebcc_100%)]">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-6 h-16 bg-white/40 backdrop-blur-xl border-b border-white/30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-400 bg-orange-100 flex items-center justify-center">
             <LayoutDashboard className="text-orange-500 w-6 h-6" />
          </div>
          <span className="font-extrabold tracking-tight text-xl text-orange-500">SplitEase</span>
        </div>
        <button onClick={clearData} className="p-2 rounded-full hover:bg-white/40 transition-all text-slate-500 active:scale-95">
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto min-h-screen">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Hero Statistics */}
              <section className="glass-card rounded-[2rem] p-8 text-center flex flex-col items-center bg-white/60 backdrop-blur-xl border border-white/30 shadow-2xl shadow-black/5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Current Standing</span>
                <h1 className="text-4xl font-black text-slate-900 mb-6">
                  {balanceStats.totalOwed >= balanceStats.totalOwe 
                    ? `You are owed $${(balanceStats.totalOwed - balanceStats.totalOwe).toFixed(2)}`
                    : `You owe $${(balanceStats.totalOwe - balanceStats.totalOwed).toFixed(2)}`}
                </h1>
                
                <div className="flex flex-wrap justify-center gap-4 w-full mt-2">
                  <div className="flex-1 min-w-[140px] p-6 rounded-2xl bg-emerald-500/10 border border-white/40 flex flex-col items-center">
                    <span className="text-xs font-semibold text-emerald-600 mb-1">Total Owed</span>
                    <span className="text-2xl font-bold text-emerald-700">${balanceStats.totalOwed.toFixed(2)}</span>
                  </div>
                  <div className="flex-1 min-w-[140px] p-6 rounded-2xl bg-rose-500/10 border border-white/40 flex flex-col items-center">
                    <span className="text-xs font-semibold text-rose-600 mb-1">Total Owe</span>
                    <span className="text-2xl font-bold text-rose-700">${balanceStats.totalOwe.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveTab('add')}
                  className="mt-8 bg-orange-500 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-orange-500/20 flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all w-full md:w-auto justify-center"
                >
                  <PlusCircle className="w-5 h-5" />
                  Add New Expense
                </button>
              </section>

              {/* Settlement Suggestions */}
              <section className="glass-card rounded-[2rem] p-8 bg-white/40 border border-white/30">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <ChevronRight className="w-5 h-5 text-orange-500" />
                  Quick Summary
                </h2>
                <div className="space-y-4">
                  {balanceStats.settlements.length === 0 ? (
                    <p className="text-slate-500 text-center py-4 italic">No pending settlements. You're all square!</p>
                  ) : (
                    balanceStats.settlements.filter(s => s.from === '1' || s.to === '1').map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/30 border border-white/20">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${s.from === '1' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {s.from === '1' ? 'OWE' : 'GET'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-700">
                              {s.from === '1' ? (
                                <>Pay <span className="text-slate-900">{members.find(m => m.id === s.to)?.name}</span></>
                              ) : (
                                <><span className="text-slate-900">{members.find(m => m.id === s.from)?.name}</span> owes you</>
                              )}
                            </p>
                          </div>
                        </div>
                        <span className={`text-lg font-black ${s.from === '1' ? 'text-rose-600' : 'text-emerald-600'}`}>
                          ${s.amount.toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Recent Activity */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-bold">Recent Activity</h2>
                  <button onClick={() => setActiveTab('history')} className="text-sm font-bold text-orange-500 hover:underline">View all</button>
                </div>
                <div className="space-y-3">
                  {expenses.slice(0, 5).map(exp => (
                    <div key={exp.id} className="glass-card rounded-2xl p-4 flex items-center justify-between bg-white/50 border border-white/30 group hover:bg-white/70 transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center text-slate-500">
                          {getCategoryIcon(exp.category)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">{exp.title}</h3>
                          <p className="text-xs font-semibold text-slate-400">
                            {exp.payerId === '1' ? 'You paid' : `${members.find(m => m.id === exp.payerId)?.name} paid`} ${exp.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-lg ${exp.payerId === '1' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {exp.payerId === '1' ? '+' : '-'}${Math.abs(exp.amount / exp.participantIds.length).toFixed(2)}
                        </p>
                        <p className="text-[10px] uppercase font-black text-slate-300 tracking-tighter">
                          {exp.payerId === '1' ? 'Lent' : 'Owe'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <div className="text-center py-12 glass-card rounded-2xl bg-white/20 border-dashed border-2 border-white/40">
                      <p className="text-slate-400 font-medium">No expenses recorded yet.</p>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'add' && (
            <motion.div
              key="add"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <AddExpenseForm 
                members={members} 
                onSubmit={addExpense} 
                onCancel={() => setActiveTab('dashboard')} 
              />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <header className="flex items-center gap-4 px-2">
                <button onClick={() => setActiveTab('dashboard')} className="p-2 rounded-full hover:bg-white/40 transition-all">
                  <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <h2 className="text-2xl font-black">History</h2>
              </header>
              <div className="space-y-4">
                {expenses.map(exp => (
                  <div key={exp.id} className="glass-card rounded-[1.5rem] p-6 bg-white/50 border border-white/30 flex items-center justify-between relative overflow-hidden group">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white/80 shadow-inner flex items-center justify-center text-orange-500">
                        {getCategoryIcon(exp.category)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-800">{exp.title}</h3>
                        <p className="text-sm text-slate-500 font-medium">
                          {new Date(exp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • Paid by {members.find(m => m.id === exp.payerId)?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-black text-xl text-slate-900">${exp.amount.toFixed(2)}</p>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total</p>
                      </div>
                      <button 
                        onClick={() => deleteExpense(exp.id)}
                        className="p-2 text-rose-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-rose-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {expenses.length === 0 && (
                   <div className="text-center py-20 bg-white/10 rounded-[2rem] border-2 border-dashed border-white/30">
                     <p className="text-slate-400 font-bold">Your ledger is empty.</p>
                   </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Tabs Navigation */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 py-4 bg-white/60 backdrop-blur-2xl rounded-t-[2.5rem] border-t border-white/30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:hidden">
        <NavButton 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
          icon={<LayoutDashboard />} 
          label="Dashboard" 
        />
        <NavButton 
          active={activeTab === 'add'} 
          onClick={() => setActiveTab('add')} 
          icon={<PlusCircle size={32} />} 
          label="Add" 
          primary 
        />
        <NavButton 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')} 
          icon={<History />} 
          label="History" 
        />
      </nav>

      {/* Desktop Navigation Pin */}
      <div className="hidden md:flex fixed left-8 top-1/2 -translate-y-1/2 flex-col gap-6 p-4 glass-card bg-white/60 backdrop-blur-xl rounded-full border border-white/40 shadow-2xl">
        <DesktopNavIcon active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}><LayoutDashboard /></DesktopNavIcon>
        <DesktopNavIcon active={activeTab === 'add'} onClick={() => setActiveTab('add')}><PlusCircle /></DesktopNavIcon>
        <DesktopNavIcon active={activeTab === 'history'} onClick={() => setActiveTab('history')}><History /></DesktopNavIcon>
      </div>
    </div>
  );
}

// --- Sub-components ---

function NavButton({ active, onClick, icon, label, primary = false }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, primary?: boolean }) {
  if (primary) {
    return (
      <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-3 rounded-full transition-all active:scale-90 ${active ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/30' : 'text-slate-400'}`}
      >
        {icon}
      </button>
    );
  }
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 transition-all active:scale-95 ${active ? 'text-orange-500' : 'text-slate-400'}`}
    >
      <div className="w-6 h-6">{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function DesktopNavIcon({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${active ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-110' : 'text-slate-500 hover:bg-white/40'}`}
    >
      {React.cloneElement(children as React.ReactElement, { className: 'w-6 h-6' })}
    </button>
  );
}

function AddExpenseForm({ members, onSubmit, onCancel }: { members: Member[], onSubmit: (exp: Omit<Expense, 'id'>) => void, onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState('1');
  const [participantIds, setParticipantIds] = useState<string[]>(members.map(m => m.id));
  const [category, setCategory] = useState('general');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || parseFloat(amount) <= 0 || participantIds.length === 0) {
      alert('Please fill out all fields correctly.');
      return;
    }
    onSubmit({
      title,
      amount: parseFloat(amount),
      payerId,
      participantIds,
      date: new Date().toISOString(),
      category
    });
  };

  const toggleParticipant = (id: string) => {
    setParticipantIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const categories = [
    { id: 'general', icon: <CreditCard />, label: 'General' },
    { id: 'food', icon: <Utensils />, label: 'Food' },
    { id: 'groceries', icon: <ShoppingCart />, label: 'Groceries' },
    { id: 'utilities', icon: <Zap />, label: 'Bills' },
    { id: 'transport', icon: <Car />, label: 'Transit' },
    { id: 'entertainment', icon: <Film />, label: 'Fun' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onCancel} className="flex items-center gap-1 text-orange-500 font-bold uppercase text-xs tracking-widest hover:opacity-70 transition-all">
          <ArrowLeft className="w-4 h-4" /> Cancel
        </button>
        <h2 className="text-2xl font-black text-slate-800">Add Expense</h2>
        <div className="w-16" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Picker */}
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border-2 ${category === cat.id ? 'bg-orange-500 border-orange-500 text-white shadow-xl shadow-orange-500/20' : 'bg-white/40 border-white/20 text-slate-400 hover:bg-white/60'}`}
            >
              {cat.icon}
              <span className="text-[10px] font-black tracking-widest uppercase">{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="glass-card rounded-[2rem] p-8 bg-white/60 shadow-2xl border border-white/30 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest ml-1 text-slate-400">What for?</label>
              <input 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-white/30 border border-white/60 rounded-2xl px-6 py-4 text-lg font-bold focus:ring-4 focus:ring-orange-500/10 focus:outline-none focus:border-orange-500 transition-all"
                placeholder="Dinner, Uber, Rent..."
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest ml-1 text-slate-400">How much?</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">$</span>
                <input 
                  type="number" 
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-white/30 border border-white/60 rounded-2xl pl-12 pr-6 py-4 text-lg font-black focus:ring-4 focus:ring-orange-500/10 focus:outline-none focus:border-orange-500 transition-all"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest ml-1 text-slate-400">Paid by</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {members.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPayerId(m.id)}
                  className={`px-4 py-3 rounded-xl border-2 transition-all font-bold text-sm ${payerId === m.id ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'bg-white/40 border-white/20 text-slate-600 hover:bg-white/60'}`}
                >
                  {m.name === 'You' ? 'Me' : m.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Shared with</label>
              <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-3 py-1 rounded-full uppercase">
                {participantIds.length} Selected
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map(m => (
                <label 
                  key={m.id} 
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${participantIds.includes(m.id) ? 'bg-orange-50 border-orange-400 text-orange-900 shadow-sm' : 'bg-white/20 border-white/10 text-slate-400 opacity-60'}`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={participantIds.includes(m.id)}
                      onChange={() => toggleParticipant(m.id)}
                    />
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${participantIds.includes(m.id) ? 'bg-orange-400 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      {m.name.charAt(0)}
                    </div>
                    <span className="font-bold text-sm">{m.name}</span>
                  </div>
                  {participantIds.includes(m.id) && <PlusCircle size={14} className="fill-orange-400 text-white" />}
                </label>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-orange-500 text-white font-black text-xl py-6 rounded-2xl shadow-2xl shadow-orange-500/30 active:scale-95 transition-all hover:brightness-105"
          >
            Save Expense
          </button>
        </div>
      </form>

      {/* Floating Action Tip */}
      <div className="flex items-center gap-3 p-6 rounded-2xl bg-white/40 border border-white/30 text-slate-500 text-sm font-medium">
        <UserPlus className="w-5 h-5 text-orange-400" />
        <p>Tip: You can add more members in the settings (coming soon for LocalStorage MVP).</p>
      </div>
    </div>
  );
}
