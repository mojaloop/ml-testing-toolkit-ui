
import { set, get } from 'idb-keyval';

export const LocalDB = {

    setItem: async function (key, value) {
        await set(key, value);
    },

    getItem: async function (key) {
        const data = await get(key);
        return data;
    },

};
