import * as aws from "aws-sdk";
import * as awsCli from 'aws-cli-js';
import { BrowserWindow } from 'electron';


export class AccountInfo {
  url?: string;
  accountId?: string;
  roleName?: string;
  region?: string;
  emailAddress?: string;
  roles?: {
    roleName?: string;
    accountId?: string
  }[];
}

interface CacheToken {
  accessToken?: string;
  tokenType?: string;
  expiresIn?: number;
  refreshToken?: string;
  idToken?: string;
}

let cacheToken: CacheToken;

export let accountInfo: AccountInfo;

export let awsConfig = new aws.Config();

export let getSSOConfig = async function (role: aws.SSO.RoleInfo): Promise<aws.Config> {
  console.log(role);
  const creds = await getCredentials({
    accessToken: cacheToken.accessToken,
    accountId: role.accountId,
    roleName: role.roleName
  });
  return new aws.Config({
      region: accountInfo.region,
      credentials: creds
  });
}

// loginSSO begins the SSO login process
export const loginSSO = async (account: AccountInfo) => {
  const awsCmd = new awsCli.Aws();
  accountInfo = account;
  // For testing purposes instead of text entry boxes
  //const profile = "SandboxSSOAdmin";

  // TODO add a text entry for this
  //const url = await awsCmd.command(`configure get sso_start_url --profile ${profile}`).then(function (resp){
  //  return resp.raw.trim();
  //});

  // TODO list roles and let user select
  //account.roleName = await awsCmd.command(`configure get sso_role_name --profile ${profile}`).then(function (resp){
  //  return resp.raw.trim();
  //});
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
            }, async function(tokenErr,tokenData) {
              if (tokenErr) console.log(tokenErr, tokenErr.stack); // an error occurred
              else {
                console.log(tokenData);
                cacheToken = tokenData;
                const sso = new aws.SSO({region: account.region});
                // TODO List Accounts the user can select
                const listAccountsRequest: aws.SSO.ListAccountsRequest = {
                  accessToken: cacheToken.accessToken,
                };

                getAccounts(listAccountsRequest).then( function(list){
                  let focusedWindow = BrowserWindow.getFocusedWindow();
                  console.log('Done getting accounts. Now getting roles.');
                  console.log(list);
                  const roles = getRoles(list);
                  roles.then(function(accountsWithRoles){
                    console.log('Done getting Roles. Now sending to renderer!');
                    console.log(accountsWithRoles);
                    focusedWindow.webContents.send('list-accounts', accountsWithRoles);
                  });
                });
              }
            });
          });
        }
      });
    }
  });
};

// getCredentials returns credentials from the provided role
const getCredentials = (getRoleCredentialsRequest: aws.SSO.GetRoleCredentialsRequest) => {
	return new Promise<aws.Credentials>(resolve => {
    const sso = new aws.SSO({region: accountInfo.region});
		sso.getRoleCredentials(getRoleCredentialsRequest, async (err, data: aws.SSO.GetRoleCredentialsResponse) => {
			const ssoCredentials = new aws.Credentials({
        accessKeyId: data.roleCredentials.accessKeyId,
        secretAccessKey: data.roleCredentials.secretAccessKey,
        sessionToken: data.roleCredentials.sessionToken
      });
      resolve(ssoCredentials);
    });
  });
};

// getAccounts returns accounts the user has access to
const getAccounts = (listAccountsRequest: aws.SSO.ListAccountsRequest) => {
	return new Promise<AccountInfo[]>(resolve => {
    const sso = new aws.SSO({region: accountInfo.region});
		sso.listAccounts(listAccountsRequest, async (err, data: aws.SSO.ListAccountsResponse) => {
			const accounts: AccountInfo[] = data.accountList;
      resolve(accounts);
		});
	});
};

// getRoles returns roles the user has access to in an account
const getRoles = (accounts: AccountInfo[]) => {
	return new Promise<AccountInfo[]>(resolve => {
    const sso = new aws.SSO({region: accountInfo.region});
    let accountsProcessed = 0;
    let tempAccounts: AccountInfo[] = [];
    for (const account of accounts) {
      let tempAccount: AccountInfo = account;
      tempAccount.roles = [];
      accountsProcessed++;
      // List Account Roles
      sso.listAccountRoles({
        accessToken: cacheToken.accessToken,
        accountId: tempAccount.accountId,
      }, (err, data) => {
          tempAccount.roles = data.roleList;
          tempAccounts.push(tempAccount);
          console.log(tempAccount);
          console.log(`accounts processed: ${accountsProcessed} of ${tempAccounts.length}`);
          if (accountsProcessed === tempAccounts.length) {
            console.log(`resolved roles for: ${tempAccounts}`);
            resolve(tempAccounts);
          }
      });
    };
	});
};
