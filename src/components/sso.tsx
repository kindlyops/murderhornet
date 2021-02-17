import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AccountInfo } from '../sso'
import { ipcRenderer } from 'electron';
import Select from 'react-select'

interface SelectedValues {
  label: string,
  value: string,
}
let selectedAccount: SelectedValues;

export class LoginWithSSOButton extends React.Component {
  render() {
    return (
      <button
        type="button"
        className="py-3 px-7 mt-6 text-white bg-indigo-500 rounded-md focus:bg-indigo-600 focus:outline-none"
        id="aws-sso-login"
        onClick={() => {
          ReactDOM.render(
          <LoginOptions />
          ,
          document.getElementById('login'));
        }}
        >Login With AWS-SSO</button>
    );
  }
}

class LoginWithSSOCancelButton extends React.Component {
  render() {
    return (
      <button
        id="aws-sso-login-cancel"
        type="button"
        className="p-3 py-3 px-7 mt-6 text-white bg-black rounded-md focus:bg-indigo-600 focus:outline-none"
        onClick={() => {
          ReactDOM.render(<LoginWithSSOButton />, document.getElementById('login'));
        }}
        >Cancel</button>
    );
  }
}

class UseAccountButton extends React.Component {
  render() {
    return (
      <button
        id="use-aws-account"
        type="button"
        className="py-3 px-7 mt-6 text-white bg-indigo-500 rounded-md focus:bg-indigo-600 focus:outline-none"
        onClick={ () => {
            var account = JSON.parse(selectedAccount.value);
            console.log(`Try using: ${JSON.stringify(account)}`)
            ipcRenderer.send('use-account', account);
          }
        }
        >Use Account</button>
    );
  }
}

class LoginOptions extends React.Component {
  render() {
    return (
      <div>
        <div className="w-full" id="options">
            <p><span>AWS SSO Name</span> <label htmlFor="ssoName"> </label>
            <span>
              <input type="text" id="sso-name" name="ssoName"/>
            </span>
          </p>
          <label htmlFor="regions">Choose an AWS Region: </label>
          <select className="flex col-auto" name="regions" id="sso-region">
            <option value="us-east-2">us-east-2</option>
            <option value="us-east-1">us-east-1</option>
            <option value="us-west-1">us-west-1</option>
            <option value="us-west-2">us-west-2</option>
          </select>

        </div>
        <div id="menu">
        <button
          id="save"
          className="py-3 px-7 mt-6 text-white bg-indigo-500 rounded-md focus:bg-indigo-600 focus:outline-none"
          onClick={() => {
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
      
          }}
          >Save</button>
          <LoginWithSSOCancelButton />
        </div>
      </div>
    );
  }
}


ipcRenderer.on('saved-reply', (event, account) => {
  const message = `${account.url}`;
  document.getElementById('messages').innerHTML = message;
});

ipcRenderer.on('account-reply', (event, msg) => {
  const message = `${msg}`;
  document.getElementById('messages').innerHTML = message;
});


ipcRenderer.on('list-accounts', (event, accounts) => {
  //Create and append the options
  console.log(accounts);
  let accountOptions: SelectedValues[] = [];

  for (var i = 0; i < accounts.length; i++) {
    if(accounts[i].roles) {
      for (var x = 0; x < accounts[i].roles.length; x++) {
        accountOptions.push(
          {
            label: `${accounts[i].accountName} - ${accounts[i].accountId} - ${accounts[i].roles[x].roleName}`,
            value: `${JSON.stringify(accounts[i].roles[x])}`
          }
        );
      }
    }
  }

  function handleChange(e: SelectedValues){
    selectedAccount = e;
  }

  ReactDOM.render(
    <Select 
      id="account-list"
      className="w-full"
      options={accountOptions}
      onChange={handleChange.bind(this)}
    />,
    document.getElementById('options')
  );
  ReactDOM.render(
    <UseAccountButton />,
    document.getElementById('menu')
  );

});