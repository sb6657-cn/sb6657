<template>
    <SearchDialogHost />
    <HotMemeDialog />
    <SponsorModal v-model="sponsorDialog.visible" />
    <SubmissionDialog v-model="visible" />
</template>

<script setup lang="ts">
import HotMemeDialog from '@/components/hot-meme/hot-meme-dialog.vue';
import SponsorModal from '@/components/SponsorModal.vue';
import { useSponsorDialogStore } from '@/stores/useSponsorDialogStore';
import SearchDialogHost from '@/components/search-dialog-host.vue';
import SubmissionDialog from '@/components/submission-dialog.vue';
import { useSubmissionDialogStore } from '@/stores/useSubmissionDialogStore';
import { storeToRefs } from 'pinia';

const sponsorDialog = useSponsorDialogStore();
const submissionDialogStore = useSubmissionDialogStore();
const { visible } = storeToRefs(submissionDialogStore);
</script>
