/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import { ipcRenderer } from 'electron';
import { AccountInfo } from './sso'

const saveBtn = document.getElementById('save');

saveBtn.addEventListener('click', () => {
  var ssoName = (document.getElementById('sso-name') as HTMLTextAreaElement).value;
  var ssoRegion = (document.getElementById('sso-region') as HTMLSelectElement).value;
  let accountDetails: AccountInfo = {
    url: `https://${ssoName}.awsapps.com/start#/`,
    accountId: '',
    roleName: '',
    region: ssoRegion
  };
  //console.log(accountDetails);
  ipcRenderer.send('save-sso', accountDetails);

});

ipcRenderer.on('saved-reply', (event, account) => {
  const message = `${account.url}`;
  document.getElementById('messages').innerHTML = message;
});

ipcRenderer.on('list-accounts', (event, accounts) => {
  var selectList = document.createElement("select");
  selectList.id = "account-list";
  var parentDiv = document.getElementById('options');
  parentDiv.appendChild(selectList);
  //Create and append the options
  console.log(accounts);
  for (var i = 0; i < accounts.length; i++) {
    if(accounts[i].roles) {
      for (var x = 0; x < accounts[i].roles.length; x++) {
        var option = document.createElement("option");
        option.setAttribute("value", `${accounts[i].accountId}::${accounts[i].roles[x].roleName}`);
        option.text = `${accounts[i].accountName} - ${accounts[i].accountId} - ${accounts[i].roles[x].roleName}`;
        selectList.appendChild(option);
      }
    }

  }
});
