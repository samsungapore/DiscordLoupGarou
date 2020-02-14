import {Controller, Get, Req} from '@nestjs/common';
import { GuildService } from './guild.service';

@Controller('guilds')
export class GuildController {
  constructor(private readonly appService: GuildService) {}

  @Get()
  async getGuilds(): Promise<Array<object>> {
    return this.appService.getGuilds();
  }
}
