delete process.env.ELECTRON_RUN_AS_NODE;

const { app, BrowserWindow, Menu, Tray, shell, dialog, Notification } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

// 1. CHỐNG MỞ NHIỀU CỬA SỔ (SINGLE INSTANCE LOCK)
// Đảm bảo chỉ có DUY NHẤT 1 cửa sổ ứng dụng chạy tại 1 thời điểm!
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  // Nếu đã có 1 app đang chạy thì thoát ngay lập tức tiến trình mới
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let tray = null;
let backendProcess = null;
let isWindowCreated = false;

// Khi người dùng bấm mở lại lần nữa -> Chỉ hiện & focus cửa sổ đang mở
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
  }
});

// 2. KIỂM TRA BACKEND VỚI CƠ CHẾ ONCE (CHỐNG GỌI CALLBACK NHIỀU LẦN GÂY NHÂN BẢN CỬA SỔ)
function checkBackendAlive(callback) {
  let finished = false;
  const finish = (result) => {
    if (!finished) {
      finished = true;
      callback(result);
    }
  };

  const req = http.get('http://localhost:5000/api/dashboard/metrics', (res) => {
    finish(res.statusCode === 200 || res.statusCode === 304);
  });

  req.on('error', () => {
    finish(false);
  });

  req.setTimeout(800, () => {
    req.destroy();
    finish(false);
  });
}

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
    backendProcess = spawn('node', ['dist/src/main.js'], {
      cwd: backendDir,
      shell: true,
      stdio: 'ignore',
      detached: false,
    });
  } else {
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

// 3. TẠO CỬA SỔ DUY NHẤT
function createWindow() {
  // Nếu cửa sổ đã được tạo thì không tạo thêm
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }

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
      webSecurity: false,
    },
    show: false,
    backgroundColor: '#0f172a',
  });

  // 4. CHẶN TỰ ĐỘNG MỞ CỬA SỔ / TAB MỚI KHI CLICK LINK HOẶC TARGET="_BLANK"
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Mở liên kết ngoài (Google Sheets, URL ảnh) trên trình duyệt mặc định (Chrome/Edge)
    shell.openExternal(url);
    return { action: 'deny' }; // Tuyệt đối KHÔNG mở thêm cửa sổ Electron!
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://localhost') && !url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Menu ứng dụng
  const template = [
    {
      label: 'Hệ Thống',
      submenu: [
        { label: 'Tải lại trang (F5)', role: 'reload' },
        { label: 'Bật/Tắt Toàn màn hình (F11)', role: 'togglefullscreen' },
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

  // System Tray
  if (fs.existsSync(iconPath)) {
    try {
      tray = new Tray(iconPath);
      const trayMenu = Menu.buildFromTemplate([
        {
          label: 'Mở Giao Diện ERP',
          click: () => {
            if (mainWindow) {
              mainWindow.show();
              mainWindow.focus();
            }
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
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      });
    } catch (e) {
      console.warn('Không thể tạo System Tray:', e.message);
    }
  }

  // Tải file tĩnh giao diện
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
    isWindowCreated = false;
  });
}

function safeCreateWindow() {
  if (!isWindowCreated) {
    isWindowCreated = true;
    createWindow();
  }
}

// KHỞI ĐỘNG ỨNG DỤNG AN TOÀN
app.whenReady().then(() => {
  checkBackendAlive((alive) => {
    if (!alive) {
      startBackend();
      waitForBackend(15, 600, () => {
        safeCreateWindow();
      });
    } else {
      safeCreateWindow();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      safeCreateWindow();
    }
  });
});

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
