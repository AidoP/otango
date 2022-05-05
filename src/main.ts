import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

export class URI {
    base: URL;
    constructor(base?: string) {
        if (base)
            this.base = new URL(base);
        else
            this.base = new URL("https://otango.trifuse.xyz")
    }
    join(url: string): string {
        return new URL(url, this.base).toString();
    }
}

export const backend = new URI(import.meta.env.VITE_BACKEND);

app.use(router)

app.mount('#app')
