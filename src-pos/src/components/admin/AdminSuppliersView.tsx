import React, { useState, useEffect } from 'react';
import { posApi } from '../../services/api';
import { db } from '../../db';
import { usePosStore } from '../../store/usePosStore';
import { formatPrice } from '../../utils/format';
import { t } from '../../utils/i18n';
import type { Supplier, PurchaseInvoice, PurchaseItem, Product } from '../../types';
import {
  Truck,
  Building2,
  Search,
  Plus,
  Minus,
  RefreshCw,
  Edit3,
  Trash2,
  Printer,
  FileText,
  DollarSign,
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  X,
  Save,
  Phone,
  Mail,
  MapPin,
  Tag,
  CreditCard,
  Building,
} from 'lucide-react';

export const AdminSuppliersView: React.FC = () => {
  const { initData, showNotification } = usePosStore();

  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases');

  // Suppliers state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    tax_number: '',
    address: '',
    notes: '',
  });

  // Purchases / Stock Intake state
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPurchasesAmount, setTotalPurchasesAmount] = useState(0);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);

  // Purchase Filters
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [filterSupplierId, setFilterSupplierId] = useState<number>(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Purchase Modal (New Stock Intake)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState<number | null>(null);
  const [purchaseForm, setPurchaseForm] = useState<{
    invoice_number: string;
    supplier_id: number;
    supplier_name: string;
    date_received: string;
    status: 'received' | 'pending' | 'cancelled';
    payment_status: 'paid' | 'unpaid' | 'partial';
    payment_method: string;
    items: PurchaseItem[];
    tax_amount: number;
    notes: string;
  }>({
    invoice_number: '',
    supplier_id: 0,
    supplier_name: '',
    date_received: new Date().toISOString().slice(0, 16),
    status: 'received',
    payment_status: 'paid',
    payment_method: 'bank_transfer',
    items: [],
    tax_amount: 0,
    notes: '',
  });

  // Product Catalog Search inside Purchase Modal
  const [productQuery, setProductQuery] = useState('');
  const [matchingProducts, setMatchingProducts] = useState<Product[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Bulk selection states
  const [selectedPurchaseIds, setSelectedPurchaseIds] = useState<number[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const toggleSelectPurchase = (id: number) => {
    setSelectedPurchaseIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllPurchases = () => {
    if (selectedPurchaseIds.length === purchases.length) {
      setSelectedPurchaseIds([]);
    } else {
      setSelectedPurchaseIds(purchases.map(p => p.id));
    }
  };

  const handleBulkDeletePurchases = async () => {
    if (selectedPurchaseIds.length === 0) return;
    if (!window.confirm(`${t('confirm_bulk_delete', 'Are you sure you want to delete the selected items?')} (${selectedPurchaseIds.length})`)) {
      return;
    }
    setIsBulkDeleting(true);
    try {
      const resp = await posApi.bulkDelete('purchases', selectedPurchaseIds);
      if (resp.success) {
        showNotification(t('items_deleted_success', 'Selected items deleted successfully!'), 'success');
        setSelectedPurchaseIds([]);
        fetchPurchases(currentPage);
      }
    } catch (err: any) {
      showNotification('Error deleting: ' + (err.message || 'Error'), 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const toggleSelectSupplier = (id: number) => {
    setSelectedSupplierIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllSuppliers = () => {
    if (selectedSupplierIds.length === suppliers.length) {
      setSelectedSupplierIds([]);
    } else {
      setSelectedSupplierIds(suppliers.map(s => s.id));
    }
  };

  const handleBulkDeleteSuppliers = async () => {
    if (selectedSupplierIds.length === 0) return;
    if (!window.confirm(`${t('confirm_bulk_delete', 'Are you sure you want to delete the selected items?')} (${selectedSupplierIds.length})`)) {
      return;
    }
    setIsBulkDeleting(true);
    try {
      const resp = await posApi.bulkDelete('suppliers', selectedSupplierIds);
      if (resp.success) {
        showNotification(t('items_deleted_success', 'Selected items deleted successfully!'), 'success');
        setSelectedSupplierIds([]);
        fetchSuppliers();
      }
    } catch (err: any) {
      showNotification('Error deleting: ' + (err.message || 'Error'), 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Fetch Suppliers
  const fetchSuppliers = async (q = '') => {
    setIsLoadingSuppliers(true);
    try {
      const res = await posApi.getSuppliers(q);
      setSuppliers(res.suppliers || []);
      setSelectedSupplierIds([]);
    } catch (err: any) {
      showNotification('Failed to load suppliers: ' + (err.message || 'Error'), 'error');
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

  // Fetch Purchases / Invoices
  const fetchPurchases = async (page = 1) => {
    setIsLoadingPurchases(true);
    try {
      const res = await posApi.getPurchases(
        page,
        20,
        purchaseSearch,
        filterSupplierId,
        filterStatus,
        filterDateFrom,
        filterDateTo
      );
      setPurchases(res.purchases || []);
      setTotalPurchases(res.total || 0);
      setTotalPages(res.total_pages || 1);
      setTotalPurchasesAmount(res.total_amount || 0);
      setCurrentPage(page);
    } catch (err: any) {
      showNotification('Failed to load purchases: ' + (err.message || 'Error'), 'error');
    } finally {
      setIsLoadingPurchases(false);
    }
  };

  useEffect(() => {
    fetchSuppliers(supplierSearch);
  }, [supplierSearch]);

  useEffect(() => {
    fetchPurchases(1);
  }, [filterSupplierId, filterStatus, filterDateFrom, filterDateTo]);

  // Handle Supplier Save
  const handleOpenAddSupplier = () => {
    setSelectedSupplier(null);
    setSupplierFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      tax_number: '',
      address: '',
      notes: '',
    });
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (supp: Supplier) => {
    setSelectedSupplier(supp);
    setSupplierFormData({
      name: supp.name,
      company: supp.company,
      email: supp.email,
      phone: supp.phone,
      tax_number: supp.tax_number,
      address: supp.address,
      notes: supp.notes,
    });
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierFormData.name.trim() && !supplierFormData.company.trim()) {
      alert('Supplier name or company is required');
      return;
    }

    try {
      if (selectedSupplier) {
        await posApi.updateSupplier(selectedSupplier.id, supplierFormData);
        showNotification('Supplier updated successfully', 'success');
      } else {
        await posApi.createSupplier(supplierFormData);
        showNotification('Supplier created successfully', 'success');
      }
      setIsSupplierModalOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      showNotification('Failed to save supplier: ' + (err.message || 'Error'), 'error');
    }
  };

  const handleDeleteSupplier = async (supp: Supplier) => {
    if (!confirm(`Are you sure you want to delete supplier "${supp.company || supp.name}"?`)) {
      return;
    }
    try {
      await posApi.deleteSupplier(supp.id);
      showNotification('Supplier deleted', 'success');
      fetchSuppliers();
    } catch (err: any) {
      showNotification('Failed to delete: ' + (err.message || 'Error'), 'error');
    }
  };

  // Handle Purchase (Stock Intake) Form
  const handleOpenAddPurchase = () => {
    setEditingPurchaseId(null);
    setPurchaseForm({
      invoice_number: 'INV-' + Math.floor(100000 + Math.random() * 900000),
      supplier_id: suppliers.length > 0 ? suppliers[0].id : 0,
      supplier_name: suppliers.length > 0 ? (suppliers[0].company || suppliers[0].name) : '',
      date_received: new Date().toISOString().slice(0, 16),
      status: 'received',
      payment_status: 'paid',
      payment_method: 'bank_transfer',
      items: [],
      tax_amount: 0,
      notes: '',
    });
    setProductQuery('');
    setMatchingProducts([]);
    setIsPurchaseModalOpen(true);
  };

  const handleOpenEditPurchase = (p: PurchaseInvoice) => {
    setEditingPurchaseId(p.id);
    setPurchaseForm({
      invoice_number: p.invoice_number,
      supplier_id: p.supplier_id,
      supplier_name: p.supplier_name,
      date_received: p.date_received ? p.date_received.replace(' ', 'T').slice(0, 16) : new Date().toISOString().slice(0, 16),
      status: p.status,
      payment_status: p.payment_status,
      payment_method: p.payment_method,
      items: JSON.parse(JSON.stringify(p.items || [])),
      tax_amount: p.tax_amount || 0,
      notes: p.notes || '',
    });
    setProductQuery('');
    setMatchingProducts([]);
    setIsPurchaseModalOpen(true);
  };

  // Product catalogue search for purchase items
  useEffect(() => {
    if (!productQuery.trim()) {
      setMatchingProducts([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingProducts(true);
      try {
        const q = productQuery.toLowerCase();
        const all = await db.products.toArray();
        const matched = all.filter(
          p =>
            p.name.toLowerCase().includes(q) ||
            p.sku?.toLowerCase().includes(q) ||
            p.barcode?.toLowerCase().includes(q)
        );
        setMatchingProducts(matched.slice(0, 8));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingProducts(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [productQuery]);

  const handleAddProductToPurchase = (prod: Product) => {
    const existingIndex = purchaseForm.items.findIndex(it => it.product_id === prod.id && !it.variation_id);
    if (existingIndex > -1) {
      const items = [...purchaseForm.items];
      items[existingIndex].quantity += 1;
      items[existingIndex].line_total = items[existingIndex].quantity * items[existingIndex].cost_price;
      setPurchaseForm({ ...purchaseForm, items });
    } else {
      const newItem: PurchaseItem = {
        product_id: prod.id,
        name: prod.name,
        sku: prod.sku || '',
        quantity: 1,
        cost_price: prod.cost_price || (prod.price ? prod.price * 0.7 : 0),
        sale_price: prod.price || 0,
        line_total: prod.cost_price || (prod.price ? prod.price * 0.7 : 0),
      };
      setPurchaseForm({ ...purchaseForm, items: [...purchaseForm.items, newItem] });
    }
    setProductQuery('');
    setMatchingProducts([]);
  };

  const handlePurchaseItemChange = (index: number, field: 'quantity' | 'cost_price' | 'sale_price', val: number) => {
    const items = [...purchaseForm.items];
    const num = Math.max(0, val);
    items[index][field] = num;
    items[index].line_total = items[index].quantity * items[index].cost_price;
    setPurchaseForm({ ...purchaseForm, items });
  };

  const handleRemovePurchaseItem = (index: number) => {
    const items = [...purchaseForm.items];
    items.splice(index, 1);
    setPurchaseForm({ ...purchaseForm, items });
  };

  const purchaseSubtotal = purchaseForm.items.reduce((sum, it) => sum + it.line_total, 0);
  const purchaseTotal = purchaseSubtotal + (parseFloat(String(purchaseForm.tax_amount)) || 0);

  // Save Purchase Invoice & Receive Stock
  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseForm.items.length === 0) {
      alert('Please add at least one product to the stock intake invoice.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...purchaseForm,
        tax_amount: parseFloat(String(purchaseForm.tax_amount)) || 0,
      };

      if (editingPurchaseId) {
        await posApi.updatePurchase(editingPurchaseId, payload);
        showNotification('Stock intake invoice updated!', 'success');
      } else {
        await posApi.createPurchase(payload);
        showNotification('Stock successfully received and inventory updated!', 'success');
      }
      setIsPurchaseModalOpen(false);
      fetchPurchases(currentPage);
      fetchSuppliers();
      // Immediately refresh local catalogue cache so stock is reflected everywhere
      usePosStore.getState().syncCatalog(true).catch(console.error);
    } catch (err: any) {
      showNotification('Failed to save purchase: ' + (err.message || 'Error'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePurchase = async (p: PurchaseInvoice) => {
    if (!confirm(`Are you sure you want to delete invoice "${p.invoice_number}"? Received stock will be adjusted.`)) {
      return;
    }
    try {
      await posApi.deletePurchase(p.id);
      showNotification('Invoice deleted and stock adjusted', 'success');
      fetchPurchases(currentPage);
      fetchSuppliers();
      usePosStore.getState().syncCatalog(true).catch(console.error);
    } catch (err: any) {
      showNotification('Failed to delete: ' + (err.message || 'Error'), 'error');
    }
  };

  const currencySymbol = initData?.store?.currency_symbol || '$';

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100">
      {/* Top Tab Switcher */}
      <div className="px-6 pt-5 pb-0 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-300/60 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('purchases')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'purchases'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md shadow-black/5'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('stock_inward', 'Stock Inward & Invoices')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('suppliers')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'suppliers'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md shadow-black/5'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{t('suppliers_directory', 'Suppliers Directory')} ({suppliers.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PURCHASES / STOCK INTAKE TAB */}
      {/* ========================================================================= */}
      {activeTab === 'purchases' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* KPI Stats Bar */}
          <div className="p-6 pb-0 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">{t('total_purchases', 'Total Purchases')}</span>
                <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1 block">
                  {formatPrice(totalPurchasesAmount, initData?.store)}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">{t('stock_inward', 'Invoices Received')}</span>
                <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1 block">
                  {totalPurchases}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">{t('suppliers', 'Active Suppliers')}</span>
                <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1 block">
                  {suppliers.length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Building className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="p-6 pb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#0f172a] p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={purchaseSearch}
                  onChange={e => setPurchaseSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchPurchases(1)}
                  placeholder={t('search_placeholder', 'Search by Invoice #, Supplier or notes...')}
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>

              {/* Supplier Filter */}
              <select
                value={filterSupplierId}
                onChange={e => setFilterSupplierId(parseInt(e.target.value) || 0)}
                className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value={0}>{t('suppliers_directory', 'All Suppliers')}</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.company || s.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">{t('all', 'All Statuses')}</option>
                <option value="received">{t('completed_sales', 'Received')}</option>
                <option value="pending">{t('in_progress', 'Pending')}</option>
                <option value="cancelled">{t('cancel', 'Cancelled')}</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenAddPurchase}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('new_stock_intake', '+ New Stock Intake (მიღება)')}</span>
            </button>
          </div>

          {/* Purchases Table */}
          <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col">
            <div className="flex-1 bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoadingPurchases ? (
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2 text-blue-500" />
                    <span>{t('loading', 'Loading stock intake invoices...')}</span>
                  </div>
                ) : purchases.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <span className="text-sm font-medium">{t('no_orders', 'No purchase invoices found')}</span>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                        <th className="py-3 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={purchases.length > 0 && selectedPurchaseIds.length === purchases.length}
                            onChange={toggleSelectAllPurchases}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </th>
                        <th className="py-3 px-4">{t('invoice_number', 'Invoice / Waybill #')}</th>
                        <th className="py-3 px-3">{t('supplier_name', 'Supplier')}</th>
                        <th className="py-3 px-3">{t('date_received', 'Date Received')}</th>
                        <th className="py-3 px-3 text-center">{t('qty', 'Items Count')}</th>
                        <th className="py-3 px-3 text-right">{t('amount', 'Total Cost')}</th>
                        <th className="py-3 px-3 text-center">{t('status', 'Stock Status')}</th>
                        <th className="py-3 px-3 text-center">{t('payment_method', 'Payment')}</th>
                        <th className="py-3 px-4 text-right">{t('actions', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {purchases.map(p => {
                        const isSelected = selectedPurchaseIds.includes(p.id);
                        return (
                        <tr key={p.id} className={`transition-colors ${isSelected ? 'bg-blue-50/60 dark:bg-blue-950/20' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'}`}>
                          {/* Checkbox */}
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectPurchase(p.id)}
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>

                          <td className="py-3 px-4 font-bold font-mono text-blue-600 dark:text-blue-400">
                            #{p.invoice_number}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            {p.supplier_name || 'Direct Supplier'}
                          </td>
                          <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                            {p.date_received}
                          </td>
                          <td className="py-3 px-3 text-center font-bold font-mono">
                            {p.items_count}
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold font-mono text-slate-900 dark:text-white">
                            {formatPrice(p.total_amount, initData?.store)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                p.status === 'received'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400'
                                  : p.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                p.payment_status === 'paid'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {p.payment_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditPurchase(p)}
                                title={t('edit', 'Inspect & Edit Stock Intake')}
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 transition-all cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePurchase(p)}
                                title={t('delete', 'Delete & Adjust Inventory')}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );})}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Floating Bulk Action Bar (Purchases) */}
          {selectedPurchaseIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center justify-between p-3.5 px-5 bg-slate-900/95 dark:bg-slate-800/95 text-white rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 animate-slideUp gap-6 min-w-[340px]">
              <div className="flex items-center space-x-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-bold font-mono">
                  {selectedPurchaseIds.length} {t('selected_count', 'Selected')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedPurchaseIds([])}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleBulkDeletePurchases}
                  disabled={isBulkDeleting}
                  className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isBulkDeleting ? t('processing', 'Deleting...') : t('delete_selected', 'Delete Selected')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUPPLIERS DIRECTORY TAB */}
      {/* ========================================================================= */}
      {activeTab === 'suppliers' && (
        <div className="flex-1 flex flex-col overflow-hidden p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-80">
              <input
                type="text"
                value={supplierSearch}
                onChange={e => setSupplierSearch(e.target.value)}
                placeholder={t('search_placeholder', 'Search suppliers by name, company, tax ID...')}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={handleOpenAddSupplier}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('add_supplier', '+ Add New Supplier')}</span>
            </button>
          </div>

          <div className="flex-1 bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isLoadingSuppliers ? (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2 text-blue-500" />
                  <span>{t('loading', 'Loading suppliers directory...')}</span>
                </div>
              ) : suppliers.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  <span className="text-sm font-medium">{t('no_orders', 'No suppliers registered yet')}</span>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={suppliers.length > 0 && selectedSupplierIds.length === suppliers.length}
                          onChange={toggleSelectAllSuppliers}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4">{t('company_name', 'Company / Supplier')}</th>
                      <th className="py-3 px-3">{t('contact_person', 'Contact Person')}</th>
                      <th className="py-3 px-3">{t('tax_number', 'Tax / ID Number')}</th>
                      <th className="py-3 px-3">{t('phone_number', 'Phone & Email')}</th>
                      <th className="py-3 px-3">{t('address', 'Address')}</th>
                      <th className="py-3 px-3 text-right">{t('amount', 'Total Purchases')}</th>
                      <th className="py-3 px-4 text-right">{t('actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {suppliers.map(s => {
                      const isSelected = selectedSupplierIds.includes(s.id);
                      return (
                      <tr key={s.id} className={`transition-colors ${isSelected ? 'bg-blue-50/60 dark:bg-blue-950/20' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'}`}>
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectSupplier(s.id)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                              <Building className="w-3.5 h-3.5" />
                            </div>
                            <span>{s.company || s.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                          {s.name}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {s.tax_number || '—'}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {s.phone && <div className="font-mono text-[11px]">{s.phone}</div>}
                          {s.email && <div className="text-[10px] text-slate-400">{s.email}</div>}
                        </td>
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {s.address || '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold font-mono text-slate-900 dark:text-white">
                          {formatPrice(s.total_purchases, initData?.store)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditSupplier(s)}
                              title={t('edit_supplier', 'Edit Supplier')}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 transition-all cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSupplier(s)}
                              title={t('delete', 'Delete Supplier')}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Floating Bulk Action Bar (Suppliers) */}
          {selectedSupplierIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center justify-between p-3.5 px-5 bg-slate-900/95 dark:bg-slate-800/95 text-white rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 animate-slideUp gap-6 min-w-[340px]">
              <div className="flex items-center space-x-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-bold font-mono">
                  {selectedSupplierIds.length} {t('selected_count', 'Selected')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedSupplierIds([])}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleBulkDeleteSuppliers}
                  disabled={isBulkDeleting}
                  className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isBulkDeleting ? t('processing', 'Deleting...') : t('delete_selected', 'Delete Selected')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUPPLIER CREATE / EDIT MODAL */}
      {/* ========================================================================= */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {selectedSupplier ? t('edit_supplier', 'Edit Supplier') : t('add_supplier', 'Add New Supplier')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 space-y-3.5 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('company_name', 'Company / Organization Name')} *
                </label>
                <input
                  type="text"
                  required
                  value={supplierFormData.company}
                  onChange={e => setSupplierFormData({ ...supplierFormData, company: e.target.value })}
                  placeholder="e.g. Distribution Georgia LLC"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('contact_person', 'Contact Person Name')}
                  </label>
                  <input
                    type="text"
                    value={supplierFormData.name}
                    onChange={e => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                    placeholder="e.g. Giorgi Beridze"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('tax_number', 'Tax / ID Code')}
                  </label>
                  <input
                    type="text"
                    value={supplierFormData.tax_number}
                    onChange={e => setSupplierFormData({ ...supplierFormData, tax_number: e.target.value })}
                    placeholder="e.g. 405123456"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('phone_number', 'Phone Number')}
                  </label>
                  <input
                    type="text"
                    value={supplierFormData.phone}
                    onChange={e => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                    placeholder="+995 599 00 00 00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('email', 'Email Address')}
                  </label>
                  <input
                    type="email"
                    value={supplierFormData.email}
                    onChange={e => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                    placeholder="supplier@company.ge"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('address', 'Physical / Warehouse Address')}
                </label>
                <input
                  type="text"
                  value={supplierFormData.address}
                  onChange={e => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                  placeholder="Tbilisi, Georgia..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('order_note', 'Notes / Payment Terms')}
                </label>
                <textarea
                  rows={2}
                  value={supplierFormData.notes}
                  onChange={e => setSupplierFormData({ ...supplierFormData, notes: e.target.value })}
                  placeholder="Consignment terms, bank account details..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
                >
                  {t('save', 'Save Supplier')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW / EDIT STOCK INTAKE MODAL */}
      {/* ========================================================================= */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131b2e] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {editingPurchaseId ? t('stock_inward', 'Edit Stock Intake Invoice') : t('new_stock_intake', 'New Stock Intake & Waybill (მიღების აქტი)')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('receive_stock_btn', 'Receive products from distributor and automatically update inventory')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPurchaseModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSavePurchase} className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
              {/* Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    {t('invoice_number', 'Invoice / Waybill #')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={purchaseForm.invoice_number}
                    onChange={e => setPurchaseForm({ ...purchaseForm, invoice_number: e.target.value })}
                    placeholder="e.g. RS-982182"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    {t('supplier_name', 'Supplier / Distributor')} *
                  </label>
                  <select
                    value={purchaseForm.supplier_id}
                    onChange={e => {
                      const id = parseInt(e.target.value) || 0;
                      const s = suppliers.find(x => x.id === id);
                      setPurchaseForm({
                        ...purchaseForm,
                        supplier_id: id,
                        supplier_name: s ? (s.company || s.name) : '',
                      });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold focus:outline-none"
                  >
                    <option value={0}>{t('select_customer', 'Select Supplier...')}</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.company || s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    {t('date_received', 'Date Received')}
                  </label>
                  <input
                    type="datetime-local"
                    value={purchaseForm.date_received}
                    onChange={e => setPurchaseForm({ ...purchaseForm, date_received: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    {t('payment_method', 'Payment Status')}
                  </label>
                  <select
                    value={purchaseForm.payment_status}
                    onChange={e => setPurchaseForm({ ...purchaseForm, payment_status: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold focus:outline-none"
                  >
                    <option value="paid">{t('completed_sales', 'Paid')}</option>
                    <option value="unpaid">{t('on_hold', 'Unpaid')}</option>
                    <option value="partial">{t('split', 'Partial')}</option>
                  </select>
                </div>
              </div>

              {/* Product Search for Intake */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('add_product_to_order', 'Search & Add Product to Stock Intake')}:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={productQuery}
                    onChange={e => setProductQuery(e.target.value)}
                    placeholder={t('search_placeholder', 'Search catalog by name, SKU or barcode to add into invoice...')}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  {isSearchingProducts && (
                    <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin absolute right-3 top-3" />
                  )}

                  {matchingProducts.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                      {matchingProducts.map(p => (
                        <div
                          key={p.id}
                          onClick={() => handleAddProductToPurchase(p)}
                          className="p-2.5 hover:bg-indigo-50 dark:hover:bg-slate-700/60 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-8 h-8 rounded object-cover border border-slate-200 dark:border-slate-700"
                            />
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">SKU: {p.sku || 'N/A'} &bull; {t('remaining_stock', 'Stock')}: {p.stock_quantity}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                              {t('cost_price', 'Cost')}: {formatPrice(p.cost_price || p.price * 0.7, initData?.store)}
                            </span>
                            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">+ {t('add', 'Add to Intake')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  {t('stock_inward', 'Inward Items')} ({purchaseForm.items.length})
                </h4>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-3">{t('item', 'Product')}</th>
                        <th className="py-2.5 px-3 w-28">{t('qty', 'Quantity')}</th>
                        <th className="py-2.5 px-3 w-32">{t('cost_price', 'Unit Cost')} ({currencySymbol})</th>
                        <th className="py-2.5 px-3 w-32">{t('price', 'Sale Price')} ({currencySymbol})</th>
                        <th className="py-2.5 px-3 text-right">{t('amount', 'Line Total')}</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {purchaseForm.items.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{item.name}</div>
                            {item.sku && <div className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</div>}
                          </td>

                          {/* Quantity */}
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={item.quantity}
                              onChange={e => handlePurchaseItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold focus:outline-none text-center"
                            />
                          </td>

                          {/* Cost Price */}
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.cost_price}
                              onChange={e => handlePurchaseItemChange(index, 'cost_price', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 focus:outline-none"
                            />
                          </td>

                          {/* Sale Price */}
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.sale_price}
                              onChange={e => handlePurchaseItemChange(index, 'sale_price', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold focus:outline-none"
                            />
                          </td>

                          {/* Line Total */}
                          <td className="py-3 px-3 text-right font-extrabold font-mono text-slate-900 dark:text-white">
                            {formatPrice(item.line_total, initData?.store)}
                          </td>

                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePurchaseItem(index)}
                              className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('order_note', 'Invoice Notes / Waybill Details')}:
                  </label>
                  <textarea
                    rows={3}
                    value={purchaseForm.notes}
                    onChange={e => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                    placeholder={t('order_note_placeholder', 'Delivery notes, driver details, carrier...')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{t('subtotal', 'Subtotal')}:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatPrice(purchaseSubtotal, initData?.store)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">{t('tax', 'Tax / VAT')} ({currencySymbol}):</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={purchaseForm.tax_amount}
                      onChange={e => setPurchaseForm({ ...purchaseForm, tax_amount: parseFloat(e.target.value) || 0 })}
                      className="w-24 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-right"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">{t('total_payable', 'Total Inward Cost')}:</span>
                    <span className="font-black text-base font-mono text-indigo-600 dark:text-indigo-400">
                      {formatPrice(purchaseTotal, initData?.store)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{isSaving ? t('saving', 'Processing Intake...') : t('receive_stock_btn', 'Receive Stock & Save Invoice')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
