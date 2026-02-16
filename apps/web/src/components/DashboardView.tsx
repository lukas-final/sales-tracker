'use client';

interface DashboardViewProps {
  stats: {
    appointments: number;
    deals: number;
    revenue: number;
    noShows: number;
  };
  appointments: any[];
}

export default function DashboardView({ stats, appointments }: DashboardViewProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500">Übersicht deiner Sales-Aktivitäten</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Heutige Termine"
          value={appointments.length}
          icon="📅"
          color="blue"
        />
        <KPICard
          title="Abschlüsse"
          value={stats.deals}
          icon="✅"
          color="green"
        />
        <KPICard
          title="Umsatz"
          value={`${stats.revenue.toLocaleString('de-DE')} €`}
          icon="💰"
          color="purple"
        />
        <KPICard
          title="No-Shows"
          value={stats.noShows}
          icon="❌"
          color="red"
        />
      </div>

      {/* Heutige Termine */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Heutige Termine</h3>
        
        {appointments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Keine Termine für heute</p>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt: any) => (
              <div
                key={apt.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                    {new Date(apt.scheduledAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {apt.lead?.firstName} {apt.lead?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      📞 {apt.lead?.phone} • Closer: {apt.closer?.name}
                    </p>
                  </div>
                </div>
                <StatusBadge status={apt.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KPICard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className={`p-6 rounded-xl border ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SCHEDULED: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
    NO_SHOW: 'bg-red-100 text-red-800',
  };

  const labels: Record<string, string> = {
    SCHEDULED: 'Geplant',
    COMPLETED: 'Abgeschlossen',
    NO_SHOW: 'No-Show',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
}