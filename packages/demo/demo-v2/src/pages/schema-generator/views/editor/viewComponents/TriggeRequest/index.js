
import genSchema from '../genSchema.js';
import TriggeRequestWidget from '../../widgetComponents/TriggeRequestWidget/index.vue';

const viewSchema = {
    title: '触发请求',
    type: 'string',
    'ui:widget': TriggeRequestWidget,
};
export default {
    viewSchema,
    propsSchema: genSchema({
        options: {
            type: 'object',
            title: '选项',
            required: [],
            properties: {
                uiOptions: {
                    type: 'object',
                    properties: {
                        // action: {
                        //     title: '请求接口',
                        //     type: 'string',
                        //     format: 'uri',
                        //     default: 'https://run.mocky.io/v3/518d7af7-204f-45ab-9628-a6e121dab8ca'
                        // },
                        // btnText: {
                        //     title: '请求按钮文案',
                        //     type: 'string',
                        //     default: '点击触发'
                        // }
                    }
                }
            }
        }
    })
};
