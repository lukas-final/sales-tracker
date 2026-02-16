'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AppointmentsView() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/appointments?date=${selectedDate}`);
      const data = await res.json();
      setAppointments(data);
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const updateStatus = async (id: string, status: string, reason?: string) => {
    try {
      await fetch(`${API_URL}/api/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, noShowReason: reason }),
      });
      fetchAppointments();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Termine</h2>
          <p className="text-gray-500">Verwalte deine Sales-Termine</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          {appointments.length === 0 ? (
            <p className="text-gray-500 text-center py-12">Keine Termine für diesen Tag</p>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onStatusChange={updateStatus}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AppointmentCard({ appointment, onStatusChange }: { appointment: any; onStatusChange: (id: string, status: string, reason?: string) => void }) {
  const [showNoShowReason, setShowNoShowReason] = useState(false);
  const [noShowReason, setNoShowReason] = useState('');

  const handleStatusChange = (status: string) => {
    if (status === 'NO_SHOW') {
      setShowNoShowReason(true);
    } else {
      onStatusChange(appointment.id, status);
    }
  };

  const submitNoShow = () => {
    onStatusChange(appointment.id, 'NO_SHOW', noShowReason);
    setShowNoShowReason(false);
    setNoShowReason('');
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-100 flex flex-col items-center justify-center text-primary-700">
            <span className="text-xs font-medium">
              {new Date(appointment.scheduledAt).toLocaleDateString('de-DE', { weekday: 'short' })}
            </span>
            <span className="text-lg font-bold">
              {new Date(appointment.scheduledAt).getDate()}
            </span>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {appointment.lead?.firstName} {appointment.lead?.lastName}
            </p>
            <p className="text-gray-500">📞 {appointment.lead?.phone}</p>
            <p className="text-gray-500">✉️ {appointment.lead?.email || 'Keine E-Mail'}</p>
            <p className="text-sm text-gray-400 mt-1">
              Closer: {appointment.closer?.name} • 
              Zeit: {new Date(appointment.scheduledAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            appointment.status === 'SCHEDULED' ? 'bg-yellow-100 text-yellow-800' :
            appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {appointment.status === 'SCHEDULED' ? 'Geplant' :
             appointment.status === 'COMPLETED' ? 'Abgeschlossen' : 'No-Show'}
          </span>

          {appointment.status === 'SCHEDULED' && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleStatusChange('COMPLETED')}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                ✅ Abgeschlossen
              </button>
              <button
                onClick={() => handleStatusChange('NO_SHOW')}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                ❌ No-Show
              </button>
            </div>
          )}
        </div>
      </div>

      {showNoShowReason && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-red-800 mb-2">Grund für No-Show:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={noShowReason}
              onChange={(e) => setNoShowReason(e.target.value)}
              placeholder="z.B. Nicht erreicht, Abgesagt, etc."
              className="flex-1 px-3 py-2 border border-red-300 rounded-lg"
            />
            <button
              onClick={submitNoShow}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Speichern
            </button>
          </div>
        </div>
      )}

      {appointment.noShowReason && (
        <div className="mt-3 p-3 bg-red-50 rounded text-sm text-red-700">
          <strong>No-Show Grund:</strong> {appointment.noShowReason}
        </div>
      )}
    </div>
  );
}