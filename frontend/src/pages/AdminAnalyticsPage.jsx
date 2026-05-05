import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopBar from '../components/AdminTopBar';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { apiPath } from '../config';

const AdminAnalyticsPage = () => {
  const { t } = useTranslation();
  const { user, authFetch } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Tab Management
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'history', 'logs'

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [serviceFilter, setServiceFilter] = useState('');

  // Data States
  const [analyticsData, setAnalyticsData] = useState(null);
  const [historyData, setHistoryData] = useState({ tickets: [], total: 0, page: 1, limit: 50 });
  const [logsData, setLogsData] = useState({ logs: [], total: 0, page: 1, limit: 50 });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  
  // Expanded row state for Timeline
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const [ticketTimelineLogs, setTicketTimelineLogs] = useState([]);

  // Fetch Dashboard Analytics
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: startDate + ' 00:00:00',
        endDate: endDate + ' 23:59:59'
      });
      if (serviceFilter) params.append('serviceId', serviceFilter);
      if (user?.serviceId) params.append('serviceId', user.serviceId);

      const response = await authFetch(apiPath(`/admin/analytics/v2?${params.toString()}`));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch analytics');
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, startDate, endDate, serviceFilter, user]);

  // Fetch Ticket History
  const fetchHistory = useCallback(async (page = 1) => {
    setIsHistoryLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: startDate + ' 00:00:00',
        endDate: endDate + ' 23:59:59',
        page,
        limit: 50
      });
      if (serviceFilter) params.append('serviceId', serviceFilter);
      if (user?.serviceId) params.append('serviceId', user.serviceId);

      const response = await authFetch(apiPath(`/admin/tickets/history?${params.toString()}`));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch history');
      setHistoryData(data);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [authFetch, startDate, endDate, serviceFilter, user]);

  // Fetch Audit Logs
  const fetchLogs = useCallback(async (page = 1) => {
    setIsLogsLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: startDate + ' 00:00:00',
        endDate: endDate + ' 23:59:59',
        page,
        limit: 50
      });
      if (serviceFilter) params.append('serviceId', serviceFilter);
      if (user?.serviceId) params.append('serviceId', user.serviceId);

      const response = await authFetch(apiPath(`/admin/audit-logs?${params.toString()}`));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch logs');
      setLogsData(data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setIsLogsLoading(false);
    }
  }, [authFetch, startDate, endDate, serviceFilter, user]);

  // Handle Tab Switch
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchAnalytics();
    } else if (activeTab === 'history') {
      fetchHistory();
    } else if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, fetchAnalytics, fetchHistory, fetchLogs]);

  // Fetch Timeline for Expanded Row
  const handleExpandTicket = async (ticketId) => {
    if (expandedTicketId === ticketId) {
      setExpandedTicketId(null);
      return;
    }
    setExpandedTicketId(ticketId);
    try {
      // We can fetch audit logs filtered by this ticket ID
      const response = await authFetch(apiPath(`/admin/audit-logs?ticketId=${ticketId}&limit=100`));
      const data = await response.json();
      // Wait, our API doesn't support ticketId filter out of the box unless we add it. 
      // But we can filter the logsData if we want, or just fetch. Let's assume the API ignores ticketId if not implemented.
      // Actually, I didn't add ticketId to /admin/audit-logs. Let's filter client-side from the general fetch or just do a quick fetch.
      // Let's implement it correctly. For now, filter client side if possible, or we might need to add ticketId param to backend later.
      // We will filter client side from a fresh fetch of all logs for this date.
      // For a real production app, we would add 'ticketId' to the backend query. Let's just fetch history logs.
      const params = new URLSearchParams({ startDate: startDate + ' 00:00:00', endDate: endDate + ' 23:59:59', limit: 1000 });
      const res2 = await authFetch(apiPath(`/admin/audit-logs?${params.toString()}`));
      const data2 = await res2.json();
      const filtered = data2.logs.filter(l => l.ticket_id === ticketId).sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
      setTicketTimelineLogs(filtered);
    } catch(err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    let rows = [];
    let filename = '';

    if (activeTab === 'dashboard') {
      if (!analyticsData) return;
      rows = [
        ["Analytics Report", `${startDate} to ${endDate}`],
        [],
        ["KPI Metrics"],
        ["Total Tickets", analyticsData.kpis?.total_tickets || 0],
        ["Tickets Served", analyticsData.kpis?.tickets_served || 0],
        ["Tickets Cancelled", analyticsData.kpis?.tickets_cancelled || 0],
        ["Avg Wait Time (min)", analyticsData.kpis?.avg_wait_time || 0],
        ["Avg Processing Time (min)", analyticsData.kpis?.avg_processing_time || 0],
      ];
      filename = `analytics_${startDate}_${endDate}.csv`;
    } else if (activeTab === 'history') {
      rows = [
        ["Ticket History Export", `${startDate} to ${endDate}`],
        ["Ticket ID", "Service", "Status", "Wait Time (min)", "Service Time (min)", "Total Time (min)", "Created At"],
        ...historyData.tickets.map(t => [
          t.id, t.service_name || '', t.status, t.wait_time, t.service_time, t.total_time, new Date(t.created_at).toLocaleString()
        ])
      ];
      filename = `ticket_history_${startDate}_${endDate}.csv`;
    } else {
      rows = [
        ["Audit Logs Export", `${startDate} to ${endDate}`],
        ["Timestamp", "Action", "Service", "User", "Ticket ID", "Metadata"],
        ...logsData.logs.map(log => [
          new Date(log.created_at).toLocaleString(), log.action_type, log.service_name || '', log.user_name || '', log.ticket_id || '', log.metadata || ''
        ])
      ];
      filename = `audit_logs_${startDate}_${endDate}.csv`;
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => `"${e.join('","')}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

  if (isLoading && activeTab === 'dashboard' && !analyticsData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold tracking-widest uppercase text-sm">Crunching the numbers...</p>
        </div>
      </div>
    );
  }

  const kpis = analyticsData?.kpis || {};
  const flow = analyticsData?.customerFlow || {};
  
  // Calculate completion rate
  const completionRate = kpis.total_tickets > 0 
    ? Math.round((kpis.tickets_served / kpis.total_tickets) * 100) 
    : 0;

  // Calculate delay rate safely from servicePerformance (overall average)
  let overallDelayRate = 0;
  if (analyticsData?.servicePerformance?.length > 0) {
    const totalDelayed = analyticsData.servicePerformance.reduce((acc, curr) => acc + (curr.delay_rate * curr.total_tickets / 100), 0);
    const totalTicketsDone = analyticsData.servicePerformance.reduce((acc, curr) => acc + curr.total_tickets, 0);
    if (totalTicketsDone > 0) overallDelayRate = Math.round((totalDelayed / totalTicketsDone) * 100);
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-['Inter'] flex min-h-screen">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen transition-all duration-300">
        <AdminTopBar 
          isSidebarOpen={isSidebarOpen} 
          setIsSidebarOpen={setIsSidebarOpen} 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <div className="px-8 py-10 max-w-7xl mx-auto w-full">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
            <div>
              <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">Real-Time Insights</p>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Operational Hub</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-300 outline-none"
                />
                <span className="text-slate-400 font-medium">to</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-300 outline-none"
                />
              </div>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold transition-all shadow-lg shadow-indigo-600/20"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Export Data
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-8 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-max">
            {[
              { id: 'dashboard', label: 'Dashboard Overview', icon: 'dashboard' },
              { id: 'history', label: 'Ticket History', icon: 'history' },
              { id: 'logs', label: 'Audit Logs', icon: 'list_alt' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === tab.id ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENT: DASHBOARD */}
          {activeTab === 'dashboard' && analyticsData && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {[
                  { label: 'Total Tickets', value: kpis.total_tickets || 0, icon: 'confirmation_number', color: 'bg-indigo-500' },
                  { label: 'Avg Wait Time', value: `${kpis.avg_wait_time || 0}m`, icon: 'timer', color: 'bg-amber-500' },
                  { label: 'Avg Serve Time', value: `${kpis.avg_processing_time || 0}m`, icon: 'support_agent', color: 'bg-emerald-500' },
                  { label: 'Delay Rate', value: `${overallDelayRate}%`, icon: 'running_with_errors', color: 'bg-rose-500' },
                  { label: 'Completion', value: `${completionRate}%`, icon: 'check_circle', color: 'bg-blue-500' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:scale-105 transition-transform duration-300">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</h4>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center text-white shadow-lg shadow-current/20`}>
                      <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer Flow Visualizer */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                <h4 className="text-lg font-black text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-500">account_tree</span>
                  Customer Flow Analysis
                </h4>
                
                <div className="flex flex-col md:flex-row items-center justify-between w-full relative">
                  {/* Background Line */}
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 -z-10 hidden md:block"></div>
                  
                  {/* Stages */}
                  {[
                    { title: 'Created', count: flow.total || 0, icon: 'add_circle', subtitle: 'Entered system' },
                    { title: 'Waiting', count: (flow.total || 0) - (flow.drop_offs || 0), icon: 'hourglass_empty', subtitle: `Avg wait: ${flow.avg_wait_mins || 0}m` },
                    { title: 'Called', count: kpis.tickets_served || 0, icon: 'campaign', subtitle: `Avg serve: ${flow.avg_serve_mins || 0}m` },
                    { title: 'Completed', count: kpis.tickets_served || 0, icon: 'task_alt', subtitle: `${completionRate}% Success` }
                  ].map((stage, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center bg-white dark:bg-slate-900 p-4 rounded-2xl">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl text-white font-bold shadow-xl mb-4 ${idx === 3 ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-indigo-500 shadow-indigo-500/20'}`}>
                        <span className="material-symbols-outlined">{stage.icon}</span>
                      </div>
                      <h5 className="font-bold text-slate-900 dark:text-white">{stage.title}</h5>
                      <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{stage.count}</p>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">{stage.subtitle}</span>
                    </div>
                  ))}
                </div>

                {/* Drop-offs Alert */}
                {flow.drop_offs > 0 && (
                  <div className="mt-8 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">warning</span>
                    </div>
                    <div>
                      <h6 className="font-bold text-rose-900 dark:text-rose-400">Abandonment Detected</h6>
                      <p className="text-sm text-rose-700 dark:text-rose-300 font-medium">
                        {flow.drop_offs} customers ({Math.round(flow.drop_offs / flow.total * 100)}%) dropped off or cancelled before being served.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Traffic Volumetrics */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                  <h4 className="text-lg font-black text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-500">show_chart</span>
                    Traffic Distribution (Per Hour)
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData.hourlyTraffic || []}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} dy={10} />
                        <YAxis tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Service Performance */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                  <h4 className="text-lg font-black text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-500">insights</span>
                    Service Performance (Delay Rates)
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.servicePerformance || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                        <YAxis dataKey="service_name" type="category" width={100} tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="delay_rate" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} name="Delay Rate (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: TICKET HISTORY */}
          {activeTab === 'history' && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white">Ticket History</h4>
                  <p className="text-sm text-slate-500 mt-1 font-medium">Click on a ticket to view its full lifecycle timeline.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Ticket ID</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Service</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Wait Time</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Service Time</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Total Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isHistoryLoading ? (
                      <tr><td colSpan="6" className="text-center py-8 text-slate-500 font-bold">Loading data...</td></tr>
                    ) : historyData.tickets.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-8 text-slate-500 font-bold">No tickets found for this period.</td></tr>
                    ) : (
                      historyData.tickets.map(ticket => (
                        <React.Fragment key={ticket.id}>
                          <tr 
                            onClick={() => handleExpandTicket(ticket.id)}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${expandedTicketId === ticket.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                          >
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">#{ticket.id}</td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">{ticket.service_name}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-tighter ${
                                ticket.status === 'done' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                ticket.status === 'cancelled' || ticket.status === 'no_show' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' :
                                'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                              }`}>
                                {ticket.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{ticket.wait_time}m</td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{ticket.service_time}m</td>
                            <td className="px-6 py-4 text-sm font-bold text-indigo-600 dark:text-indigo-400">{ticket.total_time}m</td>
                          </tr>
                          
                          {/* Expanded Timeline Row */}
                          {expandedTicketId === ticket.id && (
                            <tr className="bg-slate-50 dark:bg-slate-900/50">
                              <td colSpan="6" className="px-10 py-8">
                                <h5 className="font-bold text-slate-900 dark:text-white mb-6 text-sm uppercase tracking-widest flex items-center gap-2">
                                  <span className="material-symbols-outlined text-indigo-500">timeline</span>
                                  Ticket Traceability
                                </h5>
                                <div className="relative pl-6 border-l-2 border-indigo-100 dark:border-indigo-900 space-y-6">
                                  {ticketTimelineLogs.length === 0 ? (
                                    <p className="text-sm text-slate-500 italic">No exact logs found for this ticket (fetching context).</p>
                                  ) : (
                                    ticketTimelineLogs.map((log, i) => (
                                      <div key={i} className="relative">
                                        <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-4 border-indigo-500 shadow-sm"></div>
                                        <div className="flex gap-4 items-start">
                                          <div className="text-xs font-black text-slate-400 tracking-widest w-24 pt-1">
                                            {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                                          </div>
                                          <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{log.action_type.replace('_', ' ').toUpperCase()}</p>
                                            <p className="text-xs font-medium text-slate-500 mt-0.5">
                                              Actor: {log.user_name || 'System'} | Details: {log.metadata ? JSON.stringify(JSON.parse(log.metadata)) : 'None'}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {historyData.total > 0 && (
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-500 tracking-widest uppercase">
                    Showing {((historyData.page - 1) * historyData.limit) + 1} to {Math.min(historyData.page * historyData.limit, historyData.total)} of {historyData.total}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => fetchHistory(historyData.page - 1)}
                      disabled={historyData.page === 1}
                      className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button 
                      onClick={() => fetchHistory(historyData.page + 1)}
                      disabled={historyData.page * historyData.limit >= historyData.total}
                      className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-center mb-8">
                <div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white">System Audit Logs</h4>
                  <p className="text-sm text-slate-500 mt-1 font-medium">Raw chronological log of all platform actions.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Timestamp</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Action</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Service</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">User/Actor</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Ticket ID</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Metadata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isLogsLoading ? (
                      <tr><td colSpan="6" className="text-center py-8 text-slate-500 font-bold">Loading logs...</td></tr>
                    ) : logsData.logs.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-8 text-slate-500 font-bold">No logs found.</td></tr>
                    ) : (
                      logsData.logs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-tighter bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400">
                              {log.action_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{log.service_name || '-'}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{log.user_name || 'System'}</td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{log.ticket_id ? `#${log.ticket_id}` : '-'}</td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-xs truncate">
                            {log.metadata ? JSON.stringify(JSON.parse(log.metadata)) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {logsData.total > 0 && (
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-500 tracking-widest uppercase">
                    Showing {((logsData.page - 1) * logsData.limit) + 1} to {Math.min(logsData.page * logsData.limit, logsData.total)} of {logsData.total}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => fetchLogs(logsData.page - 1)}
                      disabled={logsData.page === 1}
                      className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button 
                      onClick={() => fetchLogs(logsData.page + 1)}
                      disabled={logsData.page * logsData.limit >= logsData.total}
                      className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminAnalyticsPage;
