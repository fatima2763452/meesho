import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AvgCalcModal from '../components/customer/AvgCalcModal';
import { deleteCookie, getCookie, clearAllAuthData } from '../utils/cookies';

const formatCurrency = (val) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}).format(val);

const getStatusBadge = (status) => {
  const s = (status || 'Active').toLowerCase();
  if (s === 'deactivate') {
    return {
      label: 'DEACTIVATE',
      className: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    };
  }
  if (s === 'block') {
    return {
      label: 'BLOCK',
      className: 'bg-black text-slate-300 border-slate-700'
    };
  }
  if (s === 'freeze') {
    return {
      label: 'FREEZE',
      className: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    };
  }
  return {
    label: 'ACTIVE',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  };
};

const CustomerCard = ({ customer, onClick, onDeleteSwipe, onStatusClick }) => {
  const [translateX, setTranslateX] = useState(0);
  const startX = useRef(null);
  const currentX = useRef(null);
  const isDragging = useRef(false);
  const isOpen = useRef(false);

  const pnl = customer.totalPnl || 0;
  const isPositive = pnl > 0;
  const isNegative = pnl < 0;
  const statusInfo = getStatusBadge(customer.status);

  const startDrag = (clientX) => {
    startX.current = clientX;
    isDragging.current = true;
  };

  const moveDrag = (clientX) => {
    if (!isDragging.current || startX.current === null) return;
    currentX.current = clientX;
    const diff = currentX.current - startX.current;
    
    if (isOpen.current) {
      const newX = -150 + diff;
      setTranslateX(Math.min(0, Math.max(newX, -170)));
    } else {
      if (diff < 0) {
        setTranslateX(Math.max(diff, -170));
      }
    }
  };

  const cancelDrag = () => {
    isDragging.current = false;
    setTranslateX(isOpen.current ? -150 : 0);
    startX.current = null;
    currentX.current = null;
  };

  const endDrag = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    if (startX.current !== null && currentX.current !== null) {
      const diff = currentX.current - startX.current;
      if (isOpen.current) {
        if (diff > 30) {
          isOpen.current = false;
          setTranslateX(0);
        } else {
          setTranslateX(-150);
        }
      } else {
        if (diff < -35) {
          isOpen.current = true;
          setTranslateX(-150);
        } else {
          setTranslateX(0);
        }
      }
    } else {
      setTranslateX(isOpen.current ? -150 : 0);
    }
    
    startX.current = null;
    currentX.current = null;
  };

  const closeDrawer = () => {
    isOpen.current = false;
    setTranslateX(0);
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Background Drawer (Revealed on Swipe) */}
      <div className="absolute inset-y-0 right-0 w-[150px] flex items-stretch z-0 rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
        {/* Status Dropdown Trigger */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            closeDrawer();
            onStatusClick(customer);
          }}
          className="w-1/2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 flex flex-col items-center justify-center text-slate-200 border-r border-slate-700/80 transition-colors touch-manipulation cursor-pointer"
          title="Change Status"
        >
          <span className="material-symbols-outlined text-[20px] text-amber-400">tune</span>
          <span className="text-[10px] font-bold tracking-wider text-slate-300 mt-0.5">STATUS</span>
        </button>

        {/* Delete Button (Tap to delete, swiping alone does not delete) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            closeDrawer();
            onDeleteSwipe(customer);
          }}
          className="w-1/2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 flex flex-col items-center justify-center text-white transition-colors touch-manipulation cursor-pointer"
          title="Delete Customer"
        >
          <span className="material-symbols-outlined text-[20px]">delete</span>
          <span className="text-[10px] font-bold tracking-wider mt-0.5">DELETE</span>
        </button>
      </div>
      
      {/* Foreground Card */}
      <div 
        onClick={() => {
          if (isOpen.current || translateX < 0) {
            closeDrawer();
          } else {
            onClick(customer);
          }
        }}
        onTouchStart={(e) => startDrag(e.touches[0].clientX)}
        onTouchMove={(e) => moveDrag(e.touches[0].clientX)}
        onTouchEnd={endDrag}
        onTouchCancel={cancelDrag}
        onMouseDown={(e) => startDrag(e.clientX)}
        onMouseMove={(e) => moveDrag(e.clientX)}
        onMouseUp={endDrag}
        onMouseLeave={cancelDrag}
        style={{ transform: `translateX(${translateX}px)`, transition: isDragging.current ? 'none' : 'transform 0.25s ease-out' }}
        className="bg-slate-900/95 border border-slate-800 rounded-lg p-3.5 sm:p-4 hover:border-blue-500/50 cursor-pointer relative z-10 w-full touch-pan-y select-none"
      >
        <div className="flex justify-between items-start mb-2 relative z-10 gap-2">
          <div className="min-w-0 flex-1 overflow-hidden pr-1">
            <h3 className="font-medium text-slate-100 text-sm sm:text-base truncate" title={customer.name}>
              {customer.name}
            </h3>
            <span className="font-mono text-[11px] text-slate-400 block truncate">{customer.customerId}</span>
          </div>
          
          <div className="shrink-0 flex items-center">
            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800 relative z-10">
          <span className="text-slate-500 text-[11px] uppercase tracking-wider font-bold">TOTAL P&L</span>
          <span className={`font-mono text-xs font-bold ${
            isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-slate-500'
          }`}>
            {pnl !== 0 ? (isPositive ? '+' : '') + formatCurrency(pnl) : '₹0.00'}
          </span>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [isAvgCalcOpen, setIsAvgCalcOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ id: '', name: '', mobileLast4: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListLoading, setIsListLoading] = useState(true);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status Change Modal State
  const [customerForStatus, setCustomerForStatus] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState('Active');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const settingsRef = useRef(null);
  
  const navigate = useNavigate();

  const handleOpenStatusModal = (customer) => {
    setCustomerForStatus(customer);
    setSelectedNewStatus(customer.status || 'Active');
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatus = (customer, newStatus) => {
    if (!customer) return;
    setCustomers(prev => prev.map(c => c._id === customer._id ? { ...c, status: newStatus } : c));
    try {
      const saved = JSON.parse(localStorage.getItem('customerStatuses') || '{}');
      saved[customer._id] = newStatus;
      localStorage.setItem('customerStatuses', JSON.stringify(saved));
    } catch (e) {}
    // Silently attempt API sync in background if available
    api.put(`/customers/${customer._id}/status`, { status: newStatus }).catch(() => {});
    setIsStatusModalOpen(false);
    setCustomerForStatus(null);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo') || getCookie('userInfo');
    if (userInfo) {
      try {
        const parsedUser = typeof userInfo === 'string' ? JSON.parse(userInfo) : userInfo;
        setUser(parsedUser);
        fetchCustomers(parsedUser._id || 'owner_id');
      } catch (e) {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchCustomers = async (ownerId) => {
    setIsListLoading(true);
    try {
      const { data } = await api.get(`/customers?ownerId=${ownerId}`);
      if (Array.isArray(data)) {
        let saved = {};
        try {
          saved = JSON.parse(localStorage.getItem('customerStatuses') || '{}');
        } catch (e) {}
        const merged = data.map(c => ({
          ...c,
          status: saved[c._id] || c.status || 'Active'
        }));
        setCustomers(merged);
      } else {
        console.error('API did not return an array. Check VITE_URL!', data);
        setCustomers([]);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setCustomers([]);
    } finally {
      setIsListLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/customers', {
        customerId: newCustomer.id,
        name: newCustomer.name,
        mobileLast4: newCustomer.mobileLast4,
        ownerId: user._id || 'owner_id'
      });
      
      setNewCustomer({ id: '', name: '', mobileLast4: '' });
      setIsModalOpen(false);
      fetchCustomers(user._id || 'owner_id'); // Refresh list
    } catch (err) {
      console.error('Failed to create customer API error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create customer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    clearAllAuthData();
    navigate('/login');
  };

  const handleCustomerClick = (customer) => {
    navigate(`/customer/${customer._id}`, { state: { customer: { ...customer, id: customer.customerId } } });
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/customers/${customerToDelete._id}`);
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
      fetchCustomers(user._id);
    } catch (err) {
      console.error('Failed to delete customer', err);
      alert(err.response?.data?.message || 'Failed to delete customer');
    } finally {
      setIsDeleting(false);
    }
  };
  // -------------------------------------------------------------
  // MASTER DASHBOARD VIEW
  // -------------------------------------------------------------
  return (
    <div className="bg-slate-950 text-slate-200 min-h-screen flex flex-col overflow-x-hidden font-sans antialiased relative">
      {/* Create Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-white">Add New Customer</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              {error && <div className="text-rose-400 bg-rose-500/10 p-3 rounded text-sm">{error}</div>}
              
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Customer ID</label>
                <input 
                  type="text" 
                  required
                  value={newCustomer.id}
                  onChange={e => setNewCustomer({...newCustomer, id: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                  placeholder="e.g. CUST-1001"
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Customer Name</label>
                <input 
                  type="text" 
                  required
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                  placeholder="e.g. Apex Global Funds"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mobile Number (Last 4 Digits)</label>
                <div className="flex w-full bg-slate-950 border border-slate-700 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                  <span className="flex items-center px-3 bg-slate-900 border-r border-slate-700 text-slate-500 font-mono tracking-widest text-sm">XXXXXX</span>
                  <input 
                    type="text" 
                    maxLength={4}
                    value={newCustomer.mobileLast4}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 4) {
                        setNewCustomer({...newCustomer, mobileLast4: val});
                      }
                    }}
                    className="w-full bg-transparent px-3 py-2.5 text-sm outline-none font-mono tracking-widest placeholder:text-slate-600"
                    placeholder="7890"
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Customer'}
                <span className="material-symbols-outlined text-[18px]">person_add</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {isDeleteModalOpen && customerToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-rose-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl shadow-rose-900/20 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
              <span className="material-symbols-outlined text-rose-500 text-3xl">warning</span>
            </div>
            
            <h3 className="text-xl font-bold text-white text-center mb-2">Move to Recycle Bin?</h3>
            <p className="text-slate-400 text-sm text-center mb-6">
              You are about to delete <span className="text-rose-400 font-semibold">{customerToDelete.name}</span>. This customer will be moved to the Recycle Bin. Their trades and data will be safely preserved.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                disabled={isDeleting}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteCustomer}
                disabled={isDeleting}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                {isDeleting ? 'Moving...' : 'Move to Bin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Customer Status Modal */}
      {isStatusModalOpen && customerForStatus && (
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>

            <h3 className="text-lg font-bold text-white text-center mb-1">Update Customer Status</h3>
            <p className="text-slate-400 text-xs text-center mb-4 truncate px-2">
              Client: <span className="text-white font-semibold">{customerForStatus.name}</span> ({customerForStatus.customerId})
            </p>

            <div className="space-y-2 mb-4">
              {[
                { 
                  id: 'Active', 
                  label: 'ACTIVE', 
                  border: 'border-emerald-500/40', 
                  bg: 'bg-emerald-950/40 text-emerald-300', 
                  activeBg: 'bg-emerald-500/20 ring-2 ring-emerald-500', 
                  icon: 'check_circle', 
                  desc: 'Account is live and running normally (Green)' 
                },
                { 
                  id: 'Deactivate', 
                  label: 'DEACTIVATE', 
                  border: 'border-amber-500/40', 
                  bg: 'bg-amber-950/40 text-amber-300', 
                  activeBg: 'bg-amber-500/20 ring-2 ring-amber-500', 
                  icon: 'warning', 
                  desc: 'Account is deactivated / trading paused (Yellow)' 
                },
                { 
                  id: 'Block', 
                  label: 'BLOCK', 
                  border: 'border-slate-700', 
                  bg: 'bg-black text-slate-200', 
                  activeBg: 'bg-zinc-900 ring-2 ring-slate-400', 
                  icon: 'block', 
                  desc: 'Account is blocked / access restricted (Black)' 
                },
                { 
                  id: 'Freeze', 
                  label: 'FREEZE', 
                  border: 'border-rose-500/40', 
                  bg: 'bg-rose-950/40 text-rose-300', 
                  activeBg: 'bg-rose-500/20 ring-2 ring-rose-500', 
                  icon: 'ac_unit', 
                  desc: 'Account is frozen. Funds locked (Red)' 
                }
              ].map(opt => {
                const isSelected = selectedNewStatus === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedNewStatus(opt.id)}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${opt.border} ${opt.bg} ${isSelected ? opt.activeBg : 'opacity-75 hover:opacity-100'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>
                      <div>
                        <span className="font-bold text-xs tracking-wider block">{opt.label}</span>
                        <span className="text-[10px] text-slate-400 leading-tight block">{opt.desc}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[18px] text-white">radio_button_checked</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Warning Message Box */}
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 mb-4 flex items-start gap-2 text-amber-300 text-xs">
              <span className="material-symbols-outlined text-[18px] text-amber-400 shrink-0 mt-0.5">report_problem</span>
              <p className="leading-relaxed">
                <span className="font-bold">Warning:</span> Changing status to <span className="font-bold underline uppercase">{selectedNewStatus}</span> will reflect immediately on the client card.
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsStatusModalOpen(false);
                  setCustomerForStatus(null);
                }}
                disabled={isStatusUpdating}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(customerForStatus, selectedNewStatus)}
                disabled={isStatusUpdating}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 disabled:opacity-50"
              >
                {isStatusUpdating ? 'Updating...' : 'Confirm Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <header className="p-4 flex items-center justify-between border-b border-slate-800/60">
        {/* Left top logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 border border-blue-400/30">
            <span className="material-symbols-outlined text-[22px]">trending_up</span>
          </div>
          {/* <div className="flex flex-col">
            <span className="font-bold text-slate-100 tracking-wide text-sm leading-none">TITANIUM</span>
            <span className="text-[10px] font-semibold text-blue-400 tracking-wider uppercase leading-tight mt-0.5">TRADE</span>
          </div> */}
        </div>

        {/* Right Action Buttons */}
        <div className="flex gap-1.5 sm:gap-2.5 items-center">
          {/* Dark / Light Theme Toggle Button (Outside) */}
          <button 
            onClick={toggleTheme} 
            className="bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600/20 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isDarkMode ? 'dark_mode' : 'light_mode'}
            </span>
            <span className="hidden sm:inline">{isDarkMode ? 'Dark' : 'Light'}</span>
          </button>

          {/* Calculator Button (Outside) */}
          <button 
            onClick={() => setIsAvgCalcOpen(true)} 
            className="bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/20 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors"
            title="Calculator"
          >
            <span className="material-symbols-outlined text-[18px]">calculate</span>
            <span className="hidden sm:inline">Calculator</span>
          </button>

          {/* Recycle Bin Button (Outside) */}
          <button 
            onClick={() => navigate('/recycle-bin')} 
            className="bg-rose-600/10 text-rose-400 border border-rose-500/20 hover:bg-rose-600/20 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors"
            title="Recycle Bin"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            <span className="hidden sm:inline">Recycle Bin</span>
          </button>

          {/* Form Button */}
          <button 
            onClick={() => navigate('/account-opening')} 
            className="bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">description</span> 
            <span>Form</span>
          </button>

          {/* Settings Menu Dropdown */}
          <div className="relative" ref={settingsRef}>
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
              className="text-slate-400 p-2 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors flex items-center justify-center border border-slate-700/50 bg-slate-900" 
              title="Settings"
            >
              <span className="material-symbols-outlined text-[22px]">settings</span>
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-[120] animate-in fade-in zoom-in-95 duration-150">
                {/* 1. Light or Dark Mode */}
                <button 
                  onClick={toggleTheme} 
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-200 hover:bg-slate-800 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px] text-indigo-400">
                      {isDarkMode ? 'dark_mode' : 'light_mode'}
                    </span>
                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                    {isDarkMode ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* 2. Calculator */}
                <button 
                  onClick={() => { setIsSettingsOpen(false); setIsAvgCalcOpen(true); }} 
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px] text-emerald-400">calculate</span>
                  Calculator
                </button>

                {/* 3. Recycle Bin / Delete */}
                <button 
                  onClick={() => { setIsSettingsOpen(false); navigate('/recycle-bin'); }} 
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px] text-rose-400">delete</span>
                  Recycle Bin
                </button>

                <div className="border-t border-slate-800 my-1"></div>

                {/* 4. Logout */}
                <button 
                  onClick={handleLogout} 
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 pt-3 pb-24 relative z-0">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[20px]">search</span>
            <input 
              className="bg-slate-900/50 border border-slate-800 text-slate-200 text-sm rounded-lg pl-10 pr-4 py-3 focus:border-blue-500 focus:ring-0 transition-colors w-full placeholder:text-slate-500 shadow-inner" 
              placeholder="Search Master Client Registry..." 
              type="text"
            />
          </div>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-[11px] tracking-widest uppercase">
            <span className="material-symbols-outlined text-[16px]">group</span>
            MASTER CLIENT REGISTRY
          </div>
          <div className="flex items-center gap-2">
            <button className="text-slate-400 hover:text-blue-400 transition-colors">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
            </button>
          </div>
        </div>

        {/* Optimized List View */}
        <div className="space-y-4">
          {isListLoading ? (
            // Skeleton Loader
            [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div>
                    <div className="w-32 h-4 bg-slate-800 rounded animate-pulse"></div>
                    <div className="w-20 h-3 bg-slate-800/50 rounded mt-2 animate-pulse"></div>
                  </div>
                  <div className="w-16 h-5 bg-slate-800 rounded animate-pulse"></div>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800 relative z-10">
                  <div className="w-16 h-3 bg-slate-800 rounded animate-pulse"></div>
                  <div className="w-12 h-4 bg-slate-800 rounded animate-pulse"></div>
                </div>
              </div>
            ))
          ) : customers.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
              <p>No customers found. Add one below!</p>
            </div>
          ) : (
            customers.map(customer => (
              <CustomerCard 
                key={customer._id}
                customer={customer}
                onClick={handleCustomerClick}
                onDeleteSwipe={(c) => {
                  setCustomerToDelete(c);
                  setIsDeleteModalOpen(true);
                }}
                onStatusClick={handleOpenStatusModal}
              />
            ))
          )}
        </div>
      </main>

      {/* Floating Action Button (FAB) */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-400 text-white rounded-2xl shadow-[0_4px_20px_rgba(59,130,246,0.4)] flex items-center justify-center active:scale-95 transition-transform z-50"
      >
        <span className="material-symbols-outlined text-[28px]">person_add</span>
      </button>
      <AvgCalcModal isOpen={isAvgCalcOpen} onClose={() => setIsAvgCalcOpen(false)} />
    </div>
  );
};

export default Dashboard;
