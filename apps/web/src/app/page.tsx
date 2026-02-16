'use client';

import { useState, useEffect } from 'react';
import AdminDashboard from '@/components/AdminDashboard';
import CloserDashboard from '@/components/CloserDashboard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Home() {
  const [userRole, setUserRole] = useState<'admin' | 'closer' | null>(null);
  const [closerId, setCloserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In einer echten App: User aus Auth-Context oder LocalStorage holen
    // Hier simulieren wir einen Admin für Demo-Zwecke
    const demoUser = {
      role: 'admin' as const,
      id: 'demo-admin-id'
    };
    
    // Für Testing: Könnte auch Closer sein
    // const demoUser = { role: 'closer' as const, id: 'demo-closer-id' };
    
    setUserRole(demoUser.role);
    setCloserId(demoUser.id);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  if (userRole === 'admin') {
    return <AdminDashboard />;
  }

  if (userRole === 'closer' && closerId) {
    return <CloserDashboard closerId={closerId} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Sales Tracker CRM</h1>
        <p className="text-gray-600 mb-6">Bitte einloggen um fortzufahren</p>
        <div className="space-y-3">
          <button 
            onClick={() => {
              setUserRole('admin');
              setCloserId('demo-admin-id');
            }}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Als Admin fortfahren
          </button>
          <button 
            onClick={() => {
              setUserRole('closer');
              setCloserId('demo-closer-id');
            }}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Als Closer fortfahren
          </button>
        </div>
      </div>
    </div>
  );
}