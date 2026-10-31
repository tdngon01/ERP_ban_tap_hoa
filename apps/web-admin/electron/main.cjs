delete process.env.ELECTRON_RUN_AS_NODE;

const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let backendProcess = null;

// Kiểm tra xem Backend API port 5000 đã chạy sẵn chưa
function checkBackendAlive(callback) {
  const req = http.get('http://localhost:5000/api/dashboard/metrics', (res) => {
    callback(true);
  });
  req.on('error', () => {
    callback(false);
  });
  req.setTimeout(1000, () => {
    req.destroy();
    callback(false);
  });
}

function startBackend() {
  const backendDir = path.join(__dirname, '..', '..', 'backend');
  console.log('🚀 Khởi động Backend API từ Desktop App:', backendDir);

  // Chạy backend bằng tsx hoặc node
  backendProcess = spawn('npm.cmd', ['run', 'start:dev'], {
    cwd: backendDir,
    shell: true,
    stdio: 'ignore',
  });

  backendProcess.on('error', (err) => {
    console.error('Lỗi khởi động Backend:', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    title: 'ERP & DMS Bánh Kẹo FMCG - Desktop Edition (0đ VPS)',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: false,
  });

  // Tùy biến menu tiếng Việt gọn gàng
  const template = [
    {
      label: 'Hệ Thống ERP',
      submenu: [
        { label: 'Tải lại trang (F5)', role: 'reload' },
        { label: 'Toàn màn hình (F11)', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'Thoát ứng dụng', role: 'quit' },
      ],
    },
    {
      label: 'Công Cụ',
      submenu: [
        {
          label: 'Mở Google Sheet trên trình duyệt',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://docs.google.com/spreadsheets');
          },
        },
        {
          label: 'Xem Công Cụ Nhà Phát Triển (DevTools)',
          role: 'toggleDevTools',
        },
      ],
    },
    {
      label: 'Trợ Giúp',
      submenu: [
        {
          label: 'Giới thiệu ERP FMCG',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'ERP & DMS Bánh Kẹo FMCG',
              message: 'Phiên Bản Desktop Offline-Ready (Chi Phí 0 Đồng)\n\nBao gồm:\n- Quản lý đa đơn vị tính (Thùng/Hộp/Gói)\n- Kho bãi & Thuật toán FEFO\n- Công nợ gối đầu & Sinh VietQR động\n- Đồng bộ hai chiều Google Sheets API',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Load URL: Kiểm tra port 3000 trước, nếu không load dist/index.html
  const devUrl = 'http://localhost:3000';
  
  const loadContent = () => {
    http.get(devUrl, (res) => {
      mainWindow.loadURL(devUrl);
    }).on('error', () => {
      // Nếu chưa bật vite dev server, load file tĩnh dist/index.html
      const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
      mainWindow.loadFile(indexPath);
    });
  };

  setTimeout(loadContent, 1000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Kiểm tra nếu Backend chưa chạy thì tự động khởi chạy
  checkBackendAlive((alive) => {
    if (!alive) {
      startBackend();
    }
    createWindow();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  if (backendProcess) {
    try {
      process.kill(-backendProcess.pid);
    } catch (e) {
      backendProcess.kill();
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
