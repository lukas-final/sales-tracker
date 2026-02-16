'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Phone, 
  CheckCircle, 
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  User
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Appointment {
  id: string;
  time: string;
  lead: {
    name: string;
    phone: string;
    campaign: string;
  };
  status: string;
}

interface FollowUp {
  id: string;
  followUpDate: string;
  leadName: string;
  productPrice: number;
}

interface CloserStats {
  totalCalls: number;
  totalWins: number;
  totalRevenue: number;
}

interface CloserData {
  todaysAppointments: Appointment[];
  followUps: FollowUp[];
  stats: CloserStats;
}

interface LeadDetails {
  id: string;
  name: string;
  phone: string;
  email?: string;
  campaign?: string;
  source: string;
  notes: string;
}

export default function CloserDashboard({ closerId }: { closerId: string }) {
  const [data, setData] = useState<CloserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAppointment, setActiveAppointment] = useState<string | null>(null);
  const [leadDetails, setLeadDetails] = useState<LeadDetails | null>(null);
  const [showCallComplete, setShowCallComplete] = useState(false);
  const [callResult, setCallResult] = useState<'won' | 'lost' | 'follow-up' | null>(null);

  useEffect(() => {
    fetchCloserData();
  }, [closerId]);

  const fetchCloserData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/closer/dashboard/${closerId}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Fehler beim Laden der Closer-Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeadDetails = async (leadId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/closer/lead/${leadId}`);
      const result = await response.json();
      setLeadDetails(result);
    } catch (error) {
      console.error('Fehler beim Laden der Lead-Details:', error);
    }
  };

  const handleStartCall = (appointmentId: string, leadId: string) => {
    setActiveAppointment(appointmentId);
    loadLeadDetails(leadId);
  };

  const completeAppointment = async (status: string, showedUp: boolean, callDuration?: number) => {
    try {
      await fetch(`${API_URL}/api/closer/appointment/${activeAppointment}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, showedUp, callDuration, notes: '' })
      });

      setShowCallComplete(true);
      setActiveAppointment(null);
      fetchCloserData();
    } catch (error) {
      console.error('Fehler beim Abschließen des Termins:', error);
    }
  };

  const createDeal = async (dealData: any) => {
    try {
      await fetch(`${API_URL}/api/closer/deal/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealData)
      });

      setShowCallComplete(false);
      setCallResult(null);
      fetchCloserData();
    } catch (error) {
      console.error('Fehler beim Erstellen des Deals:', error);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const stats = data.stats;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Closer Dashboard</h1>
        <p className="text-gray-600">Heute im Fokus</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="flex items-center justify-center mb-2">
            <Phone className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-500">Calls</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalCalls}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-gray-500">Wins</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalWins}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="flex items-center justify-center mb-2">
            <DollarSign className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-sm font-medium text-gray-500">Umsatz</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(stats.totalRevenue)}
          </p>
        </div>
      </div>

      {/* Heutige Termine */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-bold text-gray-900">Heutige Termine</h2>
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {data.todaysAppointments.length}
            </span>
          </div>
        </div>

        <div className="p-4">
          {data.todaysAppointments.length > 0 ? (
            <div className="space-y-3">
              {data.todaysAppointments.map((apt) => (
                <div 
                  key={apt.id} 
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center mb-1">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <p className="font-medium text-gray-900">{apt.lead.name}</p>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="h-3 w-3 mr-1" />
                        <span>{apt.lead.phone}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{apt.lead.campaign}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {new Date(apt.time).toLocaleTimeString('de-DE', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                        apt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        apt.status.startsWith('NO_SHOW') ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {apt.status === 'COMPLETED' ? 'Erledigt' : 
                         apt.status.startsWith('NO_SHOW') ? 'No-Show' : 'Geplant'}
                      </span>
                    </div>
                  </div>
                  
                  {apt.status === 'SCHEDULED' && (
                    <button
                      onClick={() => handleStartCall(apt.id, apt.id.split('-')[0])}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Call starten
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Keine Termine für heute</p>
            </div>
          )}
        </div>
      </div>

      {/* Follow-Ups */}
      {data.followUps.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-bold text-gray-900">Follow-Ups</h2>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {data.followUps.map((followUp) => (
                <div key={followUp.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{followUp.leadName}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(followUp.followUpDate).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(followUp.productPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Call Interface */}
      {activeAppointment && leadDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Call mit {leadDetails.name}</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <p className="text-lg font-medium text-gray-900">{leadDetails.phone}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kampagne</label>
                  <p className="text-gray-900">{leadDetails.campaign || 'Keine Kampagne'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
                  <p className="text-gray-900">{leadDetails.notes || 'Keine Notizen'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => completeAppointment('COMPLETED', true, 25)}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Call erfolgreich beendet
                </button>
                
                <button
                  onClick={() => completeAppointment('NO_SHOW_GHOSTING', false)}
                  className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  No-Show (Ghosting)
                </button>
                
                <button
                  onClick={() => {
                    setActiveAppointment(null);
                    setLeadDetails(null);
                  }}
                  className="w-full py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Complete Modal */}
      {showCallComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Call Ergebnis</h3>
              
              {!callResult ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setCallResult('won')}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Deal gewonnen
                  </button>
                  
                  <button
                    onClick={() => setCallResult('lost')}
                    className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Deal verloren
                  </button>
                  
                  <button
                    onClick={() => setCallResult('follow-up')}
                    className="w-full py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium flex items-center justify-center"
                  >
                    <Clock className="h-5 w-5 mr-2" />
                    Follow-Up nötig
                  </button>
                </div>
              ) : callResult === 'won' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zahlungsart
                    </label>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button className="py-2 border border-blue-600 text-blue-600 rounded-lg font-medium">
                        Einmalzahlung
                      </button>
                      <button className="py-2 border border-gray-300 text-gray-700 rounded-lg font-medium">
                        Ratenzahlung
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => createDeal({
                        appointmentId: activeAppointment,
                        status: 'WON',
                        productPrice: 2500,
                        paymentType: 'PAYMENT_FULL',
                        fullAmount: 2500
                      })}
                      className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                      Deal speichern
                    </button>
                    
                    <button
                      onClick={() => setCallResult(null)}
                      className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      Zurück
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grund für Verlust
                    </label>
                    <div className="space-y-2">
                      {['Zu teuer', 'Kein Bedarf', 'Konkurrenz', 'Anderer Grund'].map((reason) => (
                        <button
                          key={reason}
                          className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => createDeal({
                        appointmentId: activeAppointment,
                        status: 'LOST_TOO_EXPENSIVE',
                        productPrice: 0,
                        paymentType: 'PAYMENT_FULL'
                      })}
                      className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                    >
                      Speichern
                    </button>
                    
                    <button
                      onClick={() => setCallResult(null)}
                      className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      Zurück
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="fixed bottom-6 right-6">
        <button className="p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700">
          <Phone className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}