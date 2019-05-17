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
        await this.playlistFileRepository.findOne(stream.playlist_file_id);

        const src_file = `C:/Users/sdragon-pc/Downloads/test5.mkv`;
        const dst_file = `rtmp://localhost:1935/webrtc/${stream.channel}`;
        return `ffmpeg -re -i ${src_file} -vcodec copy -acodec copy -f flv ${dst_file}`;
    }

    public async start(playlist_name: string, channel: string): Promise<Stream | undefined> {
        this.log.info('Start a new stream => ', playlist_name, channel);

        // this.eventDispatcher.dispatch('',);

        const stream = new Stream();
        const playlist = await this.playlistRepository.findOne({where: {name: playlist_name}, relations: ['files']});

        if (playlist) {

            // set stream source
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
        }

        return undefined;
    }

    public async stop(playlist_name: string, channel: string, kill_process: boolean): Promise<boolean> {
        this.log.info('Stop a new stream => ', playlist_name, channel);

        // find playlist
        const playlist = await this.playlistRepository.findOne({name: playlist_name});
        if (!playlist) {
            this.log.warn('invalid playlist name ', playlist_name);
            return false;
        }

        // find stream
        const stream = await this.streamRepository.findOne({ where: {playlist_id: playlist.id} });
        if (!stream) {
            // can not find stream which has playlist id.
            this.log.warn('can not find stream with playlist ', playlist_name);
            return false;
        }

        // stop stream
        if (kill_process) {
            this.killProcess(stream.process_id);
        }

        this.streamRepository.remove(stream);
        return true;
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
            this.log.error('No stream ', playlist_name, channel);
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
