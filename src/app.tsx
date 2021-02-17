import './tailwind.css'
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { LoginWithSSOButton } from './components/sso';
import Select from 'react-select'
import { ipcRenderer } from 'electron';

interface SelectedValues {
    label: string,
    value: string,
}
let selectedStream: SelectedValues;
let selectedChannel: SelectedValues;


class RefreshStreamsButton extends React.Component {
  render() {
    return (
      <button
        id="refresh-streams"
        type="button"
        className="py-3 px-7 mt-6 text-white bg-indigo-500 rounded-md focus:bg-indigo-600 focus:outline-none"
        onClick={ () => {
            ipcRenderer.send('refresh-streams');
          }
        }
        >Refresh Streams</button>
    );
  }
}

class SendMetadataButton extends React.Component {
  render() {
    return (
      <button
        id="send-metadata"
        type="button"
        className="py-3 px-7 mt-6 text-white bg-indigo-500 rounded-md focus:bg-indigo-600 focus:outline-none"
        onClick={ () => {
            var metadata = {
                channelArn: selectedStream.value,
                data: (document.getElementById('metadata-input') as HTMLTextAreaElement).value
            };
            ipcRenderer.send('send-metadata', metadata);
          }
        }
        >Send Text</button>
    );
  }
}

class StartStreamButton extends React.Component {
  render() {
    return (
      <button
        id="start-stream"
        type="button"
        className="py-3 px-7 mt-6 text-white bg-indigo-500 rounded-md focus:bg-indigo-600 focus:outline-none"
        onClick={ () => {
            var channelArn = selectedChannel.value;
            ipcRenderer.send('start-stream', channelArn);
          }
        }
        >Start Stream</button>
    );
  }
}

class StopStreamButton extends React.Component {
  render() {
    return (
      <button
        id="start-stream"
        type="button"
        className="py-3 px-7 mt-6 text-white bg-indigo-500 rounded-md focus:bg-indigo-600 focus:outline-none"
        onClick={ () => {
            ipcRenderer.send('stop-stream');
          }
        }
        >Stop Stream</button>
    );
  }
}

class IVSOptions extends React.Component {
  render() {
    return (
      <div>
        <div className="container mx-auto bg-white min-w-1xl flex flex-col shadow" id="ivs">
            <p className="text-center px-12 py-5"><span className="text-gray-800 text-3xl font-semibold">Text To Send</span><label htmlFor="streamMetadata"></label>
            <span>
              <input className="w-full px-3 py-2 placeholder-gray-300 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100 focus:border-indigo-300 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 dark:border-gray-600 dark:focus:ring-gray-900 dark:focus:border-gray-500" type="text" id="metadata-input" name="streamMetadata"/>
              <SendMetadataButton/>
            </span>

          </p>
          <label htmlFor="streams">Choose a stream to send to:</label>
        <div  id="stream-list">Loading...</div>
        <RefreshStreamsButton/>
        <StartStreamButton/>
        <StopStreamButton/>
        </div>
      </div>
    );
  }
}

// Main App page
class App extends React.Component {
  render() {
    return (
      <div>
      <div  id="login" className="w-full bg-gray-100 p-10">
        <div className="mb-auto mt-auto max-w-lg">
          <h1 className="text-3xl uppercase">🐝 Murder Hornet</h1>
          <p className="font-semibold mb-5">Video Tools for AWS IVS</p>
          <p>Let's stream some video and send metadata.</p>
          <span className="py-3 px-7 mt-6">
          <LoginWithSSOButton></LoginWithSSOButton>
          </span>
          
        </div>

        <div className="w-full items-center container mx-auto">
          <h1 className="my-3 text-3xl font-semibold text-gray-700 dark:text-gray-200"></h1>
          <p className="text-4xl flex justify-between mb-2 bg-green-500"></p>
        </div>

      </div>
        <p id="messages"></p>
        <div className="w-full items-center container mx-auto" id="stream-info"></div>
        <div className="w-full items-center container mx-auto" id="channel-list"></div>
      </div>
    );
  }
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

ipcRenderer.on('list-streams', async (event, streams) => {
  //Create and append the options
  console.log(`list-streams: ${streams}`);
  let streamOptions: SelectedValues[] = [];
  await ReactDOM.render(<IVSOptions/>,document.getElementById('stream-info'));
  if(streams.length <= 0){
    document.getElementById('stream-list').innerHTML = "No Streams Available"
    return
  }

  for (var i = 0; i < streams.length; i++) {
    streamOptions.push(
        {
        label: `${streams[i].channelArn} - ${streams[i].state} - ${streams[i].health}`,
        value: streams[i].channelArn
        }
    );
  }

  function handleChange(e: SelectedValues){
      selectedStream = e;
  }

  ReactDOM.render(
    <Select 
      id="account-list"
      options={streamOptions}
      onChange={handleChange.bind(this)}
    />,
    document.getElementById('stream-list')
  );
});

ipcRenderer.on('list-channels', async (event, channels) => {
  //Create and append the options
  console.log(`list-channels: ${channels}`);
  let channelOptions: SelectedValues[] = [];

  for (var i = 0; i < channels.length; i++) {
    channelOptions.push(
        {
        label: `${channels[i].arn} - ${channels[i].name}`,
        value: channels[i].arn
        }
    );
  }

  function handleChange(e: SelectedValues){
      selectedChannel = e;
  }

  ReactDOM.render(
    <Select 
      id="channels"
      options={channelOptions}
      onChange={handleChange.bind(this)}
    />,
    document.getElementById('channel-list')
  );
});