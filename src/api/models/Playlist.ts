import { IsNotEmpty } from 'class-validator';
import { Column, Entity, PrimaryColumn, OneToMany } from 'typeorm';
import { PlaylistFile } from './PlaylistFile';

@Entity('playlist')
export class Playlist {
    @PrimaryColumn()
    public id: number;

    @IsNotEmpty()
    @Column()
    public name: string;

    @IsNotEmpty()
    @Column()
    public play_type: string;

    @IsNotEmpty()
    @Column()
    public repeat: boolean;

    @IsNotEmpty()
    @Column()
    public created_at: Date;

    @IsNotEmpty()
    @Column()
    public updated_at: Date;

    @OneToMany(type => PlaylistFile, file => file.playlist)
    public files: PlaylistFile[];
}
