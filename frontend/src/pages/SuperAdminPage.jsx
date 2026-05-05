import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const CATEGORIES = [
  'Finance',
  'Administration',
  'Utilities',
  'Health',
  'Telecom',
  'Transportation',
  'Education',
  'Commerce'
];

const SuperAdminPage = () => {
  const { t, i18n } = useTranslation();
  const { user, authFetch } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [services, setServices] = useState([]);
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [regularUsers, setRegularUsers] = useState([]); // For User Promotion
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      const response = await authFetch('http://localhost:3001/admin/analytics');
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  // Service form state
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: 'Administration',
    description: '',
    icon: 'hub',
    color_theme: '#6366f1',
    address: '',
    phone_number: '',
    email_address: '',
    website: '',
    logo_url: '',
    banner_url: '',
    cover_image_url: '',
    lat: 31.6295,
    lng: -7.9811
  });

  const MapPicker = ({ lat, lng, onChange }) => {
    const MapEvents = () => {
      useMapEvents({
        click(e) {
          onChange(e.latlng.lat, e.latlng.lng);
        },
      });
      return null;
    };

    return (
      <div className="h-64 w-full rounded-2xl overflow-hidden shadow-inner border border-outline-variant/30">
        <MapContainer center={[lat || 31.6295, lng || -7.9811]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[lat, lng]} />
          <MapEvents />
        </MapContainer>
      </div>
    );
  };

  // Admin form state
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    phone_number: '',
    role: 'admin',
    is_active: true,
    service_id: ''
  });

  // Fetch services
  const fetchServices = async () => {
    try {
      const response = await authFetch('http://localhost:3001/services');
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Fetch admin accounts
  const fetchAdminAccounts = async () => {
    try {
      const response = await authFetch('http://localhost:3001/admin/accounts');
      const data = await response.json();
      setAdminAccounts(data);
    } catch (error) {
      console.error('Error fetching admin accounts:', error);
    }
  };

  const fetchRegularUsers = async () => {
    try {
      const response = await authFetch('http://localhost:3001/users');
      const data = await response.json();
      setRegularUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchAdminAccounts();
    fetchRegularUsers();
    fetchAnalytics();
  }, []);

  // Service CRUD operations
  const handleFileUpload = async (event, fieldName) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await authFetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setServiceForm(prev => ({ ...prev, [fieldName]: data.url }));
      } else {
        console.error('Failed to upload file');
        alert('Failed to upload image. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading image. Please check your connection.');
    }
  };

  const handleCreateService = async () => {
    try {
      const response = await authFetch('http://localhost:3001/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm)
      });

      if (response.ok) {
        fetchServices();
        setShowServiceModal(false);
        setServiceForm({
          name: '',
          category: 'Administration',
          description: '',
          icon: 'hub',
          color_theme: '#6366f1',
          address: '',
          phone_number: '',
          email_address: '',
          website: '',
          logo_url: '',
          banner_url: '',
          cover_image_url: '',
          lat: 31.6295,
          lng: -7.9811
        });
      }
    } catch (error) {
      console.error('Error creating service:', error);
    }
  };

  const handleUpdateService = async () => {
    try {
      const response = await authFetch(`http://localhost:3001/services/${editingService.id}/info`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm)
      });

      if (response.ok) {
        fetchServices();
        setShowServiceModal(false);
        setEditingService(null);
        setServiceForm({
          name: '',
          category: 'Administration',
          description: '',
          icon: 'hub',
          color_theme: '#6366f1',
          address: '',
          phone_number: '',
          email_address: '',
          website: '',
          logo_url: '',
          banner_url: '',
          cover_image_url: '',
          lat: 31.6295,
          lng: -7.9811
        });
      }
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        const response = await authFetch(`http://localhost:3001/services/${serviceId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          fetchServices();
        }
      } catch (error) {
        console.error('Error deleting service:', error);
      }
    }
  };

  // Admin CRUD operations
  const handleCreateAdmin = async () => {
    try {
      const response = await authFetch('http://localhost:3001/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm)
      });

      if (response.ok) {
        fetchAdminAccounts();
        setShowAdminModal(false);
        setAdminForm({
          name: '',
          email: '',
          password: '',
          phone_number: '',
          role: 'admin',
          is_active: true,
          service_id: ''
        });
      }
    } catch (error) {
      console.error('Error creating admin:', error);
    }
  };

  const handleUpdateAdmin = async () => {
    try {
      const response = await authFetch(`http://localhost:3001/admin/accounts/${editingAdmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm)
      });

      if (response.ok) {
        fetchAdminAccounts();
        setShowAdminModal(false);
        setEditingAdmin(null);
        setAdminForm({
          name: '',
          email: '',
          password: '',
          phone_number: '',
          role: 'admin',
          is_active: true,
          service_id: ''
        });
      }
    } catch (error) {
      console.error('Error updating admin:', error);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (window.confirm('Are you sure you want to delete this admin account?')) {
      try {
        const response = await authFetch(`http://localhost:3001/admin/accounts/${adminId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          fetchAdminAccounts();
        }
      } catch (error) {
        console.error('Error deleting admin:', error);
      }
    }
  };

  const handlePromoteUser = async (userId, newRole) => {
    try {
      const response = await authFetch(`http://localhost:3001/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (response.ok) {
        fetchRegularUsers();
        fetchAdminAccounts();
      }
    } catch (error) {
      console.error('Error promoting user:', error);
    }
  };

  const openServiceModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        name: service.name || '',
        category: service.category || 'Administration',
        description: service.description || '',
        icon: service.icon || 'hub',
        color_theme: service.color_theme || '#6366f1',
        address: service.address || '',
        phone_number: service.phone_number || '',
        email_address: service.email_address || '',
        website: service.website || '',
        logo_url: service.logo_url || '',
        banner_url: service.banner_url || '',
        cover_image_url: service.cover_image_url || '',
        lat: parseFloat(service.lat) || 31.6295,
        lng: parseFloat(service.lng) || -7.9811
      });
    } else {
      setEditingService(null);
      setServiceForm({
        name: '',
        category: 'Administration',
        description: '',
        icon: 'hub',
        color_theme: '#6366f1',
        address: '',
        phone_number: '',
        email_address: '',
        website: '',
        logo_url: '',
        banner_url: '',
        cover_image_url: '',
        lat: 31.6295,
        lng: -7.9811
      });
    }
    setShowServiceModal(true);
  };

  const openAdminModal = (admin = null) => {
    if (admin) {
      setEditingAdmin(admin);
      setAdminForm({
        name: admin.name,
        email: admin.email,
        password: '',
        phone_number: admin.phone_number || '',
        role: admin.role,
        is_active: admin.is_active,
        service_id: admin.service_id || ''
      });
    } else {
      setEditingAdmin(null);
      setAdminForm({
        name: '',
        email: '',
        password: '',
        phone_number: '',
        role: 'admin',
        is_active: true,
        service_id: ''
      });
    }
    setShowAdminModal(true);
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };


  return (
    <div className="bg-background text-on-surface selection:bg-primary-container selection:text-on-primary-container font-['Inter'] flex min-h-screen">
      {/* SideNavBar */}
      <aside className="h-screen w-72 ltr:rounded-r-[3rem] rtl:rounded-l-[3rem] fixed ltr:left-0 rtl:right-0 top-0 bg-slate-50 dark:bg-slate-950 shadow-[12px_0_40px_rgba(13,52,89,0.04)] z-50 flex flex-col py-8 font-['Plus_Jakarta_Sans'] tracking-tight ltr:border-r rtl:border-l border-slate-200 dark:border-slate-800">
        <div className="px-8 mb-10">
          <h1 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">Admin Central</h1>
          <p className="text-xs text-slate-500 font-medium tracking-widest mt-1">SUPER USER ACCESS</p>
        </div>
        <nav className="flex-1 space-y-2 px-4 overflow-y-auto" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <style>{`nav::-webkit-scrollbar { display: none; }`}</style>
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`w-full flex items-center gap-3 px-6 py-4 transition-all duration-300 rounded-xl ${activeSection === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 scale-95 active:scale-90 transition-transform'}`}>
            <span className="material-symbols-outlined">dashboard</span>
            <span>{t('common.dashboard')}</span>
          </button>
          <button
            onClick={() => setActiveSection('services')}
            className={`w-full flex items-center gap-3 px-6 py-4 transition-all duration-300 rounded-xl ${activeSection === 'services' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 scale-95 active:scale-90 transition-transform'}`}>
            <span className="material-symbols-outlined">hub</span>
            <span>{t('common.services')}</span>
          </button>
          <button
            onClick={() => setActiveSection('admins')}
            className={`w-full flex items-center gap-3 px-6 py-4 transition-all duration-300 rounded-xl ${activeSection === 'admins' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 scale-95 active:scale-90 transition-transform'}`}>
            <span className="material-symbols-outlined">admin_panel_settings</span>
            <span>{t('superAdmin.adminAccounts')}</span>
          </button>
          <button
            onClick={() => setActiveSection('users')}
            className={`w-full flex items-center gap-3 px-6 py-4 transition-all duration-300 rounded-xl ${activeSection === 'users' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 scale-95 active:scale-90 transition-transform'}`}>
            <span className="material-symbols-outlined">person</span>
            <span>{t('common.users')}</span>
          </button>
          <button
            onClick={() => setActiveSection('analytics')}
            className={`w-full flex items-center gap-3 px-6 py-4 transition-all duration-300 rounded-xl ${activeSection === 'analytics' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 scale-95 active:scale-90 transition-transform'}`}>
            <span className="material-symbols-outlined">monitoring</span>
            <span>{t('common.analytics')}</span>
          </button>
          <button
            onClick={() => setActiveSection('logs')}
            className={`w-full flex items-center gap-3 px-6 py-4 transition-all duration-300 rounded-xl ${activeSection === 'logs' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 scale-95 active:scale-90 transition-transform'}`}>
            <span className="material-symbols-outlined">history</span>
            <span>{t('common.activityLogs')}</span>
          </button>
          <button
            onClick={() => setActiveSection('settings')}
            className={`w-full flex items-center gap-3 px-6 py-4 transition-all duration-300 rounded-xl ${activeSection === 'settings' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 scale-95 active:scale-90 transition-transform'}`}>
            <span className="material-symbols-outlined">settings</span>
            <span>{t('common.settings')}</span>
          </button>
        </nav>
        <div className="px-6 mt-auto">
          <button
            onClick={() => openServiceModal()}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
            <span className="material-symbols-outlined text-sm">add</span>
            {t('superAdmin.addService')}
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <main className="ltr:ml-72 rtl:mr-72 min-h-screen flex-1">
        {/* TopAppBar */}
        <header className="sticky top-0 w-full z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex justify-between items-center px-8 py-4 font-['Plus_Jakarta_Sans'] font-medium">
          <div className="flex items-center gap-6 flex-1">
            <div className="relative w-96">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-full py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                placeholder={t('common.search')}
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <div className="flex items-center gap-4">
              <button className="w-10 h-10 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors">
                <span className="material-symbols-outlined">help_outline</span>
              </button>
            </div>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 leading-tight">{user?.name || 'Super Admin'}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Support</p>
              </div>
              <div className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm flex items-center justify-center bg-indigo-600 text-white font-bold text-sm">
                {getInitials(user?.name || 'Super Admin')}
              </div>
            </div>
          </div>
        </header>

        {/* Page Canvas */}
        <div className="px-12 py-10 max-w-7xl mx-auto">
          {/* Hero Header */}
          <header className="mb-12">
            <h1 className="text-5xl font-black text-on-surface tracking-tight mb-3">{t('superAdmin.title')}</h1>
            <p className="text-xl text-on-surface-variant font-['Inter'] font-light">{t('superAdmin.subtitle')}</p>
          </header>

          {/* Section: Manage Services */}
          {(activeSection === 'dashboard' || activeSection === 'services') && (
            <section className="mb-16">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-on-surface">{t('superAdmin.manageServices')}</h2>
                  <p className="text-on-surface-variant text-sm mt-1">Overview of all active hubs and regional branches.</p>
                </div>
                <button
                  onClick={() => openServiceModal()}
                  className="px-8 py-3.5 bg-gradient-to-r from-primary to-secondary text-white rounded-full font-bold flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                  {t('superAdmin.addService')}
                </button>
              </div>

              {/* Services Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {services.map(service => (
                  <div key={service.id} className="bg-blue-50/50 dark:bg-slate-900/50 p-6 rounded-[2rem] flex flex-col justify-between min-h-[260px] transition-all hover:-translate-y-1 hover:shadow-xl group border border-blue-100 dark:border-slate-800 relative overflow-hidden" style={{ backgroundColor: service.color_theme ? `${service.color_theme}10` : '' }}>
                    {service.cover_image_url && (
                      <div className="absolute top-0 left-0 right-0 h-24 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url(${service.cover_image_url})` }}></div>
                    )}
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        {service.logo_url ? (
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-100 flex items-center justify-center p-1">
                            <img src={service.logo_url} alt={service.name} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-md" style={{ backgroundColor: service.color_theme || 'var(--primary)' }}>
                            <span className="material-symbols-outlined text-3xl">{service.icon || 'hub'}</span>
                          </div>
                        )}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-1 shadow-sm">
                          <button
                            onClick={() => openServiceModal(service)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[1.1rem]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-600 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[1.1rem]">delete</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight mb-1">
                          {service.name}
                          <span className="material-symbols-outlined text-[1.1rem] text-slate-400">location_on</span>
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-4">{service.category || 'Service Hub'}</p>
                        
                        <div className="text-slate-600 dark:text-slate-300 text-sm mb-6 space-y-1.5">
                          {service.description ? (
                            service.description.split('\n').map((line, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-[1.1rem] text-slate-400 mt-0.5">check_circle</span>
                                <span className="leading-snug">{line}</span>
                              </div>
                            ))
                          ) : (
                            <p>Core operational service center.</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className={`px-3 py-1 flex items-center gap-1 rounded-full text-[10px] font-black uppercase tracking-widest ${service.is_open ? 'bg-lime-200/80 text-lime-800 dark:bg-lime-900/50 dark:text-lime-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'}`}>
                          {service.is_open ? 'Active' : 'Closed'}
                          <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">ID: {service.id.substring(0,8)}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Visual placeholder card for aesthetics as per HTML */}
                <div className="relative overflow-hidden rounded-xl bg-primary min-h-[220px] group">
                  <img alt="Modern Hub Visualization" className="absolute inset-0 w-full h-full object-cover mix-blend-soft-light opacity-60 group-hover:scale-110 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQIFykdqY9bxzW57wG_mlvOt9ZGpIw0K1fmMMB3AKuXhzyufot3No9OAQWIbx5oh0CJBLeQLGAJFot8VkthbzybsW6zvyGDvXIIOuCSQc-OLgXcH3yvJ9ZOVoaYf8RD8dTvMDPOrYroAlAom9jhzR4aITNYGUzRY1WDXlTu2X7eA7g4Bn3tSvAOZoNS1PfnNpPHZtPj_MjHKBmsqaWPARNrMQYYgvpjcaMTDJGCFeymKFwnMcP8QSYYXSKlJlXvkcmDZ_6c6dKrUHv" />
                  <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent">
                    <h3 className="text-white text-xl font-bold">System Visual</h3>
                    <p className="text-white/80 text-sm">Real-time infrastructure monitoring active.</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Section: Admin Accounts */}
          {(activeSection === 'dashboard' || activeSection === 'admins') && (
            <section className="mb-16">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-on-surface">{t('superAdmin.adminAccounts')}</h2>
                  <p className="text-on-surface-variant text-sm mt-1">Registry of authorized personnel and access tiers.</p>
                </div>
                <button
                  onClick={() => openAdminModal()}
                  className="px-8 py-3.5 bg-surface-container-highest text-on-primary-container rounded-full font-bold flex items-center gap-2 hover:bg-primary-container transition-colors">
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  {t('superAdmin.createAdmin')}
                </button>
              </div>

              {/* Admin Table Container */}
              <div className="bg-surface-container-low rounded-xl overflow-hidden p-1">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{t('superAdmin.admin')}</th>
                        <th className="px-8 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{t('superAdmin.role')}</th>
                        <th className="px-8 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{t('superAdmin.assignedService')}</th>
                        <th className="px-8 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{t('common.status')}</th>
                        <th className="px-8 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-right">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high/50">
                      {adminAccounts.map(admin => (
                        <tr key={admin.id} className="bg-surface-container-lowest/40 hover:bg-surface-container-lowest transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {getInitials(admin.name)}
                              </div>
                              <div>
                                <p className="font-bold text-on-surface">{admin.name}</p>
                                <p className="text-xs text-on-surface-variant">{admin.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-tighter ${admin.role === 'super_admin' ? 'bg-error-container text-on-error-container' : admin.role === 'admin' ? 'bg-primary-container text-on-primary-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                              {admin.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-sm font-medium text-on-surface-variant">
                            {admin.service_name ? admin.service_name : 'Global Access'}
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${admin.is_active ? 'bg-tertiary' : 'bg-outline-variant'}`}></div>
                              <span className="text-xs font-semibold text-on-surface">
                                {admin.is_active ? 'Online' : 'Offline'}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openAdminModal(admin)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant transition-all">
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteAdmin(admin.id)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-low hover:bg-error/10 text-error transition-all">
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* Section: Users */}
          {(activeSection === 'dashboard' || activeSection === 'users') && (
            <section className="mb-16">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-on-surface">Registered Users</h2>
                  <p className="text-on-surface-variant text-sm mt-1">Manage public users and promote to staff roles.</p>
                </div>
              </div>
              <div className="bg-surface-container-low rounded-xl overflow-hidden p-1">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">User</th>
                        <th className="px-8 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Role</th>
                        <th className="px-8 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high/50">
                      {regularUsers.map(u => (
                        <tr key={u.id} className="bg-surface-container-lowest/40 hover:bg-surface-container-lowest transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">
                                {getInitials(u.name)}
                              </div>
                              <div>
                                <p className="font-bold text-on-surface">{u.name}</p>
                                <p className="text-xs text-on-surface-variant">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-tighter bg-surface-container-highest text-on-surface">
                              {u.role}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button
                              onClick={() => handlePromoteUser(u.id, 'admin')}
                              className="px-4 py-2 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container hover:text-white transition-all text-xs font-bold shadow-sm">
                              Promote to Admin
                            </button>
                          </td>
                        </tr>
                      ))}
                      {regularUsers.length === 0 && (
                        <tr>
                          <td colSpan="3" className="px-8 py-8 text-center text-on-surface-variant font-medium">
                            No regular users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* Section: Analytics */}
          {activeSection === 'analytics' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Metric Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Users', value: analyticsData?.overview?.total_users || 0, icon: 'person', color: 'bg-indigo-500' },
                  { label: 'System Hubs', value: analyticsData?.overview?.total_services || 0, icon: 'hub', color: 'bg-emerald-500' },
                  { label: 'Staff Admins', value: analyticsData?.overview?.total_admins || 0, icon: 'admin_panel_settings', color: 'bg-amber-500' },
                  { label: 'Daily Tickets', value: analyticsData?.overview?.tickets_today || 0, icon: 'confirmation_number', color: 'bg-rose-500' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:scale-105 transition-transform duration-500">
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                      <h4 className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</h4>
                    </div>
                    <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center text-white shadow-lg shadow-current/20`}>
                      <span className="material-symbols-outlined text-3xl">{stat.icon}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tickets by Status (Pie Chart) */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-500">pie_chart</span>
                    Operational Status Distribution
                  </h4>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData?.ticketsByStatus || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={8}
                          dataKey="count"
                          nameKey="status"
                        >
                          {(analyticsData?.ticketsByStatus || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#64748b'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-6 mt-4">
                    {(analyticsData?.ticketsByStatus || []).map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#64748b'][index % 5] }}></div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{entry.status} ({entry.count})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tickets by Service (Bar Chart) */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-500">bar_chart</span>
                    High-Volume Service Hubs
                  </h4>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData?.ticketsByService || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                        <Tooltip
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" fill="#10b981" radius={[10, 10, 10, 10]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Trend Analysis (Area Chart) */}
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                      <span className="material-symbols-outlined text-indigo-500 text-3xl">trending_up</span>
                      System Load Analysis
                    </h4>
                    <p className="text-slate-500 font-medium text-sm mt-1">7-Day volumetric ticket throughput</p>
                  </div>
                </div>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData?.last7DaysTrend || []}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                        dy={10}
                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short' })}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Placeholders for other sections */}
          {(activeSection === 'logs' || activeSection === 'settings') && (
            <div className="text-center py-20 bg-surface-container-lowest rounded-2xl border border-surface-container-low shadow-sm">
              <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">{activeSection === 'logs' ? 'history' : 'settings'}</span>
              <h3 className="text-2xl font-bold text-on-surface mb-2 capitalize">{activeSection}</h3>
              <p className="text-on-surface-variant">This section is currently under construction.</p>
            </div>
          )}

        </div>
      </main>

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4" onClick={() => setShowServiceModal(false)}>
          <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-10 pt-10 pb-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {editingService ? 'Service Configuration' : 'Establish New Service'}
                  </h3>
                  <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-widest">
                    {editingService ? `REVISING SYSTEM NODE: ${editingService.id}` : 'INITIALIZING GLOBAL SERVICE HUB'}
                  </p>
                </div>
                <button
                  onClick={() => setShowServiceModal(false)}
                  className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:rotate-90 transition-transform duration-300">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Left Column: Basic Info */}
              <div className="space-y-8">
                <section>
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6">Identity & Metadata</h4>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Service Designation</label>
                      <input
                        type="text"
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold"
                        value={serviceForm.name}
                        onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                        placeholder="e.g., Central Finance Hub"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Category Sector</label>
                        <select
                          className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold appearance-none cursor-pointer"
                          value={serviceForm.category}
                          onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">System Icon</label>
                        <input
                          type="text"
                          className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold"
                          value={serviceForm.icon}
                          onChange={(e) => setServiceForm({ ...serviceForm, icon: e.target.value })}
                          placeholder="hub, business, etc."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Service Brief</label>
                      <textarea
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold min-h-[120px] resize-none"
                        value={serviceForm.description}
                        onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                        placeholder="Define the core purpose and operational reach of this service node..."
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6">Contact Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Phone Number</label>
                      <input
                        type="tel"
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold"
                        value={serviceForm.phone_number}
                        onChange={(e) => setServiceForm({ ...serviceForm, phone_number: e.target.value })}
                        placeholder="+212 5XX XX XX XX"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Email Address</label>
                      <input
                        type="email"
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold"
                        value={serviceForm.email_address}
                        onChange={(e) => setServiceForm({ ...serviceForm, email_address: e.target.value })}
                        placeholder="contact@service.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Website</label>
                      <input
                        type="url"
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold"
                        value={serviceForm.website}
                        onChange={(e) => setServiceForm({ ...serviceForm, website: e.target.value })}
                        placeholder="https://www.service.com"
                      />
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column: Location & Visual */}
              <div className="space-y-8">
                <section>
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6">Geographic Localization</h4>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Physical Address</label>
                      <input
                        type="text"
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold"
                        value={serviceForm.address}
                        onChange={(e) => setServiceForm({ ...serviceForm, address: e.target.value })}
                        placeholder="Street, District, City..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Interactive Map Pin</label>
                      <MapPicker
                        lat={serviceForm.lat}
                        lng={serviceForm.lng}
                        onChange={(lat, lng) => setServiceForm({ ...serviceForm, lat, lng })}
                      />
                      <div className="flex gap-4 mt-4">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Latitude</p>
                          <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{serviceForm.lat.toFixed(6)}</p>
                        </div>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Longitude</p>
                          <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{serviceForm.lng.toFixed(6)}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium mt-2 text-center">Click on the map to automatically adjust service coordinates.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6">Visual Branding</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-3 ltr:ml-1 rtl:mr-1">Interface Accent Color</label>
                      <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <input
                          type="color"
                          className="w-12 h-12 rounded-lg cursor-pointer border-none bg-transparent"
                          value={serviceForm.color_theme}
                          onChange={(e) => setServiceForm({ ...serviceForm, color_theme: e.target.value })}
                        />
                        <input
                          type="text"
                          className="flex-1 bg-transparent border-none outline-none font-mono font-bold text-slate-700 dark:text-slate-300"
                          value={serviceForm.color_theme}
                          onChange={(e) => setServiceForm({ ...serviceForm, color_theme: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Logo</label>
                      <div className="flex items-center gap-4">
                        {serviceForm.logo_url && (
                          <img src={serviceForm.logo_url} alt="Logo Preview" className="w-12 h-12 rounded-lg object-contain bg-slate-100 border border-slate-200" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                          onChange={(e) => handleFileUpload(e, 'logo_url')}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Cover Image</label>
                      <div className="flex flex-col gap-2">
                        {serviceForm.cover_image_url && (
                          <img src={serviceForm.cover_image_url} alt="Cover Preview" className="w-full h-24 rounded-xl object-cover border border-slate-200" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                          onChange={(e) => handleFileUpload(e, 'cover_image_url')}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Banner Image</label>
                      <div className="flex flex-col gap-2">
                        {serviceForm.banner_url && (
                          <img src={serviceForm.banner_url} alt="Banner Preview" className="w-full h-24 rounded-xl object-cover border border-slate-200" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                          onChange={(e) => handleFileUpload(e, 'banner_url')}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-10 py-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4 sticky bottom-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
              <button
                className="px-8 py-4 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold"
                onClick={() => setShowServiceModal(false)}
              >
                Discard Changes
              </button>
              <button
                className="px-10 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all font-black shadow-xl shadow-indigo-200 dark:shadow-indigo-900/20 active:scale-95"
                onClick={editingService ? handleUpdateService : handleCreateService}
              >
                {editingService ? 'Sync Configuration' : 'Deploy Service Hub'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4" onClick={() => setShowAdminModal(false)}>
          <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-10 pt-10 pb-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {editingAdmin ? 'Administrator Profile' : 'Authorize New Personnel'}
                  </h3>
                  <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-widest">
                    {editingAdmin ? `MODIFIED ACCESS TIER: ${editingAdmin.id}` : 'GRANTING SYSTEM PRIVILEGES'}
                  </p>
                </div>
                <button
                  onClick={() => setShowAdminModal(false)}
                  className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:rotate-90 transition-transform duration-300">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="p-10 space-y-10">
              {/* Identity Section */}
              <section>
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6">Personal Credentials</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Full Legal Name</label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold"
                      value={adminForm.name}
                      onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                      placeholder="e.g., Jean Dupont"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Email Identifier</label>
                    <input
                      type="email"
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                      placeholder="admin@hubs.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Contact Protocol (Phone)</label>
                    <input
                      type="tel"
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold"
                      value={adminForm.phone_number}
                      onChange={(e) => setAdminForm({ ...adminForm, phone_number: e.target.value })}
                      placeholder="+212 6xx xxx xxx"
                    />
                  </div>
                </div>
              </section>

              {/* Security Section */}
              <section>
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6">Security & Access Control</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Privilege Level</label>
                    <select
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold appearance-none cursor-pointer"
                      value={adminForm.role}
                      onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                    >
                      <option value="admin">Service Admin</option>
                      <option value="staff">Operational Staff</option>
                      <option value="super_admin">Super Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Access Passphrase</label>
                    <input
                      type="password"
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      placeholder={editingAdmin ? "Unchanged (leave blank)" : "••••••••"}
                    />
                  </div>

                  {adminForm.role === 'admin' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Regional Branch Assignment</label>
                      <select
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold appearance-none cursor-pointer"
                        value={adminForm.service_id}
                        onChange={(e) => setAdminForm({ ...adminForm, service_id: e.target.value })}
                      >
                        <option value="">-- Central Administration (Global) --</option>
                        {services.map(service => (
                          <option key={service.id} value={service.id}>
                            {service.name} ({service.category})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex items-center justify-between p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${adminForm.is_active ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-slate-200 text-slate-500 grayscale'}`}>
                      <span className="material-symbols-outlined">{adminForm.is_active ? 'verified_user' : 'lock_reset'}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white leading-tight">Account Operational Status</p>
                      <p className="text-xs text-slate-500 font-medium">{adminForm.is_active ? 'Personnel can access administrative dashboards' : 'Access is temporarily revoked'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAdminForm({ ...adminForm, is_active: !adminForm.is_active })}
                    className={`relative w-14 h-8 rounded-full transition-all duration-300 ${adminForm.is_active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-sm ${adminForm.is_active ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="px-10 py-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4 sticky bottom-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
              <button
                className="px-8 py-4 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold"
                onClick={() => setShowAdminModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-10 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all font-black shadow-xl shadow-indigo-200 dark:shadow-indigo-900/20 active:scale-95"
                onClick={editingAdmin ? handleUpdateAdmin : handleCreateAdmin}
              >
                {editingAdmin ? 'Update Credentials' : 'Authorize Personnel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPage;
