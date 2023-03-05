<template>
    <el-button type="primary">{{ btnText }}</el-button>
</template>

 <script>
export default {
    name: 'TriggeRequestWidget',
    props: {
        btnText: {
            type: String,
            default: '点击上传'
        }
    },
    methods: {

    }
};
</script>
