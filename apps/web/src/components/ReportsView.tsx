'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ReportsView() {
  const [closerStats, setCloserStats] = useState<any[]>([]);
  const [noShows, setNoShows] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, noShowsRes, revenueRes] = await Promise.all([
        fetch(`${API_URL}/api/reports/closer-stats`),
        fetch(`${API_URL}/api/reports/no-shows`),
        fetch(`${API_URL}/api/reports/revenue`),
      ]);

      setCloserStats(await statsRes.json());
      setNoShows(await noShowsRes.json());
      setRevenue(await revenueRes.json());
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
        <p className="text-gray-500">Analysen und Statistiken</p>
      </div>

      {/* Gesamt-Umsatz */}
      {revenue && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
          <p className="text-primary-100">Gesamtumsatz</p>
          <p className="text-4xl font-bold">{parseFloat(revenue.totalRevenue).toLocaleString('de-DE')} €</p>
          <div className="flex gap-6 mt-4 text-sm">
            <span>{revenue.totalDeals} Abschlüsse</span>
            <span>Ø {parseFloat(revenue.avgDealValue).toLocaleString('de-DE')} € pro Deal</span>
          </div>
        </div>
      )}

      {/* Closer Statistiken */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance pro Closer</h3>
        
        {closerStats.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Keine Daten vorhanden</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Closer</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Termine</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Abschlüsse</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Quote</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Umsatz</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Ø Deal</th>
                </tr>
              </thead>
              <tbody>
                {closerStats.map((closer) => (
                  <tr key={closer.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{closer.name}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{closer.totalDeals}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-green-600 font-medium">{closer.won}</span>
                      {' / '}
                      <span className="text-red-600">{closer.lost}</span>
                      {' / '}
                      <span className="text-blue-600">{closer.followUp}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                        parseFloat(closer.conversionRate) >= 40 ? 'bg-green-100 text-green-800' :
                        parseFloat(closer.conversionRate) >= 25 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {closer.conversionRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      {parseFloat(closer.revenue).toLocaleString('de-DE')} €
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {parseFloat(closer.avgDealValue).toLocaleString('de-DE')} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* No-Show Analyse */}
      {noShows && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            No-Show Analyse 
            <span className="ml-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
              {noShows.total} gesamt
            </span>
          </h3>
          
          {Object.keys(noShows.byReason || {}).length === 0 ? (
            <p className="text-gray-500 text-center py-8">Keine No-Shows erfasst</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(noShows.byReason).map(([reason, count]: [string, any]) => (
                <div key={reason} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">{reason}</p>
                  <p className="text-2xl font-bold text-gray-900">{count as number}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}