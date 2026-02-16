'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function DealsView() {
  const [deals, setDeals] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDeals();
  }, [filter]);

  const fetchDeals = async () => {
    try {
      const url = filter === 'all' 
        ? `${API_URL}/api/deals` 
        : `${API_URL}/api/deals?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setDeals(data);
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API_URL}/api/deals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchDeals();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const totalRevenue = deals
    .filter(d => d.status === 'WON')
    .reduce((sum, d) => sum + Number(d.productPrice), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Deals</h2>
          <p className="text-gray-500">Verwalte deine Verkäufe</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Gesamtumsatz</p>
            <p className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString('de-DE')} €</p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">Alle Deals</option>
            <option value="WON">✅ Gewonnen</option>
            <option value="LOST">❌ Verloren</option>
            <option value="FOLLOW_UP">🔄 Follow-Up</option>
            <option value="PENDING">⏳ Ausstehend</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          {deals.length === 0 ? (
            <p className="text-gray-500 text-center py-12">Keine Deals gefunden</p>
          ) : (
            <div className="space-y-4">
              {deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} onStatusChange={updateStatus} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DealCard({ deal, onStatusChange }: { deal: any; onStatusChange: (id: string, status: string) => void }) {
  const [showFollowUpDate, setShowFollowUpDate] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');

  const handleStatusChange = (status: string) => {
    if (status === 'FOLLOW_UP') {
      setShowFollowUpDate(true);
    } else {
      onStatusChange(deal.id, status);
    }
  };

  const submitFollowUp = () => {
    onStatusChange(deal.id, 'FOLLOW_UP');
    setShowFollowUpDate(false);
  };

  const statusColors: Record<string, string> = {
    WON: 'bg-green-100 text-green-800',
    LOST: 'bg-red-100 text-red-800',
    FOLLOW_UP: 'bg-blue-100 text-blue-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
  };

  const statusLabels: Record<string, string> = {
    WON: 'Gewonnen',
    LOST: 'Verloren',
    FOLLOW_UP: 'Follow-Up',
    PENDING: 'Ausstehend',
  };

  const paymentLabel = deal.paymentType === 'PAYMENT_FULL' 
    ? 'Einmalzahlung' 
    : `Ratenzahlung (${deal.numberOfRates}x ${Number(deal.monthlyRate).toLocaleString('de-DE')}€)`;

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {deal.appointment?.lead?.firstName} {deal.appointment?.lead?.lastName}
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[deal.status]}`}>
              {statusLabels[deal.status]}
            </span>
          </div>
          
          <p className="text-2xl font-bold text-gray-900 mb-2">
            {Number(deal.productPrice).toLocaleString('de-DE')} €
          </p>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span>💳 {paymentLabel}</span>
            <span>👤 {deal.closer?.name}</span>
            <span>📅 {new Date(deal.createdAt).toLocaleDateString('de-DE')}</span>
          </div>

          {deal.paymentType === 'PAYMENT_INSTALLMENTS' && deal.payments && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Zahlungen:</p>
              <div className="mt-1 space-y-1">
                {deal.payments.map((payment: any) => (
                  <div key={payment.id} className="flex justify-between text-sm text-blue-700">
                    <span>{payment.note || 'Zahlung'}</span>
                    <span>{Number(payment.amount).toLocaleString('de-DE')} €</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-sm font-bold text-blue-900">
                Bereits gezahlt: {deal.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0).toLocaleString('de-DE')} €
              </p>
            </div>
          )}
        </div>

        {deal.status === 'PENDING' && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleStatusChange('WON')}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
            >
              ✅ Gewonnen
            </button>
            <button
              onClick={() => handleStatusChange('LOST')}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
            >
              ❌ Verloren
            </button>
            <button
              onClick={() => handleStatusChange('FOLLOW_UP')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              🔄 Follow-Up
            </button>
          </div>
        )}
      </div>

      {showFollowUpDate && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">Follow-Up Datum:</p>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg"
            />
            <button
              onClick={submitFollowUp}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Speichern
            </button>
          </div>
        </div>
      )}

      {deal.followUpDate && (
        <div className="mt-3 p-3 bg-blue-50 rounded text-sm text-blue-700">
          <strong>Follow-Up am:</strong> {new Date(deal.followUpDate).toLocaleString('de-DE')}
        </div>
      )}

      {deal.lostReason && (
        <div className="mt-3 p-3 bg-red-50 rounded text-sm text-red-700">
          <strong>Grund:</strong> {deal.lostReason}
        </div>
      )}
    </div>
  );
}