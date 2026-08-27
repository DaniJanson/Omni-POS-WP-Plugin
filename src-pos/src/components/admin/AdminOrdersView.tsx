import React, { useState, useEffect } from 'react';
import { posApi } from '../../services/api';
import { db } from '../../db';
import { usePosStore } from '../../store/usePosStore';
import { formatPrice } from '../../utils/format';
import { t } from '../../utils/i18n';
import type { OrderDetail, OrderItemDetail, Product } from '../../types';
import {
  Receipt,
  Search,
  RefreshCw,
  Edit3,
  Trash2,
  Printer,
  Plus,
  Minus,
  CheckCircle2,
  X,
  User,
  CreditCard,
  Banknote,
  DollarSign,
  Package,
  Calendar,
  AlertCircle,
  Save,
  Tag,
  FileText,
} from 'lucide-react';

export const AdminOrdersView: React.FC = () => {
  const { initData, showNotification, openReceiptModal } = usePosStore();

  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Selected Order for Edit Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Editing state inside modal
  const [editItems, setEditItems] = useState<OrderItemDetail[]>([]);
  const [editDiscount, setEditDiscount] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<string>('completed');
  const [editNote, setEditNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Product search for adding into order
  const [productSearch, setProductSearch] = useState('');
  const [searchedProducts, setSearchedProducts] = useState<Product[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);

  // Multi-selection state
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const toggleSelectOrder = (id: number) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllOrders = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map((o) => o.id));
    }
  };

  const handleBulkDeleteOrders = async () => {
    if (selectedOrderIds.length === 0) return;
    if (!window.confirm(`${t('confirm_bulk_delete', 'Are you sure you want to delete the selected items?')} (${selectedOrderIds.length})`)) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const resp = await posApi.bulkDelete('orders', selectedOrderIds);
      if (resp.success) {
        setOrders((prev) => prev.filter((o) => !selectedOrderIds.includes(o.id)));
        showNotification(t('items_deleted_success', 'Selected items deleted successfully!'), 'success');
        setSelectedOrderIds([]);
        fetchOrders(currentPage);
      }
    } catch (err: any) {
      showNotification(t('error', 'Failed to delete items') + ': ' + (err.message || 'Error'), 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Fetch orders from API
  const fetchOrders = async (page = 1) => {
    setIsLoading(true);
    try {
      const resp = await posApi.getOrders(page, 20, search, statusFilter, dateFrom, dateTo);
      setOrders(resp.orders || []);
      setTotalOrders(resp.total || 0);
      setTotalPages(resp.total_pages || 1);
      setTotalRevenue(resp.total_revenue || 0);
      setCurrentPage(page);
      setSelectedOrderIds([]);
    } catch (err: any) {
      showNotification(t('sync_error', 'Failed to fetch orders') + ': ' + (err.message || 'Error'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [statusFilter, dateFrom, dateTo]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(1);
  };

  // Open Edit Modal for an order
  const handleOpenEdit = (order: OrderDetail) => {
    setSelectedOrder(order);
    setEditItems(JSON.parse(JSON.stringify(order.items || [])));
    setEditDiscount(order.discount_total || 0);
    setEditStatus(order.status || 'completed');
    setEditNote(order.note || '');
    setProductSearch('');
    setSearchedProducts([]);
    setIsEditModalOpen(true);
  };

  // Live item calculations inside edit modal
  const editSubtotal = editItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const editTotal = Math.max(0, editSubtotal - (parseFloat(String(editDiscount)) || 0));

  // Quantity adjustments
  const handleItemQtyChange = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const updated = [...editItems];
    updated[index].quantity = newQty;
    updated[index].subtotal = updated[index].unit_price * newQty;
    updated[index].total = updated[index].unit_price * newQty;
    setEditItems(updated);
  };

  // Unit price adjustments
  const handleItemPriceChange = (index: number, newPrice: number) => {
    const updated = [...editItems];
    const price = Math.max(0, newPrice);
    updated[index].unit_price = price;
    updated[index].subtotal = price * updated[index].quantity;
    updated[index].total = price * updated[index].quantity;
    setEditItems(updated);
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    const updated = [...editItems];
    updated.splice(index, 1);
    setEditItems(updated);
  };

  // Search local product catalogue to add into receipt
  useEffect(() => {
    if (!productSearch.trim()) {
      setSearchedProducts([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingProducts(true);
      try {
        const query = productSearch.toLowerCase();
        const all = await db.products.toArray();
        const matches = all.filter(
          p =>
            p.name.toLowerCase().includes(query) ||
            p.sku?.toLowerCase().includes(query) ||
            p.barcode?.toLowerCase().includes(query)
        );
        setSearchedProducts(matches.slice(0, 8));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingProducts(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [productSearch]);

  // Add product from search to receipt items
  const handleAddProductToOrder = (prod: Product) => {
    const existingIndex = editItems.findIndex(it => it.product_id === prod.id && !it.variation_id);
    if (existingIndex > -1) {
      handleItemQtyChange(existingIndex, editItems[existingIndex].quantity + 1);
    } else {
      const newItem: OrderItemDetail = {
        product_id: prod.id,
        name: prod.name,
        sku: prod.sku || '',
        quantity: 1,
        unit_price: prod.price || 0,
        subtotal: prod.price || 0,
        total: prod.price || 0,
        tax: 0,
        image: prod.image,
      };
      setEditItems([...editItems, newItem]);
    }
    setProductSearch('');
    setSearchedProducts([]);
    showNotification(`Added "${prod.name}" to order`, 'success');
  };

  // Save changes to order
  const handleSaveOrder = async () => {
    if (!selectedOrder) return;
    if (editItems.length === 0) {
      alert('Order must contain at least one item. To cancel the whole order, use Void / Delete.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        items: editItems.map(it => ({
          item_id: it.item_id,
          product_id: it.product_id,
          variation_id: it.variation_id,
          name: it.name,
          quantity: it.quantity,
          unit_price: it.unit_price,
        })),
        discount_amount: parseFloat(String(editDiscount)) || 0,
        status: editStatus,
        note: editNote,
      };

      const resp = await posApi.updateOrder(selectedOrder.id, payload);
      if (resp.success) {
        showNotification(t('order_updated', 'Order updated successfully!'), 'success');
        setIsEditModalOpen(false);
        fetchOrders(currentPage);
      }
    } catch (err: any) {
      showNotification('Failed to update order: ' + (err.message || 'Error'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete / Void Order
  const handleDeleteOrder = async (order: OrderDetail) => {
    if (!confirm(`Are you sure you want to void and delete order #${order.order_number}? Items will be restocked automatically.`)) {
      return;
    }

    try {
      const resp = await posApi.deleteOrder(order.id);
      if (resp.success) {
        showNotification(`Order #${order.order_number} voided and deleted`, 'success');
        fetchOrders(currentPage);
      }
    } catch (err: any) {
      showNotification('Failed to delete order: ' + (err.message || 'Error'), 'error');
    }
  };

  // Print 80mm receipt
  const handlePrintReceipt = (order: OrderDetail) => {
    const receiptData = {
      order_id: order.id,
      order_number: order.order_number,
      date: order.date_formatted || order.date,
      cashier: order.cashier_name,
      customer_name: order.customer_name,
      payment_method: order.payment_title,
      items: order.items.map(it => ({
        id: it.product_id,
        name: it.name,
        sku: it.sku,
        qty: it.quantity,
        price: it.unit_price,
        total: it.total,
      })),
      subtotal: order.subtotal,
      discount: order.discount_total,
      tax: order.tax_total,
      total: order.total,
      tendered: order.tendered_cash,
      change: order.change_due,
    };

    openReceiptModal(receiptData);
  };

  const currencySymbol = initData?.store?.currency_symbol || '$';

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100">
      {/* KPI Stats Bar */}
      <div className="p-6 pb-0 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">{t('total_revenue', 'Total Sales')}</span>
            <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1 block">
              {formatPrice(totalRevenue, initData?.store)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">{t('total_orders', 'Total Receipts')}</span>
            <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1 block">
              {totalOrders}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">{t('average_order_value', 'Avg. Receipt')}</span>
            <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1 block">
              {formatPrice(totalOrders > 0 ? totalRevenue / totalOrders : 0, initData?.store)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Tag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-6 pb-4 shrink-0">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-white dark:bg-[#0f172a] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('search_placeholder', 'Search by Order #, Customer name, email or phone...')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-inner transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Status Filter */}
            <div className="min-w-[140px]">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-inner transition-all cursor-pointer"
              >
                <option value="all">{t('all', 'All Statuses')}</option>
                <option value="completed">{t('completed_sales', 'Completed')}</option>
                <option value="processing">{t('in_progress', 'Processing')}</option>
                <option value="on-hold">{t('on_hold', 'On Hold')}</option>
                <option value="cancelled">{t('cancel', 'Cancelled')}</option>
                <option value="refunded">{t('refund', 'Refunded')}</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-inner">
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="bg-transparent border-0 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              />
              <span className="text-xs text-slate-400">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="bg-transparent border-0 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchOrders(currentPage)}
              disabled={isLoading}
              title={t('sync_catalogue', 'Refresh')}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Filter Submit */}
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              {t('filter', 'Filter')}
            </button>
          </div>
        </form>
      </div>

      {/* Orders Table */}
      <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col">
        <div className="flex-1 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto custom-scrollbar">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mr-2 text-blue-500" />
                <span>{t('loading', 'Loading receipts...')}</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <span className="text-sm font-medium">{t('no_orders', 'No sold receipts found')}</span>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800">
                  <tr className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                        onChange={toggleSelectAllOrders}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3.5 px-3 w-28">{t('receipt_number', 'Receipt #')}</th>
                    <th className="py-3.5 px-3 w-36">{t('date', 'Date & Time')}</th>
                    <th className="py-3.5 px-3 min-w-[140px]">{t('customer', 'Customer')}</th>
                    <th className="py-3.5 px-3 w-28">{t('cashier', 'Cashier')}</th>
                    <th className="py-3.5 px-3 w-28">{t('payment_method', 'Payment')}</th>
                    <th className="py-3.5 px-3 w-16 text-center">{t('qty', 'Items')}</th>
                    <th className="py-3.5 px-3 w-28 text-right">{t('amount', 'Total')}</th>
                    <th className="py-3.5 px-3 w-28 text-center">{t('status', 'Status')}</th>
                    <th className="py-3.5 px-4 w-32 text-right">{t('actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {orders.map(order => {
                    const isSelected = selectedOrderIds.includes(order.id);
                    return (
                    <tr key={order.id} className={`transition-colors ${isSelected ? 'bg-blue-50/60 dark:bg-blue-950/20' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'}`}>
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOrder(order.id)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-3 font-bold font-mono text-blue-600 dark:text-blue-400">
                        <div className="flex items-center gap-1.5">
                          <span>#{order.order_number}</span>
                          {order.is_pos && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 uppercase">
                              POS
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {order.date}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{order.customer_name}</div>
                        {order.customer_phone && (
                          <div className="text-[10px] text-slate-400 font-mono">{order.customer_phone}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {order.cashier_name}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                        {order.payment_title}
                      </td>
                      <td className="py-3 px-3 text-center font-bold font-mono text-slate-700 dark:text-slate-300">
                        {order.items_count}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold font-mono text-slate-900 dark:text-white">
                        {formatPrice(order.total, initData?.store)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            order.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                              : order.status === 'processing'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                              : order.status === 'cancelled' || order.status === 'refunded'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Edit / Inspect Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(order)}
                            title={t('receipt_details', 'Edit products, prices & discounts')}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Print Receipt Button */}
                          <button
                            type="button"
                            onClick={() => handlePrintReceipt(order)}
                            title={t('print_receipt', 'Print 80mm receipt')}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Void / Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order)}
                            title={t('delete_order', 'Void and restock order')}
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

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {currentPage} / {totalPages} ({totalOrders} {t('units', 'items')})
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => fetchOrders(currentPage - 1)}
                  className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 font-semibold cursor-pointer"
                >
                  {t('previous', 'Previous')}
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => fetchOrders(currentPage + 1)}
                  className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 font-semibold cursor-pointer"
                >
                  {t('next', 'Next')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center justify-between p-3.5 px-5 bg-slate-900/95 dark:bg-slate-800/95 text-white rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 animate-slideUp gap-6 min-w-[340px]">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold font-mono">
              {selectedOrderIds.length} {t('selected_count', 'Selected')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSelectedOrderIds([])}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="button"
              onClick={handleBulkDeleteOrders}
              disabled={isBulkDeleting}
              className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isBulkDeleting ? t('processing', 'Deleting...') : t('delete_selected', 'Delete Selected')}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RECEIPT / ORDER EDIT & INSPECT MODAL */}
      {/* ========================================================================= */}
      {isEditModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131b2e] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {t('receipt_number', 'Receipt')} #{selectedOrder.order_number}
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {editStatus.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {selectedOrder.date_formatted || selectedOrder.date} &bull; {t('cashier', 'Cashier')}: {selectedOrder.cashier_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handlePrintReceipt(selectedOrder)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t('print_receipt', 'Print Receipt')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              {/* Customer & Payment Meta Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('customer', 'Customer')}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedOrder.customer_name}</span>
                  {selectedOrder.customer_phone && <span className="text-slate-400 block font-mono text-[11px]">{selectedOrder.customer_phone}</span>}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('payment_method', 'Payment Method')}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedOrder.payment_title}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('status', 'Order Status')}</span>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value)}
                    className="mt-0.5 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="completed">{t('completed_sales', 'Completed')}</option>
                    <option value="processing">{t('in_progress', 'Processing')}</option>
                    <option value="on-hold">{t('on_hold', 'On Hold')}</option>
                    <option value="cancelled">{t('cancel', 'Cancelled')}</option>
                    <option value="refunded">{t('refund', 'Refunded')}</option>
                  </select>
                </div>
              </div>

              {/* Add Product Search Bar */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('add_product_to_order', 'Add Product to this Receipt')}:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder={t('search_placeholder', 'Search catalog by name, SKU or barcode to add into receipt...')}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  {isSearchingProducts && (
                    <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin absolute right-3 top-3" />
                  )}

                  {/* Search Dropdown Results */}
                  {searchedProducts.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                      {searchedProducts.map(p => (
                        <div
                          key={p.id}
                          onClick={() => handleAddProductToOrder(p)}
                          className="p-2.5 hover:bg-blue-50 dark:hover:bg-slate-700/60 flex items-center justify-between cursor-pointer transition-colors"
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
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                              {formatPrice(p.price, initData?.store)}
                            </span>
                            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">+ {t('add', 'Add')}</span>
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
                  {t('receipt_details', 'Receipt Line Items')} ({editItems.length})
                </h4>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-3">{t('item', 'Product')}</th>
                        <th className="py-2.5 px-3 w-32">{t('price', 'Unit Price')}</th>
                        <th className="py-2.5 px-3 w-36 text-center">{t('qty', 'Quantity')}</th>
                        <th className="py-2.5 px-3 text-right">{t('amount', 'Line Total')}</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {editItems.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          {/* Title & SKU */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{item.name}</div>
                            {item.sku && <div className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</div>}
                          </td>

                          {/* Editable Unit Price */}
                          <td className="py-3 px-3">
                            <div className="relative flex items-center">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unit_price}
                                onChange={e => handleItemPriceChange(index, parseFloat(e.target.value) || 0)}
                                className="w-24 pl-6 pr-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <span className="text-xs text-slate-400 absolute left-2 pointer-events-none font-bold">
                                {currencySymbol}
                              </span>
                            </div>
                          </td>

                          {/* Editable Quantity */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
                              <button
                                type="button"
                                onClick={() => handleItemQtyChange(index, item.quantity - 1)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={e => handleItemQtyChange(index, Math.max(1, parseFloat(e.target.value) || 1))}
                                className="w-12 text-center text-xs font-mono font-bold border-none bg-transparent text-slate-900 dark:text-white focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleItemQtyChange(index, item.quantity + 1)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Line Total */}
                          <td className="py-3 px-3 text-right font-extrabold font-mono text-slate-900 dark:text-white">
                            {formatPrice(item.unit_price * item.quantity, initData?.store)}
                          </td>

                          {/* Delete Item */}
                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              title={t('delete', 'Delete item from receipt')}
                              className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
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

              {/* Order Discount & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('order_note', 'Order Note (Internal / Receipt Note)')}:
                  </label>
                  <textarea
                    rows={3}
                    value={editNote}
                    onChange={e => setEditNote(e.target.value)}
                    placeholder={t('order_note_placeholder', 'Customer instructions, warranty notes, table #, etc.')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{t('subtotal', 'Subtotal')}:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatPrice(editSubtotal, initData?.store)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">{t('discount', 'Order Discount')}:</span>
                    <div className="relative flex items-center w-28">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editDiscount}
                        onChange={e => setEditDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full pl-6 pr-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-rose-600 dark:text-rose-400 focus:outline-none"
                      />
                      <span className="text-xs text-slate-400 absolute left-2 pointer-events-none font-bold">
                        {currencySymbol}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">{t('total_payable', 'Updated Total')}:</span>
                    <span className="font-black text-base font-mono text-blue-600 dark:text-blue-400">
                      {formatPrice(editTotal, initData?.store)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131b2e] flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {t('cancel', 'Cancel')}
              </button>

              <button
                type="button"
                onClick={handleSaveOrder}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSaving ? t('saving', 'Updating Order...') : t('update_order', 'Save & Update Receipt')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
