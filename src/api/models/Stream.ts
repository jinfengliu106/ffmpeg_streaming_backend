import { IsNotEmpty } from 'class-validator';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('stream')
export class Stream {
    // Process id of ffmpeg
    @PrimaryColumn()
    public id: number;

    @Column()
    public process_id: number;
    // playlist id
    @IsNotEmpty()
    @Column()
    public playlist_id: number;

    // playlist file id.
    @IsNotEmpty()
    @Column()
    public playlist_file_id: number;

    // ffmpeg destination param. ex:) myStream. In this case publish to rtmp://[wowza-ip]:1935/webrtc/myStream
    @IsNotEmpty()
    @Column()
    public channel: string;

    @IsNotEmpty()
    @Column()
    public playing: boolean;

    @IsNotEmpty()
    @Column()
    public started_at: Date;
}
