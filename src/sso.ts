import * as aws from "aws-sdk";
import * as awsCli from 'aws-cli-js';
import { BrowserWindow } from 'electron';


export class AccountInfo {
  url?: string;
  accountId?: string;
  roleName?: string;
  region?: string;
}

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

export const loginSSO = async (account: AccountInfo) => {
  const awsCmd = new awsCli.Aws();

  // For testing purposes instead of text entry boxes
  const profile = "SandboxSSOAdmin";

  // TODO add a text entry for this
  //const url = await awsCmd.command(`configure get sso_start_url --profile ${profile}`).then(function (resp){
  //  return resp.raw.trim();
  //});

  // TODO list roles and let user select
  account.roleName = await awsCmd.command(`configure get sso_role_name --profile ${profile}`).then(function (resp){
    return resp.raw.trim();
  });
  // TODO add a text entry for this
  //const account = await awsCmd.command(`configure get sso_account_id --profile ${profile}`).then(function (resp){
    // return resp.raw.trim();
  //});
  // TODO add a dropdown for region entry
  //account.region = await awsCmd.command(`configure get sso_region --profile ${profile}`).then(function (resp){
  //  return resp.raw.trim();
  //});

  console.log(`${account.url.trim()} and ${account.region}`);
  const ssoOidc = new aws.SSOOIDC({
    region: account.region,
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
        clientId: regData.clientId,
        clientSecret: regData.clientSecret,
        startUrl: account.url,
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
              clientId: regData.clientId,
              clientSecret: regData.clientSecret,
              grantType: 'urn:ietf:params:oauth:grant-type:device_code',
              deviceCode: data.deviceCode
            }, function(tokenErr,tokenData) {
              if (tokenErr) console.log(tokenErr, tokenErr.stack); // an error occurred
              else {
                console.log(tokenData);
                cacheToken = tokenData;
                const sso = new aws.SSO({region: account.region});
                // TODO List Accounts the user can select
                sso.listAccounts({
                  accessToken: cacheToken.accessToken
                }, function(listAccountsError, listAccountsData){
                  listAccountsData.accountList.forEach(function(val, index, accountArray){
                    console.log(val);
                  });
                  let focusedWindow = BrowserWindow.getFocusedWindow();
                  focusedWindow.webContents.send('list-accounts', listAccountsData.accountList);
                  // Get Role Credentials
                  //sso.getRoleCredentials({
                  //  accountId: account.accountId,
                  //  accessToken: cacheToken.accessToken,
                  //  roleName: account.roleName
                  //}, function(ssoErr, ssoData){
                  //    console.log(ssoErr, ssoData);
                  //    roleCredentials = ssoData.roleCredentials;
                  //});
                });
              }
            });
          });
        }
      });
    }
  });
};