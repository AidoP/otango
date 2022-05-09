import axios from 'axios';
import { StoreDefinition } from 'pinia';
import { backend } from '../main';
import { user_store, User } from './auth';
import { Tag } from './tag';
const user = user_store();

export class Word {
    public word: string;
    public readings: WordReading[];
    public tags: Tag[];
    constructor(word: string) {
        this.word = word;
        this.readings = [];
        this.tags = [];
    }
    async set() {
        const data = await user.sign(this);
        await axios.post(backend.join(`/word/${encodeURIComponent(this.word)}`), data);
    }
    static async get(word: string): Promise<Word> {
        return await (await axios.get(backend.join(`/word/${encodeURIComponent(word)}`))).data
    }
}

export class WordReading {
    full: string;
    accent: string;
    definitions: Definition[];
    constructor(full: string, accent: string) {
        this.full = full;
        this.accent = accent;
        this.definitions = [];
    }
}
export class Definition {
    definition: string;
    constructor(definition: string) {
        this.definition = definition;
    }
}

export class Reading {

}