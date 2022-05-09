import axios from 'axios'
import { Ref, ref } from 'vue'
import { backend } from '../main';
import { defineStore } from 'pinia'

export class User {
    name: string;
    contact: string | null;
    private_key: CryptoKey;
    public_key: CryptoKey;
    constructor(name: string, contact: string | null, private_key: CryptoKey, public_key: CryptoKey) {
        this.name = name;
        this.contact = contact;
        this.private_key = private_key;
        this.public_key = public_key;
    }
    /*static async from_storage(): Promise<User | null> {
        const stored = localStorage.getItem("user");
        if (stored == null) return null;
        const user: StoredUser = JSON.parse(stored);
        const privateKey = crypto.subtle.importKey("pkcs8", user.private_key);
        return new User(user.user, {privateKey, publicKey});
    }*/
    static async get(db: IDBDatabase, name: string): Promise<User> {
        const promise = new Promise<User>((resolve, reject) => {
            const request = db.transaction("user", "readwrite").objectStore("user").get(name);
            request.onerror = reject;
            request.onsuccess = e => {
                const data = (e.target as any).result;
                resolve(new User(data.name, data.user, data.private_key, data.public_key))
            } 
        });
        return await promise;
    }
    async store(db: IDBDatabase) {
        db.transaction("user", "readwrite").objectStore("user").add(this);
    }
    static async generate(name: string, contact: string | null): Promise<User> {
        const algorithm = {
            name: "ECDSA",
            namedCurve: "P-256"
        };
        const key = await crypto.subtle.generateKey(algorithm, true, ["sign", "verify"]);
        return new User(name, contact, key.privateKey, key.publicKey);
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
    async sign(data: any): Promise<Signed<By<any>>> {
        const challenge_request = await Signed.sign(this.private_key, this.name);
        const challenge = (await axios.post(backend.join("/auth/challenge"), challenge_request)).data;
        return await Signed.sign(this.private_key, new By(this.name, challenge.toString(), data));
    }
}
export const user_store = defineStore("user", () => {
    const user: Ref<User | null> = ref(null)
    const database = ref()
    
    async function open_database() {
        const promise = new Promise<IDBDatabase>((resolve, reject) => {
            const open_req = window.indexedDB.open("auth", 1);
            open_req.onerror = event => reject(event.target);
            open_req.onupgradeneeded = event => {
                const request = event.target as IDBOpenDBRequest;
                const db = request.result;
                db.createObjectStore("user", { keyPath: "name", autoIncrement: true });
            };
            open_req.onsuccess = event => {
                const request = event.target as IDBOpenDBRequest;
                const db = request.result;
                resolve(db);
            };
        });
        database.value = await promise;
    }
    /// Get the user specified in local storage
    async function load() {
        if (database.value == null)
            await open_database();
        let user_name = localStorage.getItem("user");
        if (user_name == null) {
            return { user_name: null };
        }
        user.value = await User.get(database.value, user_name);
    }
    async function logout() {
        localStorage.removeItem("user");
        user.value = null;
    }
    async function register(name: string, contact: string | null) {
        const new_user = await User.generate(name, contact);
    
        const cert = await Signed.sign(new_user.private_key, await new_user.certificate());
        const response = await axios.post(backend.join("/auth/register"), cert);
        if (response.status != 201)
            return Promise.reject(await response.data());
        
        await new_user.store(database.value);
        localStorage.setItem("user", new_user.name);
        user.value = new_user;
    }
    async function sign(data: any): Promise<Signed<By<any>>> {
        console.log(user);
        if (user.value == null)
            return Promise.reject("Not logged in as a user");
        return user.value.sign(data)
    }
    /// Return a list of saved users
    async function saved(): Promise<User[]> {
        const promise = new Promise<User[]>((resolve, reject) => {
            const request: IDBRequest = database.value.transaction("user", "readonly").objectStore("user").getAll();
            request.onsuccess = (e => resolve((e.target as any).result));
        })
        return await promise;
    }
    async function from(serialised: string) {
        
    }
    return { user, from, load, logout, register, sign, saved }
});

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