import re

file_path = r'd:\pwa-project\frontend\src\pages\SuperAdminPage.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Split the content at '  const styles = {'
parts = content.split('  const styles = {')
if len(parts) < 2:
    print("Could not find 'const styles = {'")
    exit(1)

top_part = parts[0]

new_return = """
  return (
    <div className="bg-background text-on-surface selection:bg-primary-container selection:text-on-primary-container font-['Inter'] flex min-h-screen">
      {/* SideNavBar */}
      <aside className="h-screen w-72 rounded-r-[3rem] fixed left-0 top-0 bg-slate-50 dark:bg-slate-950 shadow-[12px_0_40px_rgba(13,52,89,0.04)] z-50 flex flex-col py-8 font-['Plus_Jakarta_Sans'] tracking-tight">
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
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveSection('services')}
            className={`w-full flex items-center gap-3 px-6 py-4 transition-all duration-300 rounded-xl ${activeSection === 'services' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 scale-95 active:scale-90 transition-transform'}`}>
            <span className="material-symbols-outlined">room_service</span>
            <span>Services</span>
          </button>
          <button 
            onClick={() => setActiveSection('admins')}
            className={`w-full flex items-center gap-3 px-6 py-4 transition-all duration-300 rounded-xl ${activeSection === 'admins' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 scale-95 active:scale-90 transition-transform'}`}>
            <span className="material-symbols-outlined">group</span>
            <span>Admin Accounts</span>
          </button>
          <button 
            onClick={() => setActiveSection('analytics')}
            className={`w-full flex items-center gap-3 px-6 py-4 transition-all duration-300 rounded-xl ${activeSection === 'analytics' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 scale-95 active:scale-90 transition-transform'}`}>
            <span className="material-symbols-outlined">monitoring</span>
            <span>Analytics</span>
          </button>
          <button 
            onClick={() => setActiveSection('logs')}
            className={`w-full flex items-center gap-3 px-6 py-4 transition-all duration-300 rounded-xl ${activeSection === 'logs' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 scale-95 active:scale-90 transition-transform'}`}>
            <span className="material-symbols-outlined">history</span>
            <span>Activity Logs</span>
          </button>
          <button 
            onClick={() => setActiveSection('settings')}
            className={`w-full flex items-center gap-3 px-6 py-4 transition-all duration-300 rounded-xl ${activeSection === 'settings' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 scale-95 active:scale-90 transition-transform'}`}>
            <span className="material-symbols-outlined">settings</span>
            <span>System Settings</span>
          </button>
        </nav>
        <div className="px-6 mt-auto">
          <button 
            onClick={() => openServiceModal()}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
            <span className="material-symbols-outlined text-sm">add</span>
            Create New Service
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <main className="ml-72 min-h-screen flex-1">
        {/* TopAppBar */}
        <header className="sticky top-0 w-full z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex justify-between items-center px-8 py-4 font-['Plus_Jakarta_Sans'] font-medium">
          <div className="flex items-center gap-6 flex-1">
            <div className="relative w-96">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-full py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none" 
                placeholder="Search system resources..." 
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
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
            <h1 className="text-5xl font-black text-on-surface tracking-tight mb-3">Super Admin Central</h1>
            <p className="text-xl text-on-surface-variant font-['Inter'] font-light">Manage global services and administrative accounts.</p>
          </header>

          {/* Section: Manage Services */}
          {(activeSection === 'dashboard' || activeSection === 'services') && (
            <section className="mb-16">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-on-surface">Manage Services</h2>
                  <p className="text-on-surface-variant text-sm mt-1">Overview of all active hubs and regional branches.</p>
                </div>
                <button 
                  onClick={() => openServiceModal()}
                  className="px-8 py-3.5 bg-gradient-to-r from-primary to-secondary text-white rounded-full font-bold flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                  Add New Service
                </button>
              </div>

              {/* Services Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {services.map(service => (
                  <div key={service.id} className="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between min-h-[220px] transition-transform hover:translate-y-[-4px] group border border-surface-container-low shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-2xl bg-primary-container/30 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">{service.icon || 'hub'}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openServiceModal(service)}
                          className="p-2 hover:bg-surface-container text-on-surface-variant rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteService(service.id)}
                          className="p-2 hover:bg-error-container/10 text-error rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mt-6">{service.name}</h3>
                      <p className="text-on-surface-variant text-sm mb-4">{service.description || 'Service operational center.'}</p>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest ${service.is_open ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-error-container text-on-error-container'}`}>
                          {service.is_open ? 'Active' : 'Closed'}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-medium">ID: {service.id}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Visual placeholder card for aesthetics as per HTML */}
                <div className="relative overflow-hidden rounded-xl bg-primary min-h-[220px] group">
                  <img alt="Modern Hub Visualization" className="absolute inset-0 w-full h-full object-cover mix-blend-soft-light opacity-60 group-hover:scale-110 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQIFykdqY9bxzW57wG_mlvOt9ZGpIw0K1fmMMB3AKuXhzyufot3No9OAQWIbx5oh0CJBLeQLGAJFot8VkthbzybsW6zvyGDvXIIOuCSQc-OLgXcH3yvJ9ZOVoaYf8RD8dTvMDPOrYroAlAom9jhzR4aITNYGUzRY1WDXlTu2X7eA7g4Bn3tSvAOZoNS1PfnNpPHZtPj_MjHKBmsqaWPARNrMQYYgvpjcaMTDJGCFeymKFwnMcP8QSYYXSKlJlXvkcmDZ_6c6dKrUHv"/>
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
                  <h2 className="text-2xl font-bold text-on-surface">Admin Accounts</h2>
                  <p className="text-on-surface-variant text-sm mt-1">Registry of authorized personnel and access tiers.</p>
                </div>
                <button 
                  onClick={() => openAdminModal()}
                  className="px-8 py-3.5 bg-surface-container-highest text-on-primary-container rounded-full font-bold flex items-center gap-2 hover:bg-primary-container transition-colors">
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  Create Admin Account
                </button>
              </div>

              {/* Admin Table Container */}
              <div className="bg-surface-container-low rounded-xl overflow-hidden p-1">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Administrator</th>
                        <th className="px-8 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Role</th>
                        <th className="px-8 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Assigned Service</th>
                        <th className="px-8 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-right">Actions</th>
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
                            {admin.service_id ? `Service ${admin.service_id}` : 'Global Access'}
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

          {/* Placeholders for other sections */}
          {(activeSection === 'analytics' || activeSection === 'logs' || activeSection === 'settings') && (
            <div className="text-center py-20 bg-surface-container-lowest rounded-2xl border border-surface-container-low shadow-sm">
              <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">{activeSection === 'analytics' ? 'monitoring' : activeSection === 'logs' ? 'history' : 'settings'}</span>
              <h3 className="text-2xl font-bold text-on-surface mb-2 capitalize">{activeSection}</h3>
              <p className="text-on-surface-variant">This section is currently under construction.</p>
            </div>
          )}

        </div>
      </main>

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={() => setShowServiceModal(false)}>
          <div className="bg-surface-container-lowest rounded-3xl p-8 w-[90%] max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-on-surface mb-1">
                {editingService ? 'Edit Service' : 'Create New Service'}
              </h3>
              <p className="text-on-surface-variant text-sm">
                {editingService ? 'Update service information' : 'Add a new service to the system'}
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Service Name</label>
                <input
                  type="text"
                  className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="Enter service name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Category</label>
                <input
                  type="text"
                  className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                  placeholder="Enter service category"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Description</label>
                <textarea
                  className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all min-h-[100px] resize-y"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Enter service description"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Icon</label>
                  <input
                    type="text"
                    className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    value={serviceForm.icon}
                    onChange={(e) => setServiceForm({ ...serviceForm, icon: e.target.value })}
                    placeholder="Enter icon name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Color Theme</label>
                  <input
                    type="text"
                    className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    value={serviceForm.color_theme}
                    onChange={(e) => setServiceForm({ ...serviceForm, color_theme: e.target.value })}
                    placeholder="e.g., #FF5733"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Estimated Wait Time</label>
                  <input
                    type="text"
                    className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    value={serviceForm.estimated_wait_time}
                    onChange={(e) => setServiceForm({ ...serviceForm, estimated_wait_time: e.target.value })}
                    placeholder="e.g., 15 minutes"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Max Capacity</label>
                  <input
                    type="number"
                    className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    value={serviceForm.max_capacity}
                    onChange={(e) => setServiceForm({ ...serviceForm, max_capacity: e.target.value ? parseInt(e.target.value) : '' })}
                    placeholder="Leave blank for unlimited"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Address</label>
                <input
                  type="text"
                  className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  value={serviceForm.address}
                  onChange={(e) => setServiceForm({ ...serviceForm, address: e.target.value })}
                  placeholder="Enter service address"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Location (Coordinates)</label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    value={serviceForm.lat}
                    onChange={(e) => setServiceForm({ ...serviceForm, lat: e.target.value })}
                    placeholder="Latitude"
                  />
                  <input
                    type="text"
                    className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    value={serviceForm.lng}
                    onChange={(e) => setServiceForm({ ...serviceForm, lng: e.target.value })}
                    placeholder="Longitude"
                  />
                </div>
              </div>

              <div className="flex gap-6 mt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded text-primary focus:ring-primary"
                    checked={serviceForm.is_open}
                    onChange={(e) => setServiceForm({ ...serviceForm, is_open: e.target.checked })}
                  />
                  <span className="text-on-surface font-medium">Service is open</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded text-primary focus:ring-primary"
                    checked={serviceForm.is_fast_track_available}
                    onChange={(e) => setServiceForm({ ...serviceForm, is_fast_track_available: e.target.checked })}
                  />
                  <span className="text-on-surface font-medium">Fast track available</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-surface-container-high">
              <button
                className="px-6 py-3 rounded-xl text-on-surface hover:bg-surface-container-low transition-all font-semibold"
                onClick={() => setShowServiceModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-dim text-white transition-all font-bold shadow-lg shadow-primary/20"
                onClick={editingService ? handleUpdateService : handleCreateService}
              >
                {editingService ? 'Update Service' : 'Create Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={() => setShowAdminModal(false)}>
          <div className="bg-surface-container-lowest rounded-3xl p-8 w-[90%] max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-on-surface mb-1">
                {editingAdmin ? 'Edit Admin Account' : 'Create Admin Account'}
              </h3>
              <p className="text-on-surface-variant text-sm">
                {editingAdmin ? 'Update admin account information' : 'Add a new admin account to the system'}
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Full Name</label>
                <input
                  type="text"
                  className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  placeholder="Enter admin name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Email Address</label>
                <input
                  type="email"
                  className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Phone Number</label>
                <input
                  type="tel"
                  className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  value={adminForm.phone_number}
                  onChange={(e) => setAdminForm({ ...adminForm, phone_number: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Password</label>
                <input
                  type="password"
                  className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  placeholder={editingAdmin ? "Leave blank to keep current password" : "Enter password"}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Role</label>
                <select
                  className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all cursor-pointer"
                  value={adminForm.role}
                  onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                >
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="mt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded text-primary focus:ring-primary"
                    checked={adminForm.is_active}
                    onChange={(e) => setAdminForm({ ...adminForm, is_active: e.target.checked })}
                  />
                  <span className="text-on-surface font-medium">Account is active</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-surface-container-high">
              <button
                className="px-6 py-3 rounded-xl text-on-surface hover:bg-surface-container-low transition-all font-semibold"
                onClick={() => setShowAdminModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-dim text-white transition-all font-bold shadow-lg shadow-primary/20"
                onClick={editingAdmin ? handleUpdateAdmin : handleCreateAdmin}
              >
                {editingAdmin ? 'Update Admin' : 'Create Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPage;
"""

new_content = top_part + new_return

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("SuperAdminPage.jsx updated successfully!")
