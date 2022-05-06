import { ref } from 'vue'
import 'axios'
import axios from 'axios'
import { backend } from '../main';

class Database {
    static db = ref();
    static async get(): Promise<IDBDatabase> {
        if (this.db.value == null)
            return this.db.value = await open_database();
        else return this.db.value;
    }
}
async function open_database(): Promise<IDBDatabase> {
    const promise = new Promise<IDBDatabase>((resolve, reject) => {
        const open_req = window.indexedDB.open("auth", 1);
        open_req.onerror = event => reject(event.target);
        open_req.onupgradeneeded = event => {
            const request = event.target as IDBOpenDBRequest;
            const db = request.result;
            db.createObjectStore("user", { autoIncrement: true });
        };
        open_req.onsuccess = event => {
            const request = event.target as IDBOpenDBRequest;
            const db = request.result;
            resolve(db);
        };
    });
    return await promise;
}

export class User {
    static current = ref();
    static get() {
        return (this.current.value as User | null);
    }
    static set(user: User | null) {
        this.current.value = user
    }

    name: string;
    contact: string | null;
    private_key: CryptoKey;
    public_key: CryptoKey;
    constructor(name: string, contact: string | null, key: CryptoKeyPair) {
        this.name = name;
        this.contact = contact;
        this.private_key = key.privateKey;
        this.public_key = key.publicKey;
    }
    /*static async from_storage(): Promise<User | null> {
        const stored = localStorage.getItem("user");
        if (stored == null) return null;
        const user: StoredUser = JSON.parse(stored);
        const privateKey = crypto.subtle.importKey("pkcs8", user.private_key);
        return new User(user.user, {privateKey, publicKey});
    }*/
    async store() {
        (await Database.get()).transaction("user", "readwrite").objectStore("user").add(this);
    }
    static async generate(name: string, contact: string | null): Promise<User> {
        const algorithm = {
            name: "ECDSA",
            namedCurve: "P-256"
        };
        const key = await crypto.subtle.generateKey(algorithm, true, ["sign", "verify"]);
        return new User(name, contact, key);
    }
    async public_key_pem(): Promise<string> {
        const raw = await crypto.subtle.exportKey("spki", this.public_key);
        return `-----BEGIN PUBLIC KEY-----\n${window.btoa(String.fromCharCode.apply(null, new Uint8Array(raw) as any))}\n-----END PUBLIC KEY-----\n`;
    }
    async certificate(): Promise<Certificate> {
        return new Certificate(this.name, this.contact, await this.public_key_pem());
    }
    /**
     * Sign a request by this user.
     * The request is valid for one submission within a short time period from its creation.
     * @param data The request to sign
     * @returns A signed request
     */ 
    async sign<T>(data: T): Promise<Signed<By<T>>> {
        const challenge_request = await Signed.sign(this.private_key, this.name);
        const challenge = (await axios.post(backend.join("/auth/challenge"), challenge_request)).data;
        return await Signed.sign(this.private_key, new By(this.name, challenge.toString(), data));
    }
}

export class Signed<T> {
    data: T;
    signature: string;
    constructor(data: T, signature: string) {
        this.data = data;
        this.signature = signature;
    }
    static async sign<T>(privateKey: CryptoKey, data: T): Promise<Signed<T>> {
        const encoder = new TextEncoder();
        const d = JSON.stringify(data);
        const p1363 = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, encoder.encode(d));
        const p1363_view = new DataView(p1363);
        let prepend_r = false;
        let prepend_s = false;
        let len = 70;
        if (p1363_view.getUint8(0) > 0x7F) {
            len += 1;
            prepend_r = true;
        }
        if (p1363_view.getUint8(32) > 0x7F) {
            len += 1;
            prepend_s = true;
        }
        const signature = new ArrayBuffer(len);
        const signature_view = new DataView(signature);
        let pos = 0;
    
        signature_view.setUint8(pos++, 0x30); // Header
        signature_view.setUint8(pos++, len - 2); // Length
        signature_view.setUint8(pos++, 2); // Int Specifier
        signature_view.setUint8(pos++, prepend_r ? 33 : 32); // Length of r
        // r
        if (prepend_r) signature_view.setUint8(pos++, 0);
        for (let i = 0; i < 32; i++) signature_view.setUint8(pos++, p1363_view.getUint8(i));
    
        signature_view.setUint8(pos++, 2); // Int Specifier
        signature_view.setUint8(pos++, prepend_s ? 33 : 32); // Length of s
        // s
        if (prepend_s) signature_view.setUint8(pos++, 0);
        for (let i = 0; i < 32; i++) signature_view.setUint8(pos++, p1363_view.getUint8(32 + i));
    
        return new Signed(data, window.btoa(String.fromCharCode.apply(null, new Uint8Array(signature) as any)));
    }
}
export class By<T> {
    user: string;
    challenge: string;
    data: T;
    constructor(user: string, challenge: string, data: T) {
        this.user = user;
        this.challenge = challenge;
        this.data = data;
    }
}
export class Certificate {
    name: string;
    contact: string | null;
    pubkey: string;
    created: string;
    constructor(name: string, contact: string | null, pubkey: string) {
        this.name = name;
        this.contact = contact;
        this.pubkey = pubkey;
        this.created = new Date().toISOString();
    }
}
export async function register(name: string, contact: string | null) {
    const new_user = await User.generate(name, contact);
    User.set(new_user);

    const cert = await Signed.sign(new_user.private_key, await new_user.certificate());
    axios.post(backend.join('/auth/register'), cert)
        .then(r => console.log(r.data));

    (await Database.get()).transaction("user", "readonly").objectStore("user").getAll().onsuccess = console.log;
}
export async function challenge() {
    console.log(await User.get()?.sign("apples"))
}

export function signedRequest() {

}