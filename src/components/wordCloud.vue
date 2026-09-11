<template>
    <div ref="wordCloud" class="word-cloud-chart"></div>
</template>

<script setup>
    import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import * as echarts from 'echarts';
    import 'echarts-wordcloud';
    import httpInstance from '@/apis/httpInstance';
    import { useThemeStore } from '@/stores/themeStore';

    const route = useRoute();
    const router = useRouter();
    const wordCloud = ref(null);
    const chart = shallowRef(null);
    const list = ref([]);
    const colors = ['#0d3555', '#58D5FF', '#0093c4', '#0d3555', '#0093c4', '#0d3555', '#73DDFF', '#58D5FF', '#ff0000', '#00ff00', '#ff0000', '#00ff00', '#1a721a', '#1a721a', '#1a721a'];
    const theme = useThemeStore();

    function handleWordClick(params) {
        const searchKey = typeof params?.name === 'string' ? params.name.trim() : '';
        if (!searchKey) return;

        void router.push({
            query: {
                ...route.query,
                search: searchKey,
            },
        });
    }

    function normalizeWordCloudData(res) {
        if (Array.isArray(res)) {
            return res;
        }

        if (Array.isArray(res?.data)) {
            return res.data;
        }

        return [];
    }

    function ensureChart() {
        if (!wordCloud.value) {
            return null;
        }

        if (!chart.value) {
            chart.value = echarts.init(wordCloud.value, 'macarons');
            chart.value.on('click', handleWordClick);
        }

        return chart.value;
    }

    function getWordCloudList() {
        const myc = ensureChart();
        if (!myc) {
            return;
        }

        myc.setOption(
            {
                tooltip: {
                    show: true,
                    borderColor: '#fe9a8bb3',
                    borderWidth: 1,
                    padding: [5, 5, 5, 5],
                    confine: true,
                    backgroundColor: theme.isDark ? 'rgba(26, 31, 39, .92)' : 'rgba(255, 255, 255, .9)',
                    textStyle: {
                        color: theme.isDark ? '#e6edf3' : 'hotpink',
                        lineHeight: 16,
                    },
                    extraCssText: 'box-shadow: 0 4px 20px -4px rgba(199, 206, 215, 1);border-radius: 4px;',
                },
                series: [
                    {
                        type: 'wordCloud',
                        cursor: 'pointer',
                        shape: 'pentagon',
                        left: 'center',
                        top: 'center',
                        width: '100%',
                        height: '100%',
                        right: null,
                        bottom: null,

                        sizeRange: [16, 30],
                        rotationRange: [-20, 20],
                        rotationStep: 25,

                        gridSize: 15,
                        drawOutOfBound: false,
                        layoutAnimation: true,

                        textStyle: {
                            fontFamily: 'PingFangSC-Semibold',
                            fontWeight: 600,
                            color: function () {
                                return colors[parseInt(Math.random() * colors.length)];
                            },
                        },
                        emphasis: {
                            focus: 'none',
                        },
                        data: list.value,
                    },
                ],
            },
            true
        );
    }

    function getData() {
        httpInstance
            .get('/machine/WordCloud')
            .then((res) => {
                list.value = normalizeWordCloudData(res);
                getWordCloudList();
            })
            .catch((error) => {
                console.error(error);
            });
    }

    onMounted(async () => {
        await nextTick();
        ensureChart();
        getData();
    });

    watch(
        () => theme.isDark,
        () => {
            getWordCloudList();
        },
    );

    onBeforeUnmount(() => {
        chart.value?.dispose();
        chart.value = null;
    });

    defineExpose({
        getData,
    });
</script>

<style lang="scss" scoped>
    .word-cloud-chart {
        height: 270px;
        width: 300px;
    }
</style>
