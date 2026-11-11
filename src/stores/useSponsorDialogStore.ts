import { defineStore } from 'pinia';

export const useSponsorDialogStore = defineStore('sponsorDialog', {
    state: () => ({ visible: false }),
    actions: {
        open() {
            this.visible = true;
        },
    },
});
