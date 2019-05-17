import { IsNotEmpty } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Playlist } from './Playlist';

@Entity('playlist_file')
export class PlaylistFile {

    @PrimaryColumn()
    public id: number;

    @IsNotEmpty()
    @Column()
    public name: string;

    @IsNotEmpty()
    @Column()
    public file_path: string;

    @IsNotEmpty()
    @Column()
    public playlist_id: number;

    @Column()
    public created_at: Date;

    @Column()
    public updated_at: Date;

    @ManyToOne(type => Playlist, playlist => playlist.files)
    @JoinColumn({ name: 'playlist_id' })
    public playlist: Playlist;
}
