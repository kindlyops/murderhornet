import './index.css';
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
        <div id="ivs">
            <p><span>Text To Send</span><label htmlFor="streamMetadata"></label>
            <span>
              <input type="text" id="metadata-input" name="streamMetadata"/>
            </span>
          </p>
          <label htmlFor="streams">Choose a stream to send to:</label>
        <div id="stream-list">Loading...</div>
          <RefreshStreamsButton/>
          <SendMetadataButton/>
          <StartStreamButton/>
          <StopStreamButton/>
        </div>
      </div>
    );
  }
}

  
ReactDOM.render(<LoginWithSSOButton />, document.getElementById('login'));

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