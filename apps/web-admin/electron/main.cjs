delete process.env.ELECTRON_RUN_AS_NODE;

const { app, BrowserWindow, Menu, Tray, shell, dialog, Notification } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

let mainWindow = null;
let tray = null;
let backendProcess = null;

// Kiểm tra xem Backend API port 5000 đã phản hồi chưa
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

// Chờ Backend khởi động thành công (tối đa 15 giây)
function waitForBackend(retries, delay, callback) {
  checkBackendAlive((alive) => {
    if (alive) {
      callback(true);
    } else if (retries > 0) {
      setTimeout(() => waitForBackend(retries - 1, delay, callback), delay);
    } else {
      callback(false);
    }
  });
}

function startBackend() {
  const backendDir = path.join(__dirname, '..', '..', 'backend');
  const compiledMain = path.join(backendDir, 'dist', 'src', 'main.js');

  console.log('🚀 Khởi chạy Backend ERP Engine nội bộ...');

  if (fs.existsSync(compiledMain)) {
    // Chạy từ file biên dịch siêu tốc (chỉ 0.3s)
    backendProcess = spawn('node', ['dist/src/main.js'], {
      cwd: backendDir,
      shell: true,
      stdio: 'ignore',
      detached: false,
    });
  } else {
    // Fallback nếu chưa compile
    backendProcess = spawn('npm.cmd', ['run', 'start:dev'], {
      cwd: backendDir,
      shell: true,
      stdio: 'ignore',
      detached: false,
    });
  }

  backendProcess.on('error', (err) => {
    console.error('Lỗi khởi động Backend:', err);
  });
}

function createWindow() {
  const iconPath = path.join(__dirname, 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Hệ Thống ERP & DMS Phân Phối Bánh Kẹo FMCG (Desktop App)',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Cho phép gọi API localhost từ file://
    },
    show: false, // Ẩn cho đến khi nội dung sẵn sàng để tránh giật hình
    backgroundColor: '#0f172a',
  });

  // Thiết lập Menu ứng dụng
  const template = [
    {
      label: 'Hệ Thống',
      submenu: [
        { label: 'Tải lại trang (F5)', role: 'reload' },
        { label: 'Bật/Tắt Toàn màn hình', role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: 'Thu nhỏ xuống Khay hệ thống',
          click: () => {
            if (mainWindow) mainWindow.hide();
          },
        },
        { type: 'separator' },
        { label: 'Thoát phần mềm', role: 'quit' },
      ],
    },
    {
      label: 'Công Cụ Đồng Bộ',
      submenu: [
        {
          label: 'Mở Google Drive / Google Sheets',
          click: async () => {
            await shell.openExternal('https://docs.google.com/spreadsheets');
          },
        },
        {
          label: 'Kiểm tra trạng thái Backend (Port 5000)',
          click: async () => {
            await shell.openExternal('http://localhost:5000/api/dashboard/metrics');
          },
        },
        { type: 'separator' },
        { label: 'Bật Công Cụ Lập Trình (DevTools)', role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Trợ Giúp',
      submenu: [
        {
          label: 'Giới Thiệu ERP FMCG Desktop',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'ERP & DMS Bánh Kẹo FMCG',
              message: 'Phiên Bản Desktop Offline (0 đồng VPS & Domain)\n\nTính năng:\n• Đa đơn vị tính (Thùng/Hộp/Gói)\n• Lô hàng & Thuật toán FEFO\n• Điểm bán tạp hóa & GPS Check-in\n• Sinh mã VietQR động\n• Đồng bộ hai chiều Google Sheets API',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Thiết lập System Tray (Khay đồng hồ Windows)
  if (fs.existsSync(iconPath)) {
    try {
      tray = new Tray(iconPath);
      const trayMenu = Menu.buildFromTemplate([
        {
          label: 'Mở Giao Diện ERP',
          click: () => {
            mainWindow.show();
            mainWindow.focus();
          },
        },
        { type: 'separator' },
        {
          label: 'Thoát Ứng Dụng',
          click: () => {
            app.quit();
          },
        },
      ]);
      tray.setToolTip('ERP & DMS Bánh Kẹo FMCG');
      tray.setContextMenu(trayMenu);
      tray.on('double-click', () => {
        mainWindow.show();
        mainWindow.focus();
      });
    } catch (e) {
      console.warn('Không thể tạo System Tray:', e.message);
    }
  }

  // Ưu tiên nạp giao diện tĩnh dist/index.html (Offline 100%)
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  const devUrl = 'http://localhost:3000';

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL(devUrl);
  } else if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath);
  } else {
    mainWindow.loadURL(devUrl);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();

    // Thông báo Windows
    if (Notification.isSupported()) {
      new Notification({
        title: 'ERP FMCG Desktop Đã Khởi Động',
        body: 'Hệ thống quản lý phân phối bánh kẹo đã sẵn sàng hoạt động nội bộ!',
        icon: iconPath,
      }).show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Khởi chạy ứng dụng
app.whenReady().then(() => {
  checkBackendAlive((alive) => {
    if (!alive) {
      startBackend();
      // Chờ backend online rồi mới mở cửa sổ giao diện
      waitForBackend(15, 600, () => {
        createWindow();
      });
    } else {
      createWindow();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Dọn dẹp tiến trình backend khi đóng ứng dụng
function cleanupBackend() {
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch (e) {}
    backendProcess = null;
  }
}

app.on('before-quit', cleanupBackend);
app.on('will-quit', cleanupBackend);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
