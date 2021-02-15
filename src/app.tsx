import './index.css';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { LoginWithSSOButton } from './components/sso';
import Select from 'react-select'
import { ipcRenderer } from 'electron';
import videojs from 'video.js';
import PropTypes from 'prop-types';

import 'video.js/dist/video-js.css';


interface SelectedValues {
    label: string,
    value: string,
    url?: string,
}
interface StreamType {
  channelArn: string,
  state: string,
  health: string,
  playbackUrl: string
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

class VideoPlayer extends React.Component <{
  src: string,
},{}>{


private player?: videojs.Player;
private videoNode?: HTMLVideoElement;

componentDidMount = () => {
    // This is a hack because I don't import video.js as a hard dependency
    // but load it alongside my app bundle
    if (typeof videojs === 'undefined') {
        setTimeout(this.componentDidMount, 500);
        return;
    }
    this.player = videojs(this.videoNode);
}

componentWillUnmount = () => {
    this.player && this.player.dispose();
    this.player = null;
}

render = () => (
    <div
        key="media"
        data-vjs-player>

        <video playsInline
            className="video-js"
            preload="auto"
            id="video-js"
            autoPlay={true}
            ref={ r => { this.videoNode = r; } } >

            <source src={ this.props.src } type="application/x-mpegURL" />

        </video>
    </div>
)
}

class StreamSection extends React.Component<{streams: StreamType[]}, {playbackUrl: string}> {
  private streamOptions: SelectedValues[];
  constructor(props: {streams: StreamType[]}) {
    super(props);
    //this.handleChange = this.handleChange.bind(this);
    this.state = {playbackUrl: ''};
    this.streamOptions = [{
      label: '',
      value: '',
      url: ''
    }];
    for (var i = 0; i < this.props.streams.length; i++) {
      this.streamOptions.push(
          {
          label: `${this.props.streams[i].channelArn} - ${this.props.streams[i].state} - ${this.props.streams[i].health}`,
          value: this.props.streams[i].channelArn,
          url: this.props.streams[i].playbackUrl
          }
      );
    }
  }

  handleChange(e: any) {
    console.log(`changed to new stream: ${JSON.stringify(e)}`);
    this.setState({playbackUrl: e.url});
    selectedStream = e;
    if(e.url) {
      videojs.getPlayer('video-js').play();
    }
  }

  render() {
    const streamOps = this.streamOptions;
    return (
      <div>
        <Select 
          id="account-list"
          options={streamOps}
          onChange={this.handleChange.bind(this)}
        />
        <VideoPlayer
          src = {this.state.playbackUrl}
        />
      </div>
    );
  }
}

ipcRenderer.on('list-streams', async (event, streams) => {
  //Create and append the options
  console.log(`list-streams: ${JSON.stringify(streams)}`);
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
        value: streams[i].channelArn,
        url: streams[i].playbackUrl
        }
    );
  }

  //function handleChange(e: SelectedValues){
  //    selectedStream = e;
  //}

  ReactDOM.render(
    <StreamSection
      streams = {streams}
    />
    ,
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