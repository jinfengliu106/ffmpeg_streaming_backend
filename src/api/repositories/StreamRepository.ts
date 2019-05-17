import { EntityRepository, Repository } from 'typeorm';

import { Stream } from '../models/Stream';

@EntityRepository(Stream)
export class StreamRepository extends Repository<Stream>  {

}
