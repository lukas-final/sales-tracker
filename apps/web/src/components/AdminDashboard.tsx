'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  Calendar,
  BarChart3,
  UserCheck,
  Clock
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface CloserStats {
  id: string;
  name: string;
  email: string;
  totalCalls: number;
  totalWins: number;
  totalRevenue: number;
  conversionRate: number;
}

interface TodayDeal {
  id: string;
  value: number;
  closer: string;
  closedAt: string;
}

interface DashboardData {
  closerRanking: CloserStats[];
  todayStats: {
    totalLeads: number;
    totalCalls: number;
    totalWins: number;
    totalRevenue: number;
    showUpRate: number;
    conversionRate: number;
  };
  todayCashflow: number;
  showUpRate: number;
  todayDeals: TodayDeal[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    fetchDashboardData();
  }, [timeframe]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/dashboard`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Fehler beim Laden der Dashboard-Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDailyStats = async () => {
    try {
      await fetch(`${API_URL}/api/admin/update-daily-stats`, {
        method: 'POST'
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Stats:', error);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const stats = data.todayStats;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Die Wahrheit über dein Sales-Team</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <div className="flex space-x-2">
            {['today', 'week', 'month'].map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  timeframe === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {period === 'today' ? 'Heute' : period === 'week' ? 'Woche' : 'Monat'}
              </button>
            ))}
          </div>
          <button
            onClick={updateDailyStats}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            Stats aktualisieren
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Leads</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalLeads}</h3>
          <p className="text-sm text-gray-500 mt-1">Heute eingegangen</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Show-Up Rate</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{data.showUpRate.toFixed(1)}%</h3>
          <p className="text-sm text-gray-500 mt-1">Erschienen vs. No-Show</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Conversion</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</h3>
          <p className="text-sm text-gray-500 mt-1">Calls → Wins</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Cashflow</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(data.todayCashflow)}
          </h3>
          <p className="text-sm text-gray-500 mt-1">Heute fakturiert</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Closer Ranking */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Closer Ranking</h2>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Closer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Calls</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Wins</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Conversion</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Umsatz</th>
                </tr>
              </thead>
              <tbody>
                {data.closerRanking.map((closer, index) => (
                  <tr key={closer.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{closer.name}</p>
                          <p className="text-sm text-gray-500">{closer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium">{closer.totalCalls}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-green-600">{closer.totalWins}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">{closer.conversionRate.toFixed(1)}%</span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${Math.min(closer.conversionRate, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-gray-900">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(closer.totalRevenue)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Heutige Deals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Heutige Deals</h2>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {data.todayDeals.length > 0 ? (
              data.todayDeals.map((deal) => (
                <div key={deal.id} className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{deal.closer}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(deal.closedAt).toLocaleTimeString('de-DE', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(deal.value)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Noch keine Deals heute</p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{stats.totalCalls}</p>
                <p className="text-sm text-gray-500">Calls</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{stats.totalWins}</p>
                <p className="text-sm text-gray-500">Wins</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center mb-3">
            <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="font-medium text-gray-900">Gesamtumsatz</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(stats.totalRevenue)}
          </p>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center mb-3">
            <Clock className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="font-medium text-gray-900">Durchschnittliche Call-Dauer</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">24 min</p>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center mb-3">
            <Target className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="font-medium text-gray-900">ROAS (Return on Ad Spend)</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">3.2x</p>
        </div>
      </div>
    </div>
  );
}