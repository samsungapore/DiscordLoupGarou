import {Injectable} from '@nestjs/common';
import {db} from "./database";

@Injectable()
export class GuildService {
  async getGuilds(): Promise<Array<object>> {
    let data = await db.collection('guilds').get();
    let array = [];

    data.forEach(doc => {
      array.push(doc);
    });

    return array;
  }
}
