import {
    Get, JsonController, Param,
} from 'routing-controllers';

import { StreamService } from '../services/StreamService';

// @Authorized()
@JsonController('/streams')
export class StreamController {

    constructor(
        private streamService: StreamService
    ) { }

    @Get('/start/:playlist_name/:channel')
    public async startStream(@Param('playlist_name')playlist_name: string, @Param('channel')channel: string): Promise<any> {
        await this.streamService.start(playlist_name, channel);
        return {status: 0, message: ''};
    }

    @Get('/stop/:playlist_name/:channel')
    public async stopStream(@Param('playlist_name')playlist_name: string, @Param('channel')channel: string): Promise<any> {
        await this.streamService.stop(playlist_name, channel, true);
        return {status: 0, message: ''};
    }
}
