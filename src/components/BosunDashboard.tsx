import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Clock, DollarSign, TrendingDown, FileText, Plus, Settings, LogOut } from 'lucide-react';

export default function BosunDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data
  const member = {
    companyName: "Maritime Logistics Corp",
    balance: {
      owed: 2_450_000,
      owing: 3_180_000,
      net: -730_000
    }
  };

  const nextSettlement = {
    time: "5:00 PM",
    date: "Today",
    hoursRemaining: 4.5
  };

  const recentTransactions = [
    { id: 1, counterparty: "Global Shipping Inc", amount: 1_250_000, type: 'owing', date: '2025-01-10', status: 'pending' },
    { id: 2, counterparty: "Pacific Freight Co", amount: 850_000, type: 'owed', date: '2025-01-10', status: 'confirmed' },
    { id: 3, counterparty: "Asia Trade Partners", amount: 1_930_000, type: 'owing', date: '2025-01-09', status: 'confirmed' },
    { id: 4, counterparty: "Mediterranean Logistics", amount: 1_600_000, type: 'owed', date: '2025-01-09', status: 'settled' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="px-8 py-6 flex justify-between items-center">
          <div className="text-2xl font-light tracking-wider">BOSUN</div>
          <div className="flex items-center gap-6">
            <span className="text-sm font-light text-gray-600">{member.companyName}</span>
            <button className="p-2 hover:bg-gray-50 transition-colors">
              <Settings size={20} strokeWidth={1} />
            </button>
            <button className="p-2 hover:bg-gray-50 transition-colors">
              <LogOut size={20} strokeWidth={1} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 border-r border-gray-200 min-h-screen p-8">
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-4 py-3 text-sm font-light transition-colors ${
                activeTab === 'overview' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`w-full text-left px-4 py-3 text-sm font-light transition-colors ${
                activeTab === 'transactions' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('settlements')}
              className={`w-full text-left px-4 py-3 text-sm font-light transition-colors ${
                activeTab === 'settlements' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              Settlements
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`w-full text-left px-4 py-3 text-sm font-light transition-colors ${
                activeTab === 'documents' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              Documents
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeTab === 'overview' && (
            <div className="max-w-6xl">
              {/* Page Header */}
              <div className="flex justify-between items-center mb-12">
                <h1 className="text-4xl font-light">Overview</h1>
                <button className="px-6 py-3 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors flex items-center gap-2">
                  <Plus size={16} />
                  New Transaction
                </button>
              </div>

              {/* Balance Cards */}
              <div className="grid grid-cols-3 gap-6 mb-12">
                <div className="border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-3 text-gray-600">
                    <ArrowDownLeft size={16} strokeWidth={1} />
                    <span className="text-xs font-light uppercase tracking-wider">You Are Owed</span>
                  </div>
                  <div className="text-3xl font-light mb-1">
                    ${member.balance.owed.toLocaleString()}
                  </div>
                  <div className="text-xs font-light text-gray-500">Pending settlement</div>
                </div>

                <div className="border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-3 text-gray-600">
                    <ArrowUpRight size={16} strokeWidth={1} />
                    <span className="text-xs font-light uppercase tracking-wider">You Owe</span>
                  </div>
                  <div className="text-3xl font-light mb-1">
                    ${member.balance.owing.toLocaleString()}
                  </div>
                  <div className="text-xs font-light text-gray-500">Pending settlement</div>
                </div>

                <div className="border border-gray-200 p-6 bg-gray-50">
                  <div className="flex items-center gap-2 mb-3 text-gray-600">
                    <DollarSign size={16} strokeWidth={1} />
                    <span className="text-xs font-light uppercase tracking-wider">Net Position</span>
                  </div>
                  <div className="text-3xl font-light mb-1">
                    ${Math.abs(member.balance.net).toLocaleString()}
                  </div>
                  <div className="text-xs font-light text-gray-500">
                    {member.balance.net < 0 ? 'You will pay' : 'You will receive'}
                  </div>
                </div>
              </div>

              {/* Next Settlement */}
              <div className="border border-gray-200 p-8 mb-12">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3 text-gray-600">
                      <Clock size={16} strokeWidth={1} />
                      <span className="text-xs font-light uppercase tracking-wider">Next Settlement</span>
                    </div>
                    <div className="text-4xl font-light mb-2">{nextSettlement.time}</div>
                    <div className="text-sm font-light text-gray-600 mb-6">{nextSettlement.date}</div>
                    <div className="inline-block px-4 py-2 bg-gray-50 text-sm font-light">
                      {nextSettlement.hoursRemaining} hours remaining
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-light text-gray-600 mb-2">Estimated settlement</div>
                    <div className="text-2xl font-light mb-1">
                      ${Math.abs(member.balance.net).toLocaleString()}
                    </div>
                    <div className="text-xs font-light text-gray-500">
                      Fee: ${(Math.abs(member.balance.net) * 0.008).toLocaleString()} (0.8%)
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-light">Recent Transactions</h2>
                  <button 
                    onClick={() => setActiveTab('transactions')}
                    className="text-sm font-light text-gray-600 hover:text-black transition-colors"
                  >
                    View all
                  </button>
                </div>
                <div className="border border-gray-200">
                  <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="text-xs font-light uppercase tracking-wider text-gray-600">Counterparty</div>
                    <div className="text-xs font-light uppercase tracking-wider text-gray-600">Amount</div>
                    <div className="text-xs font-light uppercase tracking-wider text-gray-600">Date</div>
                    <div className="text-xs font-light uppercase tracking-wider text-gray-600">Status</div>
                  </div>
                  {recentTransactions.map(tx => (
                    <div key={tx.id} className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                      <div className="text-sm font-light">{tx.counterparty}</div>
                      <div className={`text-sm font-light ${tx.type === 'owed' ? 'text-black' : 'text-gray-600'}`}>
                        {tx.type === 'owed' ? '+' : '-'}${tx.amount.toLocaleString()}
                      </div>
                      <div className="text-sm font-light text-gray-600">{tx.date}</div>
                      <div>
                        <span className={`inline-block px-3 py-1 text-xs font-light ${
                          tx.status === 'settled' ? 'bg-gray-100 text-gray-600' :
                          tx.status === 'confirmed' ? 'bg-gray-50 text-black' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h1 className="text-4xl font-light mb-8">Transactions</h1>
              <p className="text-gray-600 font-light">Transaction list view coming soon...</p>
            </div>
          )}

          {activeTab === 'settlements' && (
            <div>
              <h1 className="text-4xl font-light mb-8">Settlements</h1>
              <p className="text-gray-600 font-light">Settlement history coming soon...</p>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <h1 className="text-4xl font-light mb-8">Documents</h1>
              <p className="text-gray-600 font-light">Document repository coming soon...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}