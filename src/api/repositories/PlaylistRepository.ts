import { EntityRepository, Repository } from 'typeorm';

import { Playlist } from '../models/Playlist';

@EntityRepository(Playlist)
export class PlaylistRepository extends Repository<Playlist>  {

}
