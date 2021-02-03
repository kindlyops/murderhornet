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
import { stringType } from 'aws-sdk/clients/iam';

interface AccountInfo {
    accountId: stringType
}

const saveBtn = document.getElementById('save');

saveBtn.addEventListener('click', () => {
    let account: AccountInfo;
    account.accountId = (document.getElementById('account-id') as HTMLTextAreaElement).value;
    console.log(account);
  ipcRenderer.send('save', account);
});

ipcRenderer.on('asynchronous-reply', (event, arg) => {
  const message = `Asynchronous message reply: ${arg}`;
  document.getElementById('async-reply').innerHTML = message;
});
