import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {GuildController} from "./guild.controller";
import {GuildService} from "./guild.service";

@Module({
  imports: [],
  controllers: [AppController, GuildController],
  providers: [AppService, GuildService],
})
export class AppModule {}
