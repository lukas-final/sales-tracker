'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import DashboardView from './DashboardView';
import AppointmentsView from './AppointmentsView';
import DealsView from './DealsView';
import ReportsView from './ReportsView';
import CampaignsView from './CampaignsView';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    appointments: 0,
    deals: 0,
    revenue: 0,
    noShows: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchTodayAppointments();
  }, []);

  const fetchStats = async () => {
    try {
      // Dashboard Stats laden
      const res = await fetch(`${API_URL}/api/reports/revenue`);
      const data = await res.json();
      setStats(prev => ({ ...prev, revenue: parseFloat(data.totalRevenue || 0) }));
    } catch (error) {
      console.error('Fehler beim Laden der Stats:', error);
    }
  };

  const fetchTodayAppointments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/appointments/today`);
      const data = await res.json();
      setTodayAppointments(data);
    } catch (error) {
      console.error('Fehler beim Laden der Termine:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView stats={stats} appointments={todayAppointments} />;
      case 'appointments':
        return <AppointmentsView />;
      case 'deals':
        return <DealsView />;
      case 'reports':
        return <ReportsView />;
      case 'campaigns':
        return <CampaignsView />;
      default:
        return <DashboardView stats={stats} appointments={todayAppointments} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-auto p-8">
        {renderContent()}
      </main>
    </div>
  );
}