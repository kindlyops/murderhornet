import { app, BrowserWindow, ipcMain } from 'electron';
//import { SSOOIDCClient, CreateTokenCommand } from "@aws-sdk/client-sso-oidc";
import * as aws from "aws-sdk";
import * as awsCli from 'aws-cli-js';
import path from 'path';


interface RoleCredentials {
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  expiration?: number;
}

interface CacheToken {
  accessToken?: string;
  tokenType?: string;
  expiresIn?: number;
  refreshToken?: string;
  idToken?: string;
}

let cacheToken: CacheToken;
let roleCredentials: RoleCredentials;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('update-electron-app')()

const loginSSO = async () => {
  const awsCmd = new awsCli.Aws();

  // For testing purposes instead of text entry boxes
  const profile = "SandboxSSOAdmin";

  // TODO add a text entry for this
  const url = await awsCmd.command(`configure get sso_start_url --profile ${profile}`).then(function (resp){
    return resp.raw.trim();
  });

  // TODO list roles and let user select
  const roleName = await awsCmd.command(`configure get sso_role_name --profile ${profile}`).then(function (resp){
    return resp.raw.trim();
  });
  // TODO add a text entry for this
  const account = await awsCmd.command(`configure get sso_account_id --profile ${profile}`).then(function (resp){
    return resp.raw.trim();
  });
  // TODO add a dropdown for region entry
  const region = await awsCmd.command(`configure get sso_region --profile ${profile}`).then(function (resp){
      return resp.raw.trim();
  });

  console.log(`${url} and ${region}`);
  const ssoOidc = new aws.SSOOIDC({
    region: region,
  });

  // Register the client
  ssoOidc.registerClient({
    clientName: 'murderHornet',
    clientType: 'public'
  }, function(regErr,regData) {
    if (regErr) { console.log(regErr, regErr.stack);} // an error occurred
    else {
      console.log(regData);
      ssoOidc.startDeviceAuthorization({
        clientId:regData.clientId,
        clientSecret:regData.clientSecret,
        startUrl: url,
      },
      function(err,data) {
        if (err) console.log(err, err.stack); // an error occurred
        else   {
          const ssoWindow = new BrowserWindow({
            height: 400,
            width: 400,
          });
          ssoWindow.loadURL(data.verificationUriComplete);
          ssoWindow.on('close', function(){
            console.log('SSO WINDOW CLOSED CHECK FOR TOKEN');
            ssoOidc.createToken({
              clientId:regData.clientId,
              clientSecret:regData.clientSecret,
              grantType: 'urn:ietf:params:oauth:grant-type:device_code',
              deviceCode: data.deviceCode
            }, function(tokenErr,tokenData) {
              if (tokenErr) console.log(tokenErr, tokenErr.stack); // an error occurred
              else {
                console.log(tokenData);
                cacheToken = tokenData;
                const sso = new aws.SSO({region: region});
                // TODO List Roles the user can select
                
                // Get Role Credentials
                  sso.getRoleCredentials({
                    accountId: account,
                    accessToken: cacheToken.accessToken,
                    roleName: roleName
                  }, function(ssoErr, ssoData){
                     console.log(ssoErr, ssoData);
                     roleCredentials = ssoData.roleCredentials;
                  });
              }
            });
          });
        }
      });
    }
  });
};

const createWindow = async () => {
  // Create the browser window.
  await loginSSO();
  console.log(`Try ${path.join(__dirname, 'preload.js')}`);
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true
    }
  });
  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "../index.html"));
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
ipcMain.on('save', (event, arg) => {
  console.log(`Saved: ${arg}`);
  event.sender.send('asynchronous-reply', 'pong');
});