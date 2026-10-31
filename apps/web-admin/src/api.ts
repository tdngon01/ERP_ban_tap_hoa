import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Dashboard
export const getDashboardMetrics = () => api.get('/dashboard/metrics').then(r => r.data);

// Products
export const getProducts = (search?: string, category?: string) => 
  api.get('/products', { params: { search, category } }).then(r => r.data);
export const convertUom = (productId: string, uomName: string, quantity: number) => 
  api.post('/products/convert', { productId, uomName, quantity }).then(r => r.data);

// Inventory & FEFO
export const getWarehouses = () => api.get('/inventory/warehouses').then(r => r.data);
export const getInventoryLots = (warehouseId?: string, fefoFilter?: string) => 
  api.get('/inventory/lots', { params: { warehouseId, fefoFilter } }).then(r => r.data);
export const recommendFefo = (productId: string, requiredBaseQty: number, warehouseId?: string) => 
  api.post('/inventory/fefo/recommend', { productId, requiredBaseQty, warehouseId }).then(r => r.data);
export const createInboundLot = (data: any) => api.post('/inventory/inbound', data).then(r => r.data);

// Outlets
export const getOutlets = (routeId?: string, search?: string) => 
  api.get('/outlets', { params: { routeId, search } }).then(r => r.data);
export const createOutlet = (data: any) => api.post('/outlets', data).then(r => r.data);

// Routes & MCP
export const getRoutes = () => api.get('/routes').then(r => r.data);
export const getTodayMcp = (dayOfWeek?: string, salesRepName?: string) => 
  api.get('/routes/mcp/today', { params: { dayOfWeek, salesRepName } }).then(r => r.data);
export const checkInStore = (data: any) => api.post('/routes/checkin', data).then(r => r.data);
export const checkOutStore = (data: any) => api.post('/routes/checkout', data).then(r => r.data);
export const getVisitHistory = () => api.get('/routes/visits').then(r => r.data);

// Orders & Promotions
export const getOrders = (status?: string, outletId?: string) => 
  api.get('/orders', { params: { status, outletId } }).then(r => r.data);
export const getPromotions = () => api.get('/orders/promotions').then(r => r.data);
export const createOrder = (data: any) => api.post('/orders', data).then(r => r.data);
export const updateOrderStatus = (id: string, status: string) => 
  api.put(`/orders/${id}/status`, { status }).then(r => r.data);

// Debt & VietQR
export const getDebtLedger = () => api.get('/debt/ledger').then(r => r.data);
export const generateVietQr = (data: any) => api.post('/debt/vietqr/generate', data).then(r => r.data);
export const recordPayment = (data: any) => api.post('/debt/payment', data).then(r => r.data);
export const getPaymentReceipts = () => api.get('/debt/receipts').then(r => r.data);

// Google Sheets API Integration
export const getGoogleSheetsConfig = () => api.get('/google-sheets/config').then(r => r.data);
export const updateGoogleSheetsConfig = (data: any) => api.post('/google-sheets/config', data).then(r => r.data);
export const getGoogleSheetsGuide = () => api.get('/google-sheets/template-guide').then(r => r.data);
export const syncProductsFromSheets = (spreadsheetId?: string) => 
  api.post('/google-sheets/sync/products', { spreadsheetId }).then(r => r.data);
export const syncOutletsFromSheets = (spreadsheetId?: string) => 
  api.post('/google-sheets/sync/outlets', { spreadsheetId }).then(r => r.data);
export const exportOrdersToSheets = () => api.get('/google-sheets/export/orders').then(r => r.data);
export const exportInventoryToSheets = () => api.get('/google-sheets/export/inventory').then(r => r.data);

