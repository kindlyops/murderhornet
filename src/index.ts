import { app, BrowserWindow, ipcMain } from 'electron';
import {loginSSO, saveCreds, awsConfig} from './sso'
import path from 'path';
import * as aws from "aws-sdk";

declare const MAIN_WINDOW_WEBPACK_ENTRY: any;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: any;


//let accountDetails: AccountInfo = {url: '', accountId: '', roleName: '', region: ''};

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('update-electron-app')()



const createWindow = async () => {
  // Create the browser window.
  console.log(`Try ${path.join(__dirname, 'preload.js')}`);
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: true
    }
  });
  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.webContents.openDevTools();

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // however that seems dumb.
  // if (process.platform !== 'darwin') {
    app.quit();
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.on('save-sso', async (event, account) => {
  console.log(`Saved: ${account}`);
  event.sender.send('saved-reply', account);
  await loginSSO(account);
});

ipcMain.on('use-account', async (event, role) => {
  console.log(`Loading: ${role}`);

  await saveCreds(role);
  const sts = new aws.STS(awsConfig);
  sts.getCallerIdentity({}, function(err,data){
    console.log(err, data);
    let msg = data;
    event.sender.send('account-reply', msg);
  });

});