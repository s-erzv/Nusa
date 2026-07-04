import { useEffect, useState } from 'react';
import { LogOut, Wallet, ArrowUpRight, ArrowDownRight, Activity, CreditCard, Banknote, Landmark, FileText, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ThemeToggle } from '../../components/ThemeToggle';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface DashboardProps {
  onSignOut: () => void;
}

export const Dashboard = ({ onSignOut }: DashboardProps) => {
  const [wallets, setWallets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categoryBudgets, setCategoryBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Budget Modal State
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      try {
        const response = await fetch('/api/dashboard/data', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const json = await response.json();
        if (json.success && json.data) {
          setWallets(json.data.wallets);
          setTransactions(json.data.transactions);
          setCategoryBudgets(json.data.categoryBudgets || []);
        }
      } catch (e) {
        console.error('Error fetching dashboard data:', e);
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleSaveBudget = async () => {
    if (!newBudgetCategory || !newBudgetAmount) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const res = await fetch('/api/dashboard/category-budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          category: newBudgetCategory,
          amount: Number(newBudgetAmount)
        })
      });
      const json = await res.json();
      if (json.success) {
        const existingIdx = categoryBudgets.findIndex(b => b.category === newBudgetCategory);
        if (existingIdx > -1) {
          const newBudgets = [...categoryBudgets];
          newBudgets[existingIdx] = json.data;
          setCategoryBudgets(newBudgets);
        } else {
          setCategoryBudgets([...categoryBudgets, json.data]);
        }
        setIsAddingBudget(false);
        setNewBudgetCategory('');
        setNewBudgetAmount('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- Calculations ---
  const totalBalance = wallets.reduce((acc, w) => acc + Number(w.balance), 0);
  
  // Calculate Income & Expense (assuming 'income' and 'expense' are the types)
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
  const netIncome = totalIncome - totalExpense;

  // Prepare data for Expense/Income Chart
  const last7Days = transactions.slice(0, 50).reverse().reduce((acc, t) => {
    const dateStr = format(parseISO(t.created_at || t.date || new Date().toISOString()), 'MMM dd');
    if (!acc[dateStr]) acc[dateStr] = { date: dateStr, income: 0, expense: 0 };
    if (t.type === 'income') acc[dateStr].income += Number(t.amount);
    if (t.type === 'expense') acc[dateStr].expense += Number(t.amount);
    return acc;
  }, {} as Record<string, any>);
  const areaData = Object.values(last7Days);

  // Prepare data for Category Pie Chart
  const expenseByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);
  
  const pieData = Object.keys(expenseByCategory).map(key => ({
    name: key,
    value: expenseByCategory[key]
  }));
  const COLORS = ['#FF7A00', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6'];

  const getWalletIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'bank': return <Landmark className="w-5 h-5" />;
      case 'ewallet': return <CreditCard className="w-5 h-5" />;
      case 'cash': return <Banknote className="w-5 h-5" />;
      default: return <Wallet className="w-5 h-5" />;
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Laporan Keuangan Nusa', 14, 22);
    
    // Summary
    doc.setFontSize(12);
    doc.text(`Total Saldo: Rp ${totalBalance.toLocaleString('id-ID')}`, 14, 32);
    doc.text(`Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}`, 14, 38);
    doc.text(`Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}`, 14, 44);

    // Table
    const tableColumn = ["Tanggal", "Deskripsi", "Kategori", "Dompet", "Nominal", "Tipe"];
    const tableRows = transactions.map(t => [
      format(parseISO(t.created_at || t.date || new Date().toISOString()), 'dd/MM/yyyy HH:mm'),
      t.description || '-',
      t.category,
      t.payment_method || '-',
      `Rp ${Number(t.amount).toLocaleString('id-ID')}`,
      t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [255, 122, 0] } // Nusa Orange
    });

    doc.save(`Nusa_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
  };

  const handleExportExcel = () => {
    const exportData = transactions.map(t => ({
      Tanggal: format(parseISO(t.created_at || t.date || new Date().toISOString()), 'dd/MM/yyyy HH:mm'),
      Deskripsi: t.description || '-',
      Kategori: t.category,
      Dompet: t.payment_method || '-',
      Nominal: Number(t.amount),
      Tipe: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi");
    
    // Auto-size columns slightly
    const wscols = [
      { wch: 18 }, // Tanggal
      { wch: 30 }, // Deskripsi
      { wch: 15 }, // Kategori
      { wch: 15 }, // Dompet
      { wch: 15 }, // Nominal
      { wch: 12 }, // Tipe
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Nusa_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text transition-colors duration-500 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Nusa Logo" className="h-8" />
            <span className="text-xl font-bold text-[#FF7A00] dark:text-white hidden sm:block">Nusa Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* Financial Summary */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Financial Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface/50 backdrop-blur-xl border border-border p-5 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-sm font-medium text-text-muted mb-1 relative z-10">Total Balance</p>
              <p className="text-3xl font-bold text-text relative z-10">Rp {totalBalance.toLocaleString('id-ID')}</p>
            </div>
            
            <div className="bg-surface/50 backdrop-blur-xl border border-border p-5 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-2 mb-1 relative z-10">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <p className="text-sm font-medium text-text-muted">Total Income</p>
              </div>
              <p className="text-3xl font-bold text-text relative z-10">Rp {totalIncome.toLocaleString('id-ID')}</p>
            </div>

            <div className="bg-surface/50 backdrop-blur-xl border border-border p-5 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-2 mb-1 relative z-10">
                <ArrowDownRight className="w-4 h-4 text-red-500" />
                <p className="text-sm font-medium text-text-muted">Total Expense</p>
              </div>
              <p className="text-3xl font-bold text-text relative z-10">Rp {totalExpense.toLocaleString('id-ID')}</p>
            </div>

            <div className="bg-surface/50 backdrop-blur-xl border border-border p-5 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-2 mb-1 relative z-10">
                <Activity className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-medium text-text-muted">Net Cash Flow</p>
              </div>
              <p className={`text-3xl font-bold relative z-10 ${netIncome >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {netIncome >= 0 ? '+' : ''}Rp {netIncome.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </section>

        {/* Wallets Showcase */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Wallets</h2>
            <span className="text-sm text-text-muted">{wallets.length} Active</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {wallets.length === 0 ? (
              <div className="col-span-full p-8 text-center border border-dashed border-border rounded-2xl text-text-muted">
                No wallets found. Chat with Nusa AI to add one!
              </div>
            ) : (
              wallets.map((w) => (
                <div key={w.id} className="bg-gradient-to-br from-surface to-background border border-border p-5 rounded-2xl flex flex-col justify-between hover:border-primary/50 transition-colors shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {getWalletIcon(w.type)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-text">{w.name}</h4>
                        <span className="text-xs text-text-muted uppercase tracking-wider">{w.type}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text">Rp {Number(w.balance).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Category Budgets */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Category Budgets</h2>
            <button 
              onClick={() => setIsAddingBudget(!isAddingBudget)}
              className="text-sm px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              {isAddingBudget ? 'Cancel' : 'Set Budget'}
            </button>
          </div>
          
          {isAddingBudget && (
            <div className="bg-surface/50 backdrop-blur-xl border border-border p-5 rounded-2xl mb-4 flex flex-col sm:flex-row gap-4 items-end shadow-sm animate-in fade-in slide-in-from-top-4">
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-text-muted mb-1">Category Name (e.g. Food, Transport)</label>
                <input 
                  type="text" 
                  value={newBudgetCategory}
                  onChange={(e) => setNewBudgetCategory(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:border-primary transition-colors"
                  placeholder="Category..."
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-text-muted mb-1">Budget Limit (Rp)</label>
                <input 
                  type="number" 
                  value={newBudgetAmount}
                  onChange={(e) => setNewBudgetAmount(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:border-primary transition-colors"
                  placeholder="Amount..."
                />
              </div>
              <button 
                onClick={handleSaveBudget}
                className="w-full sm:w-auto px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                Save
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryBudgets.length === 0 && !isAddingBudget ? (
              <div className="col-span-full p-8 text-center border border-dashed border-border rounded-2xl text-text-muted">
                No category budgets set. Click 'Set Budget' to create one!
              </div>
            ) : (
              categoryBudgets.map((b) => {
                const spent = expenseByCategory[b.category] || 0;
                const limit = Number(b.amount);
                const percent = Math.min((spent / limit) * 100, 100);
                const isWarning = percent >= 80;
                const isDanger = percent >= 100;
                
                let progressColor = 'bg-primary';
                if (isDanger) progressColor = 'bg-red-500';
                else if (isWarning) progressColor = 'bg-yellow-500';

                return (
                  <div key={b.id} className="bg-surface/50 backdrop-blur-xl border border-border p-5 rounded-2xl flex flex-col justify-between hover:border-primary/50 transition-colors shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-text">{b.category}</h4>
                      <span className="text-xs font-medium text-text-muted">
                        {percent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2.5 mb-3 overflow-hidden">
                      <div className={`h-2.5 rounded-full ${progressColor} transition-all duration-500`} style={{ width: `${percent}%` }}></div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Spent: <span className="text-text font-medium">Rp {spent.toLocaleString('id-ID')}</span></span>
                      <span className="text-text-muted">Limit: Rp {limit.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Charts Row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Area Chart */}
          <div className="lg:col-span-2 bg-surface/50 backdrop-blur-xl border border-border p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-semibold mb-6">Cash Flow Trend</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-text)' }}
                    itemStyle={{ color: 'var(--color-text)' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-surface/50 backdrop-blur-xl border border-border p-6 rounded-2xl flex flex-col shadow-sm">
            <h3 className="text-lg font-semibold mb-6">Expenses by Category</h3>
            <div className="flex-1 min-h-[250px] w-full">
              {pieData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-text-muted text-sm">
                  No expense data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-text)' }}
                      itemStyle={{ color: 'var(--color-text)' }}
                      formatter={(value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        {/* Complete Transactions Table */}
        <section>
          <div className="bg-surface/50 backdrop-blur-xl border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-surface/90 backdrop-blur-md z-10">
              <h3 className="text-lg font-semibold">Transaction History</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </button>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-500 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-colors border border-green-500/20"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </button>
                <span className="text-sm font-medium px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/20">
                  {transactions.length} Records
                </span>
              </div>
            </div>
            
            {/* Scrollable Container */}
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-sm relative">
                <thead className="bg-black/5 dark:bg-white/5 text-text-muted sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Description</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Wallet</th>
                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-text-muted whitespace-nowrap">
                          {format(parseISO(t.created_at || t.date || new Date().toISOString()), 'MMM dd, yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 font-medium text-text max-w-xs truncate">
                          {t.description || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-black/5 dark:bg-white/10 rounded-md text-xs uppercase tracking-wider">
                            {t.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-text-muted">
                          {t.payment_method || '-'}
                        </td>
                        <td className="px-6 py-4 text-right font-medium">
                          <div className={`flex items-center justify-end gap-1 ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                            {t.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            Rp {Number(t.amount).toLocaleString('id-ID')}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};
