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
           <SendMetadataButton/>
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