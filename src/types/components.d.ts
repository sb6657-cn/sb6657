import '@vue/runtime-core';

declare module '@vue/runtime-core' {
    export interface GlobalComponents {
        MorphIcon: typeof import('morphicons/vue').MorphIcon;
    }
}

export {};
