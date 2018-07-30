import { RedisString } from './redis-datastore';


export class PresistentString extends RedisString {
    static _groupId = "PRESISTENT-STRING";
}

