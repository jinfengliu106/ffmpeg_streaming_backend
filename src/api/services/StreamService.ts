import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { exec } from 'child-process-promise';
import 'process';

// import { EventDispatcher, EventDispatcherInterface } from '../../decorators/EventDispatcher';
import { Logger, LoggerInterface } from '../../decorators/Logger';
// import { events } from '../subscribers/events';
import { StreamRepository } from '../repositories/StreamRepository';
import { PlaylistRepository } from '../repositories/PlaylistRepository';
import { PlaylistFileRepository } from '../repositories/PlaylistFileRepository';
import { Stream } from '../models/Stream';
import { env } from '../../env';

@Service()
export class StreamService {

    constructor(
        @OrmRepository() private streamRepository: StreamRepository,
        @OrmRepository() private playlistRepository: PlaylistRepository,
        @OrmRepository() private playlistFileRepository: PlaylistFileRepository,
        // @EventDispatcher() private eventDispatcher: EventDispatcherInterface,
        @Logger(__filename) private log: LoggerInterface
    ) { }

    public findOne(id: number): Promise<Stream | undefined> {
        this.log.info('Find one user');
        return this.streamRepository.findOne({ id });
    }

    // ffmpeg -re -i C:/Users/sdragon-pc/Downloads/test5.mkv -vcodec copy -acodec copy -f flv rtmp://localhost:1935/webrtc/mystream

    public async getCommand(stream: Stream): Promise<string> {
        const file = await this.playlistFileRepository.findOne(stream.playlist_file_id);

        const src_file = file.file_path;
        const dst_file = `rtmp://${env.wowza.host}:1935/${env.wowza.appname}/${stream.channel}`;
        return `ffmpeg -re -i ${src_file} -vcodec copy -acodec copy -f flv ${dst_file}`;
    }

    public async start(playlist_name: string, channel: string): Promise<[Stream | undefined, string]> {
        this.log.info('Start a new stream => ', playlist_name, channel);
        let msg = '';
        const playlist = await this.playlistRepository.findOne({where: {name: playlist_name}, relations: ['files']});

        if (playlist) {
            // check streaming already
            const exist = await this.streamRepository.findOne( {where: {playlist_id: playlist.id, channel}} );
            if (exist) {
                msg = `Already started streaming ${playlist_name}, ${channel}`;
                this.log.warn(msg);
                return [undefined, msg];
            }

            // set stream source
            const stream = new Stream();
            stream.playlist_id = playlist.id;
            stream.playlist_file_id = playlist.files[0].id;

            // set stream dest
            stream.channel = channel;
            stream.playing = false;
            stream.started_at = new Date();

            const command = await this.getCommand(stream);

            // run streamer
            const pid = this.runProcess(command, () => {
                this.log.debug('finished one, next stream. ', playlist_name, channel);
                this.nextStream(playlist_name, channel);
            });

            stream.process_id = pid;
            await this.streamRepository.save(stream);
            return [stream, ''];
        }

        msg = `No such playlist ${playlist_name}`;
        return [undefined, msg];
    }

    public async stop(playlist_name: string, channel: string, kill_process: boolean): Promise<[boolean, string]> {
        this.log.info('Stop a new stream => ', playlist_name, channel);

        let msg = '';
        // find playlist
        const playlist = await this.playlistRepository.findOne({name: playlist_name});
        if (!playlist) {
            msg = `Invalid playlist name ${playlist_name}`;
            this.log.warn(msg);
            return [false, msg];
        }

        // find stream
        const stream = await this.streamRepository.findOne({ where: {playlist_id: playlist.id} });
        if (!stream) {
            // can not find stream which has playlist id.
            msg = `Can not find a stream with playlist ${playlist_name}`;
            this.log.warn(msg);
            return [false, msg];
        }

        // stop stream
        if (kill_process) {
            this.killProcess(stream.process_id);
        }

        await this.streamRepository.remove(stream);
        return [true, `Stopped streaming ${playlist_name}.`];
    }

    public async nextStream(playlist_name: string, channel: string): Promise<Stream> {
        const playlist = await this.playlistRepository.findOne({where: {name: playlist_name}, relations: ['files']});
        const stream = await this.streamRepository.findOne({ where: {playlist_id: playlist.id, channel}});

        if (stream) {
            const idx = playlist.files.findIndex( (v) => {
                return (v.id === stream.playlist_file_id);
            });

            if (idx >= 0 && idx < playlist.files.length - 1) {
                this.log.debug('Play the next file of playlist.', playlist_name, channel);

                stream.playlist_file_id = playlist.files[idx + 1].id;

                this.streamRepository.save(stream);
                return stream;
            } else {
                this.log.debug('Reach to the end of playlist.', playlist_name, channel);

                this.stop(playlist_name, channel, false);
                return undefined;
            }
        } else {
            this.log.debug('No stream ', playlist_name, channel);
        }
        return undefined;
    }

    public killProcess(process_id: number): void {
        this.log.debug('kill process ', process_id, process.platform);

        try {
            if (process.platform === 'win32') {
                // if windows
                const cmd = `taskkill /T /F /PID ${process_id}`;
                console.log(cmd);
                exec(cmd);
            } else {
                // else linux
                process.kill(process_id);
                process.kill(process_id + 1);
            }
        } catch (e) {
            this.log.error('no process ', process_id);
        }
    }

    public runProcess(command: string, callback: any): number {
        this.log.debug(command);

        const child_proc = exec(command, () => {
            callback();
        });

        return child_proc.childProcess.pid;
    }
}
