import React, { useState, useEffect } from 'react';
import { usePosStore } from '../store/usePosStore';
import { posApi } from '../services/api';
import { t } from '../utils/i18n';
import type { Customer } from '../types';
import { User, Plus, Search, Check, X, Phone } from 'lucide-react';

export const CustomerModal: React.FC = () => {
  const { isCustomerModalOpen, setCustomerModalOpen, setCustomer, customer: activeCustomer, showNotification } = usePosStore();
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const fetchCustomers = async (q = '') => {
    try {
      const list = await posApi.getCustomers(q);
      setCustomers(list || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isCustomerModalOpen) {
      fetchCustomers(search);
    }
  }, [isCustomerModalOpen, search]);

  if (!isCustomerModalOpen) return null;

  const handleSelect = (cust: Customer) => {
    setCustomer(cust);
    setCustomerModalOpen(false);
    showNotification(`${t('customer', 'Customer selected')}: ${cust.name}`, 'success');
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirst.trim() && !newPhone.trim()) {
      alert('First name or phone number is required!');
      return;
    }

    try {
      const created = await posApi.createCustomer({
        first_name: newFirst,
        last_name: newLast,
        phone: newPhone,
        email: newEmail,
      });

      setCustomer(created);
      setIsCreating(false);
      setCustomerModalOpen(false);
      showNotification(`${t('customer', 'Customer created')}: ${created.name}`, 'success');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100 max-h-[85vh] transition-colors">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-[#131b2e] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{t('select_customer', 'Select Customer')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('attach_customer_desc', 'Attach customer to this sale')}</p>
            </div>
          </div>
          <button
            onClick={() => setCustomerModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
          {isCreating ? (
            <form onSubmit={handleCreateCustomer} className="space-y-3 bg-slate-50 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">{t('add_new_customer', 'Add New Customer')}</h4>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">{t('first_name', 'First Name')} *</label>
                  <input
                    type="text"
                    required
                    value={newFirst}
                    onChange={e => setNewFirst(e.target.value)}
                    placeholder="John"
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">{t('last_name', 'Last Name')}</label>
                  <input
                    type="text"
                    value={newLast}
                    onChange={e => setNewLast(e.target.value)}
                    placeholder="Doe"
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">{t('phone_number', 'Phone Number')} *</label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">{t('email', 'Email')}</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                  {t('save_and_select', 'Save & Select')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700"
                >
                  {t('back', 'Back')}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Search & Add New button */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or phone..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shrink-0 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('add_new_customer', 'New')}</span>
                </button>
              </div>

              {/* Customers list */}
              <div className="space-y-2">
                {customers.map(cust => {
                  const isSelected = activeCustomer?.id === cust.id;
                  return (
                    <div
                      key={cust.id}
                      onClick={() => handleSelect(cust)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 dark:bg-blue-600/20 dark:border-blue-500 dark:text-white'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800 dark:bg-slate-900/60 dark:border-slate-800 dark:hover:bg-slate-800/80 dark:text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center space-x-1.5">
                          <span>{cust.name}</span>
                          {cust.id === 0 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                              Default
                            </span>
                          )}
                        </div>
                        {cust.phone && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            <span>{cust.phone}</span>
                          </div>
                        )}
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
