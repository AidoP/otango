import { ref, reactive } from 'vue'

export const user = ref({})
export function register() {
    fetch('https://otango.trifuse.xyz/%E5%8D%98%E8%AA%9E/%E6%97%A5%E6%9C%AC', {
        headers: [['Content-Type', 'application/json']],
        method: "GET"
    }).then(r => {
        console.log(r.text())
    })
}
export function login() {

}

export function signedRequest() {

}