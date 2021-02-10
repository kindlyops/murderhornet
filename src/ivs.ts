import * as aws from "aws-sdk";
import { BrowserWindow } from 'electron';

interface Stream {
  channelArn?: string,
  state?: string,
  health?: string,
  viewerCount?: number,
  startTime?: Date,
}
// Get List of Live Streams in account
export let getStreams = async function (config: aws.Config): Promise<Stream[]> {
  const streams = await getStreamList(config, {});
  console.log(`getStreams: ${JSON.stringify(streams)}`);
  let focusedWindow = BrowserWindow.getFocusedWindow();
  focusedWindow.webContents.send('list-streams', streams);
  return streams;
}

// Get List of Live Streams in account
export let sendMetadata = async function (config: aws.Config, metadata: {channelArn: string, data: string}): Promise<Stream[]> {
  const response = await putMetadata(config, {
    channelArn: metadata.channelArn,
    metadata: metadata.data
  });
  return response;
}


  // getCredentials returns credentials from the provided role
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
// Start stop streams

// Send text to stream metadata
  // getCredentials returns credentials from the provided role
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

