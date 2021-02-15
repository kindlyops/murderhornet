import * as aws from "aws-sdk";
import { BrowserWindow } from 'electron';

interface Stream {
  channelArn?: string,
  state?: string,
  health?: string,
  viewerCount?: number,
  startTime?: Date,
  playbackUrl?: string,
};

interface Channel {
  arn?: string,
  name?: string,
  latencyMode?: string,
  authorized?: Boolean,
  tags?: aws.IVS.Tags,
};

// Get List of Channels
export let getChannels = async function (config: aws.Config): Promise<Channel[]> {
  const channels = await getChannelList(config, {});
  console.log(`getChannels: ${JSON.stringify(channels)}`);
  let focusedWindow = BrowserWindow.getFocusedWindow();
  focusedWindow.webContents.send('list-channels', channels);
  return channels;
}

// Get List of Live Streams in account
export let getStreams = async function (config: aws.Config): Promise<Stream[]> {
  const streams = await getStreamList(config, {});
  const updatedStreams = await updateStreamsList(config, streams);
  console.log(`getStreams: ${JSON.stringify(updatedStreams)}`);
  let focusedWindow = BrowserWindow.getFocusedWindow();
  focusedWindow.webContents.send('list-streams', updatedStreams);
  return updatedStreams;
}

// Get List of Live Streams in account
export let sendMetadata = async function (config: aws.Config, metadata: {channelArn: string, data: string}): Promise<Stream[]> {
  const response = await putMetadata(config, {
    channelArn: metadata.channelArn,
    metadata: metadata.data
  });
  return response;
}

// Get the the endpoint url including the StreamKey and playback url
export let getEndpoint = async function (config: aws.Config, channelArn: string): Promise<string> {
  const endpoint = await getStreamEndpoint(config, {
    arn: channelArn
  });
  const streamKeyArn = await getStreamKeyArn(config, {
    channelArn: channelArn
  });
  const streamKey = await getStreamKey(config, {
    arn: streamKeyArn
  });
  return `${endpoint}:443/app/${streamKey}`;
}

// getStreamKey returns the selected streamkey
const getStreamKey = (config: aws.Config, getStreamKeyRequest: aws.IVS.GetStreamKeyRequest) => {
  return new Promise<string>((resolve,reject) => {
    config.region = 'us-east-1';
    const ivs = new aws.IVS(config);
    ivs.getStreamKey(getStreamKeyRequest, async (err, data: aws.IVS.GetStreamKeyResponse ) => {
      if(err){
        reject(err);
      }
      resolve(data.streamKey.value);
    });
  });
};

// getStreamKeyArn returns the selected stream key arn
const getStreamKeyArn = (config: aws.Config, listStreamKeyRequest: aws.IVS.ListStreamKeysRequest) => {
  return new Promise<string>((resolve,reject) => {
    config.region = 'us-east-1';
    const ivs = new aws.IVS(config);
    ivs.listStreamKeys(listStreamKeyRequest, async (err, data: aws.IVS.ListStreamKeysResponse ) => {
      if(err){
        reject(err);
      }
      resolve(data.streamKeys[0].arn);
    });
  });
};

// getStreamEndpoint returns the select stream endpoint
const getStreamEndpoint = (config: aws.Config, getChannelRequest: aws.IVS.GetChannelRequest) => {
  return new Promise<string>((resolve,reject) => {
    config.region = 'us-east-1';
    const ivs = new aws.IVS(config);
    ivs.getChannel(getChannelRequest, async (err, data: aws.IVS.GetChannelResponse ) => {
      if(err){
        reject(err);
      }
      resolve(data.channel.ingestEndpoint);
    });
  });
};


  // getStreamList returns a list of IVS streams
const getStreamList = (config: aws.Config, listStreamsRequest: aws.IVS.ListStreamsRequest) => {
	return new Promise<Stream[]>((resolve,reject) => {
    config.region = 'us-east-1';
    const ivs = new aws.IVS(config);
    ivs.listStreams(listStreamsRequest, async (err, data: aws.IVS.ListStreamsResponse) => {
      if(err){
        reject(err);
      }
      resolve(data.streams);
    });
  });
};

  // getChannelList returns a list of IVS channels
  const getChannelList = (config: aws.Config, listChannelsRequest: aws.IVS.ListChannelsRequest) => {
    return new Promise<Channel[]>((resolve,reject) => {
      config.region = 'us-east-1';
      const ivs = new aws.IVS(config);
      ivs.listChannels(listChannelsRequest, async (err, data: aws.IVS.ListChannelsResponse) => {
        if(err){
          reject(err);
        }
        resolve(data.channels);
      });
    });
  };

  // getChannelPlaybackUrl returns the channel playback url
  const getChannelPlaybackUrl = (config: aws.Config, getChannelRequest: aws.IVS.GetChannelRequest) => {
    return new Promise<string>((resolve,reject) => {
      config.region = 'us-east-1';
      const ivs = new aws.IVS(config);
      ivs.getChannel(getChannelRequest, async (err, data: aws.IVS.GetChannelResponse) => {
        if(err){
          reject(err);
        }
        resolve(data.channel.playbackUrl);
      });
    });
  };
  // updateStreamsList adds playback url to streams lists
  const updateStreamsList = (config: aws.Config, streams: Stream[]) => {
    return new Promise<Stream[]>(async (resolve,reject) => {
      config.region = 'us-east-1';
      let newStreams: Stream[] = [];
      for await ( let stream of streams) {
        stream.playbackUrl = await getChannelPlaybackUrl(config,{arn: stream.channelArn});
        console.log(`updated stream: to use ${stream.playbackUrl}`);
        newStreams.push(stream);
      };
      console.log(`newstreams: ${JSON.stringify(newStreams)}`);
      resolve(newStreams);
    });
  };

// Start stop streams

// putMetadata sends metadata to the IVS stream
const putMetadata = (config: aws.Config, putMetadataRequest: aws.IVS.PutMetadataRequest) => {
  return new Promise<Stream[]>((resolve,reject) => {
    config.region = 'us-east-1';
    const ivs = new aws.IVS(config);
    ivs.putMetadata(putMetadataRequest, async (err, data: any ) => {
      if(err){
        reject(err);
      }
      resolve(data);
    });
  });
};

