import axios from 'axios';

const API_BASE = '/api';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Tự động gắn Token xác thực vào Header
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token =
      localStorage.getItem('fmcg_auth_token') ||
      sessionStorage.getItem('fmcg_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth & Đăng nhập
export const login = (data: { username: string; password?: string }) =>
  api.post('/auth/login', data).then((r) => r.data);
export const getMyProfile = () => api.get('/auth/me').then((r) => r.data);
export const changePassword = (data: { userId: string; oldPassword?: string; newPassword?: string }) =>
  api.post('/auth/change-password', data).then((r) => r.data);

// Dashboard
export const getDashboardMetrics = () => api.get('/dashboard/metrics').then((r) => r.data);

// Products
export const getProducts = (search?: string, category?: string) =>
  api.get('/products', { params: { search, category } }).then((r) => r.data);
export const convertUom = (productId: string, uomName: string, quantity: number) =>
  api.post('/products/convert', { productId, uomName, quantity }).then((r) => r.data);

// Inventory & FEFO
export const getWarehouses = () => api.get('/inventory/warehouses').then((r) => r.data);
export const getInventoryLots = (warehouseId?: string, fefoFilter?: string) =>
  api.get('/inventory/lots', { params: { warehouseId, fefoFilter } }).then((r) => r.data);
export const recommendFefo = (productId: string, requiredBaseQty: number, warehouseId?: string) =>
  api.post('/inventory/fefo/recommend', { productId, requiredBaseQty, warehouseId }).then((r) => r.data);
export const createInboundLot = (data: any) => api.post('/inventory/inbound', data).then((r) => r.data);
export const getPickingList = (status?: string) =>
  api.get('/inventory/picking-list', { params: { status } }).then((r) => r.data);
export const getVanStock = (salesRepName?: string) =>
  api.get('/inventory/van-stock', { params: { salesRepName } }).then((r) => r.data);
export const loadItemsToVan = (data: any) =>
  api.post('/inventory/van-stock/load', data).then((r) => r.data);
export const getBackorders = (status?: string, salesRepName?: string) =>
  api.get('/inventory/backorders', { params: { status, salesRepName } }).then((r) => r.data);
export const createBackorder = (data: any) =>
  api.post('/inventory/backorders', data).then((r) => r.data);
export const resolveBackorder = (id: string) =>
  api.post(`/inventory/backorders/${id}/resolve`).then((r) => r.data);

// Outlets & Customer CRM
export const getOutlets = (routeId?: string, search?: string) =>
  api.get('/outlets', { params: { routeId, search } }).then((r) => r.data);
export const getOutletDetail = (id: string) => api.get(`/outlets/${id}`).then((r) => r.data);
export const createOutlet = (data: any) => api.post('/outlets', data).then((r) => r.data);
export const updateOutlet = (id: string, data: any) => api.put(`/outlets/${id}`, data).then((r) => r.data);

// Routes & MCP
export const getRoutes = () => api.get('/routes').then((r) => r.data);
export const createRoute = (data: any) => api.post('/routes', data).then((r) => r.data);
export const updateRoute = (id: string, data: any) => api.put(`/routes/${id}`, data).then((r) => r.data);
export const deleteRoute = (id: string) => api.delete(`/routes/${id}`).then((r) => r.data);
export const assignOutletsToRoute = (routeId: string, outletIds: string[]) =>
  api.post(`/routes/${routeId}/assign-outlets`, { outletIds }).then((r) => r.data);
export const getTodayMcp = (dayOfWeek?: string, salesRepName?: string) =>
  api.get('/routes/mcp/today', { params: { dayOfWeek, salesRepName } }).then((r) => r.data);
export const checkInStore = (data: any) => api.post('/routes/checkin', data).then((r) => r.data);
export const checkOutStore = (data: any) => api.post('/routes/checkout', data).then((r) => r.data);
export const getVisitHistory = () => api.get('/routes/visits').then((r) => r.data);

// Orders & Promotions & Returns
export const getOrders = (status?: string, outletId?: string) =>
  api.get('/orders', { params: { status, outletId } }).then((r) => r.data);
export const getPromotions = () => api.get('/orders/promotions').then((r) => r.data);
export const createOrder = (data: any) => api.post('/orders', data).then((r) => r.data);
export const updateOrderStatus = (id: string, status: string) =>
  api.put(`/orders/${id}/status`, { status }).then((r) => r.data);
export const createReturnOrder = (data: any) => api.post('/orders/returns', data).then((r) => r.data);
export const getReturnHistory = () => api.get('/orders/returns/history').then((r) => r.data);

// Debt & VietQR
export const getDebtLedger = () => api.get('/debt/ledger').then((r) => r.data);
export const generateVietQr = (data: any) => api.post('/debt/vietqr/generate', data).then((r) => r.data);
export const recordPayment = (data: any) => api.post('/debt/payment', data).then((r) => r.data);
export const getPaymentReceipts = () => api.get('/debt/receipts').then((r) => r.data);

// Google Sheets API Integration
export const getGoogleSheetsConfig = () => api.get('/google-sheets/config').then((r) => r.data);
export const updateGoogleSheetsConfig = (data: any) => api.post('/google-sheets/config', data).then((r) => r.data);
export const getGoogleSheetsGuide = () => api.get('/google-sheets/template-guide').then((r) => r.data);
export const syncProductsFromSheets = (spreadsheetId?: string) =>
  api.post('/google-sheets/sync/products', { spreadsheetId }).then((r) => r.data);
export const syncOutletsFromSheets = (spreadsheetId?: string) =>
  api.post('/google-sheets/sync/outlets', { spreadsheetId }).then((r) => r.data);
export const exportOrdersToSheets = () => api.get('/google-sheets/export/orders').then((r) => r.data);
export const exportInventoryToSheets = () => api.get('/google-sheets/export/inventory').then((r) => r.data);
export const exportProductsToSheets = () => api.get('/google-sheets/export/products').then((r) => r.data);
export const exportOutletsToSheets = () => api.get('/google-sheets/export/outlets').then((r) => r.data);
export const backupAllToGoogleSheets = (spreadsheetId?: string) =>
  api.post('/google-sheets/backup-all', { spreadsheetId }).then((r) => r.data);

// System Settings & Database Backup
export const getSystemSettings = () => api.get('/settings').then((r) => r.data);
export const updateSystemSettings = (data: any) => api.post('/settings', data).then((r) => r.data);
export const getDatabaseInfo = () => api.get('/settings/database-info').then((r) => r.data);
export const createBackup = () => api.post('/settings/backup').then((r) => r.data);
export const getBackups = () => api.get('/settings/backups').then((r) => r.data);
export const getCsvExportUrl = (type: 'orders' | 'inventory' | 'debt') => `${API_BASE}/settings/export/csv?type=${type}`;

// Users & RBAC Permissions
export const getUsers = () => api.get('/users').then((r) => r.data);
export const getUserRoles = () => api.get('/users/roles').then((r) => r.data);
export const getUserDetail = (id: string) => api.get(`/users/${id}`).then((r) => r.data);
export const createUser = (data: any) => api.post('/users', data).then((r) => r.data);
export const updateUser = (id: string, data: any) => api.put(`/users/${id}`, data).then((r) => r.data);
export const deleteUser = (id: string) => api.delete(`/users/${id}`).then((r) => r.data);
