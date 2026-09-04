// =============================================================================
// PROJECT JULIE — ELECTRON MAIN PROCESS (PRIVILEGED LAYER)
// Manages application lifecycle, secure session partitioning, and
// human-in-the-loop UU-ERP authentication & data extraction.
// =============================================================================

const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let erpLoginWindow = null;

const UU_SESSION_PARTITION = 'persist:uuerp_session';
const UU_LOGIN_URL = 'https://uuerp.uudoon.in/Account/Login_UU';
const UU_ATTENDANCE_URL = 'https://uuerp.uudoon.in/Web_StudentAcademic/Cyborg_StudentAttendanceAcademic';

// Ensure single application instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 420,
    minHeight: 700,
    title: 'Project Julie — Personal AI Executive Assistant',
    backgroundColor: '#05060b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    autoHideMenuBar: true,
    show: false,
  });

  // Check if Vite dev server is running, otherwise load dist/index.html
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  
  mainWindow.loadURL(devServerUrl).catch(() => {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      mainWindow.loadURL(devServerUrl);
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// -----------------------------------------------------------------------------
// UU-ERP IPC HANDLERS
// -----------------------------------------------------------------------------

function setupUUERPIPC() {
  const erpSession = session.fromPartition(UU_SESSION_PARTITION);

  // 1. Open Real UU-ERP Login Window for Human-in-the-Loop Authentication
  ipcMain.handle('uuerp:open-login', async () => {
    return new Promise((resolve) => {
      if (erpLoginWindow && !erpLoginWindow.isDestroyed()) {
        erpLoginWindow.focus();
        return resolve({ success: false, error: 'Login window already open' });
      }

      erpLoginWindow = new BrowserWindow({
        width: 1050,
        height: 780,
        parent: mainWindow || undefined,
        modal: false,
        title: 'Uttaranchal University ERP — Real Human Login (Solve CAPTCHA)',
        autoHideMenuBar: true,
        webPreferences: {
          partition: UU_SESSION_PARTITION,
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
        },
      });

      let authenticated = false;

      const checkAuthNavigation = async (currentUrl) => {
        try {
          if (authenticated) return;

          const parsed = new URL(currentUrl);
          const pathname = parsed.pathname.toLowerCase();

          // Successful login redirects away from login endpoints into student portal
          const isLoginPage = pathname.includes('login') || pathname.includes('account/login');
          const isStudentPortal =
            pathname.includes('cyborg_studentmenu') ||
            pathname.includes('web_studentacademic') ||
            pathname.includes('studentdashboard') ||
            (pathname !== '/' && !isLoginPage);

          if (!isLoginPage && isStudentPortal) {
            authenticated = true;
            console.log('[UU-ERP] Authenticated navigation detected:', currentUrl);

            // Fetch session cookies to confirm session validity
            const cookies = await erpSession.cookies.get({ domain: 'uuerp.uudoon.in' });

            let attendanceHtml = '';
            // If we are not already on attendance page, navigate to it directly
            if (!pathname.includes('cyborg_studentattendanceacademic')) {
              try {
                console.log('[UU-ERP] Auto-navigating to attendance module:', UU_ATTENDANCE_URL);
                if (erpLoginWindow && !erpLoginWindow.isDestroyed()) {
                  await erpLoginWindow.loadURL(UU_ATTENDANCE_URL);
                  await new Promise((r) => setTimeout(r, 1200));
                  attendanceHtml = await erpLoginWindow.webContents.executeJavaScript(
                    'document.documentElement.outerHTML'
                  );
                  console.log(
                    '[UU-ERP] Extracted attendance HTML length:',
                    attendanceHtml ? attendanceHtml.length : 0
                  );
                }
              } catch (navErr) {
                console.warn('[UU-ERP] Auto attendance navigation note:', navErr.message);
              }
            } else {
              try {
                if (erpLoginWindow && !erpLoginWindow.isDestroyed()) {
                  attendanceHtml = await erpLoginWindow.webContents.executeJavaScript(
                    'document.documentElement.outerHTML'
                  );
                }
              } catch (e) {
                console.warn('[UU-ERP] Direct HTML extract note:', e.message);
              }
            }

            // Notify renderer of successful login + extracted HTML
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('uuerp:login-success', {
                url: currentUrl,
                cookiesCount: cookies.length,
                html: attendanceHtml,
              });
            }

            // Close login window after brief delay so user sees transition
            setTimeout(() => {
              if (erpLoginWindow && !erpLoginWindow.isDestroyed()) {
                erpLoginWindow.close();
              }
            }, 1000);

            resolve({ success: true, url: currentUrl, html: attendanceHtml });
          }
        } catch (err) {
          console.error('[UU-ERP] Auth navigation check error:', err);
        }
      };

      erpLoginWindow.webContents.on('did-navigate', (_event, url) => {
        checkAuthNavigation(url);
      });

      erpLoginWindow.webContents.on('did-redirect-navigation', (_event, url) => {
        checkAuthNavigation(url);
      });

      erpLoginWindow.on('closed', () => {
        erpLoginWindow = null;
        if (!authenticated) {
          resolve({ success: false, error: 'Login window closed before authentication completed' });
        }
      });

      erpLoginWindow.loadURL(UU_LOGIN_URL).catch((err) => {
        resolve({ success: false, error: `Failed to load ERP login page: ${err.message}` });
      });
    });
  });

  // 2. Fetch Authenticated UU-ERP Web Page (e.g. Attendance Module)
  ipcMain.handle('uuerp:fetch-page', async (_event, targetUrl) => {
    try {
      const urlToFetch = targetUrl || UU_ATTENDANCE_URL;
      
      const response = await erpSession.net.fetch(urlToFetch, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Referer': 'https://uuerp.uudoon.in/Account/Cyborg_StudentMenu',
        },
      });

      const finalUrl = response.url.toLowerCase();
      const isRedirectedToLogin = finalUrl.includes('/account/login') || finalUrl.includes('/account/login_uu');
      const html = await response.text();

      // If page redirected to login, session has expired
      if (isRedirectedToLogin || response.status === 401 || response.status === 403) {
        return {
          success: false,
          redirectedToLogin: true,
          status: response.status,
          finalUrl: response.url,
          error: 'Session expired. Redirected to login page.',
        };
      }

      // If net.fetch returned valid HTML
      if (html && html.length > 200 && !isRedirectedToLogin) {
        return {
          success: true,
          redirectedToLogin: false,
          status: response.status,
          finalUrl: response.url,
          html,
        };
      }

      // Fallback: Use headless window with active partition to render and extract DOM
      const backgroundWin = new BrowserWindow({
        show: false,
        width: 800,
        height: 600,
        webPreferences: {
          partition: UU_SESSION_PARTITION,
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      try {
        await backgroundWin.loadURL(urlToFetch);
        await new Promise((r) => setTimeout(r, 1000));
        const domHtml = await backgroundWin.webContents.executeJavaScript('document.documentElement.outerHTML');
        backgroundWin.destroy();

        return {
          success: true,
          redirectedToLogin: false,
          status: 200,
          finalUrl: urlToFetch,
          html: domHtml,
        };
      } catch (domErr) {
        backgroundWin.destroy();
        return {
          success: false,
          error: domErr.message,
        };
      }
    } catch (err) {
      console.error('[UU-ERP] fetch-page error:', err);
      return {
        success: false,
        error: err.message,
      };
    }
  });

  // 3. Check Session Active State
  ipcMain.handle('uuerp:check-session', async () => {
    try {
      const cookies = await erpSession.cookies.get({ domain: 'uuerp.uudoon.in' });
      if (!cookies || cookies.length === 0) {
        return { hasCookies: false, valid: false };
      }

      // Verify by making a lightweight test fetch to the attendance page
      const testRes = await erpSession.net.fetch(UU_ATTENDANCE_URL, {
        method: 'HEAD',
        redirect: 'manual',
      }).catch(() => null);

      if (!testRes) {
        return { hasCookies: true, valid: false, reason: 'Network error or unverified' };
      }

      // If status is 302 Found redirecting to Login, session is expired
      if (testRes.status === 302) {
        const loc = testRes.headers.get('location') || '';
        if (loc.toLowerCase().includes('login')) {
          return { hasCookies: true, valid: false, reason: 'Session expired' };
        }
      }

      return {
        hasCookies: true,
        valid: testRes.status === 200,
        status: testRes.status,
      };
    } catch (err) {
      return { hasCookies: false, valid: false, error: err.message };
    }
  });

  // 4. Disconnect & Clear Session
  ipcMain.handle('uuerp:clear-session', async () => {
    try {
      await erpSession.clearStorageData({
        storages: ['cookies', 'localstorage', 'sessionstorage'],
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

app.whenReady().then(() => {
  setupUUERPIPC();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
