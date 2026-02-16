'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CampaignsView() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    budget: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`${API_URL}/api/campaigns`);
      const data = await res.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          budget: parseFloat(formData.budget),
          startDate: new Date(formData.startDate).toISOString(),
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        }),
      });
      setShowForm(false);
      setFormData({ name: '', budget: '', startDate: '', endDate: '' });
      fetchCampaigns();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kampagnen</h2>
          <p className="text-gray-500">Verwalte deine Facebook Kampagnen</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          {showForm ? '✕ Abbrechen' : '+ Neue Kampagne'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Neue Kampagne</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Sommer Sale 2025"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget (€)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="5000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Startdatum</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enddatum (optional)</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Kampagne erstellen
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>

      {campaigns.length === 0 && !showForm && (
        <div className="text-center py-12">
          <p className="text-gray-500">Noch keine Kampagnen erstellt</p>
          <p className="text-sm text-gray-400 mt-1">Erstelle deine erste Kampagne mit dem Button oben</p>
        </div>
      )}
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: any }) {
  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    PAUSED: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-gray-100 text-gray-800',
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Aktiv',
    PAUSED: 'Pausiert',
    COMPLETED: 'Abgeschlossen',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
          <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[campaign.status]}`}>
            {statusLabels[campaign.status]}
          </span>
        </div>
        {campaign.facebookId && (
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Facebook</span>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Budget:</span>
          <span className="font-medium">{Number(campaign.budget).toLocaleString('de-DE')} €</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Leads:</span>
          <span className="font-medium">{campaign._count?.leads || 0}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Zeitraum:</span>
          <span className="font-medium">
            {new Date(campaign.startDate).toLocaleDateString('de-DE')} - 
            {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString('de-DE') : 'Offen'}
          </span>
        </div>
      </div>
    </div>
  );
}