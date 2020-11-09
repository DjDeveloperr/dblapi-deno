export interface DBLOptions {
    token: string
    secret?: string
    id?: string
}

export type HTTPRequestMethod = 'get' | 'post' | 'put' | 'patch' | 'head' | 'delete'

export interface AnyObj { [key: string]: any }

export const BASE_URL = 'https://top.gg/api'

export interface BotStatsPayload {
    server_count?: number
    shards: number[]
    shard_count?: number
}

export interface BaseUser {
    id: string
    username: string
    discriminator: string
    avatar?: string
    defAvatar: string
}

export interface UserSocials {
    youtube?: string
    reddit?: string
    twitter?: string
    instagram?: string
    github?: string
}

export interface User extends BaseUser {
    bio?: string
    banner?: string
    social: UserSocials
    color?: string
    supporter: boolean
    certifiedDev: boolean
    mod: boolean
    webMod: boolean
    admin: boolean
}

export interface BotInfo extends BaseUser {
    lib: string
    prefix: string
    shortdesc: string
    longdesc?: string
    tags: string[]
    website?: string
    github?: string
    owners: string[]
    guilds: string[]
    invite?: string
    date: string
    certifiedBot: boolean
    vanity?: string
    points: number
    monthlyPoints: number
    donatebotguildid: string
}

export class BotStats {
    serverCount?: number
    shards: number[] = []
    shardCount?: number

    constructor(data: BotStatsPayload) {
        this.serverCount = data.server_count
        this.shards = data.shards
        this.shardCount = data.shard_count
    }
}

export interface QueryOptions {
    /** The amount of bots to return. Max. 500 */
    limit?: number
    /** Amount of bots to skip */
    offset?: number
    /** A search string in the format of field: value field2: value2 */
    search: string
    /** The field to sort by. Prefix with - to reverse the order */
    sort: string
    /** A comma separated list of fields to show. */
    fields: string
}

export class DBL {
    /** API token for DBL */
    token: string
    /** Your Bot's ID */
    id?: string
    /** Secret if you have set any to arrive with Webhook Payloads */
    secret?: string

    constructor(options: DBLOptions) {
        this.token = options.token
        this.secret = options.secret
        this.id = options.id
    }

    /** Prepare Request Options */
    prepare(method: HTTPRequestMethod, body?: any) {
        const data = {
            method: method.toUpperCase(),
            headers: {
                Authorization: this.token
            },
            body,
        }
        if (method === 'get' && body !== undefined) delete data.body
        return data
    }

    /** Make a Request to DBL API */
    async request(method: HTTPRequestMethod, url: string, body?: AnyObj) {
        let finalUrl = BASE_URL + url
        if (body !== undefined && method === 'get') finalUrl += `?${Object.entries(body).map(([k, v]) => {
            return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
        }).join('&')}`
        const res = await fetch(finalUrl, this.prepare(method, body))
        const data = res.status === 204 ? undefined : await res.json()
        if(![ 200, 204, 201 ].includes(res.status)) throw new Error(Deno.inspect(data))
        return data
    }

    /** Get a bot's info. Defaults to given ID in options if any. */
    async getBot(id?: string): Promise<BotInfo> {
        id = id === undefined ? this.id : id
        if (id === undefined) throw new Error('getBot required id argument')
        return await this.request('get', `/bots/${id}`)
    }

    /** Get a bot's stats. Defaults to given ID in options if any. */
    async getStats(id?: string): Promise<BotStats> {
        id = id === undefined ? this.id : id
        if (id === undefined) throw new Error('getStats required id argument')
        return new BotStats(await this.request('get', `/bots/${id}/stats`) as BotStatsPayload)
    }

    /** Get a User's info. */
    async getUser(id: string): Promise<User> {
        return await this.request('get', `/users/${id}`)
    }

    /** Search for bots using query. */
    async getBots(query: QueryOptions): Promise<AnyObj> {
        return await this.request('get', `/bots`, query)
    }

    /** Get votes of the bot. Last 1,000 only. Use Webhooks for bots with more than 1k monthly votes. */
    async getVotes(): Promise<User[]> {
        return await this.request('get', '/bots/votes')
    }

    /** Check whether a user has voted. */
    async hasVoted(id: string): Promise<boolean> {
        const res = await this.request('get', `/bots/check`, { userId: id })
        return res.voted === 1
    }

    /** Whether it is weekend or not. */
    async isWeekend(): Promise<boolean> {
        return await this.request('get', 'weekend').then((res: any) => res.is_weekend)
    }

    /** Post your bot's stats to DBL API. */
    async postStats(serverCount: number, shardID: number = 0, shardCount: number = 1): Promise<void> {
        await this.request('post', '/bots/stats', {
            server_count: serverCount,
            shard_id: shardID,
            shard_count: shardCount
        })
    }
}