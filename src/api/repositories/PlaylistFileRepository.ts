import { EntityRepository, Repository } from 'typeorm';

import { PlaylistFile } from '../models/PlaylistFile';

@EntityRepository(PlaylistFile)
export class PlaylistFileRepository extends Repository<PlaylistFile>  {

}
