import { Bool } from "aws-sdk/clients/clouddirectory";
import Ffmpeg from "fluent-ffmpeg";

var ffmpeg = require('fluent-ffmpeg');


interface StreamOptions {
  url: string
  input: string
  inputOptions: string[]
}

export class FFMpegStream extends Function {
  _bound: Function;
  private config: StreamOptions;
  private options: string[];
  private status: Boolean = false;
  private cmd: Ffmpeg.FfmpegCommand = ffmpeg();
  constructor( config: StreamOptions ) {
    super('...args', 'return this._bound._call(...args)');
    this._bound = this.bind(this);
    this.config = config;
    // Options for testing
    this.options = [
      '-r 30',
      '-c:v libx264',
      '-pix_fmt yuv420p',
      '-profile:v main',
      '-preset veryfast',
      '-x264opts nal-hrd=cbr:no-scenecut',
      '-minrate 3000',
      '-maxrate 3000',
      '-g 60',
      '-c:a aac',
      '-b:a 160k',
      '-ac 2',
      '-ar 44100',
      '-f flv'
    ];

  }

  public startStream = async () => {
    console.log(`ffmpeg options: ${JSON.stringify(this.config)} and ${this.options}`);
    this.cmd.input(this.config.input)
      .inputOptions(this.config.inputOptions)
      .output(`rtmps://${this.config.url}`)
      .outputOptions(this.options)
      .on('start', (commandLine: string) => {
        console.log('Spawned Ffmpeg with command: ' + commandLine);
        this.status = true;
      })
      .on('error', (err: any, stdout: string, stderr: string) => {
        console.log('An error occurred: ' + err.message);
        console.log("stdout:\n" + stdout);
        console.log("stderr:\n" + stderr);
        this.status = false;
      })
      .on('end', () => {
        console.log('Finished processing');
        this.status = false;
      }).run();
  }
  public stopStream = async () => {
    console.log(`status: ${this.status}`);
    if (this.status){
      this.cmd.kill('SIGTERM');
      this.status = false;
    }
  }
}