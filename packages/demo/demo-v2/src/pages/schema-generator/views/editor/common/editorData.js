/**
 * Created by Liu.Jun on 2020/3/31 11:30 上午.
 */

import { getDefaultFormState } from '@lljj/vue-json-schema-form';
import { genId } from 'demo-common/utils/id';
import { isObject, isEmptyObject } from './utils';

// 生成一个新的editor item
export function generateEditorItem(toolItem) {
    const currentComponentPack = toolItem.componentPack;

    const ids = [currentComponentPack.viewSchema.format, currentComponentPack.viewSchema.type, genId()];
    const id = ids.filter(item => !!item).join('_');

    return {
        ...toolItem,
        isEdit: false,
        toolBar: {
            moveDownDisabled: false,
            moveUpDisabled: false,
            copyDisabled: false,
            removeDisabled: false,
        },
        componentValue: {
            ...!toolItem.componentValue || isEmptyObject(toolItem.componentValue) ? getDefaultFormState(
                currentComponentPack.propsSchema,
                {}, // 初始值为空
                currentComponentPack.propsSchema
            ) : toolItem.componentValue,
            property: (toolItem.componentValue && toolItem.componentValue.property) || id
        },
        id,
        ...(currentComponentPack.viewSchema.properties || (currentComponentPack.viewSchema.items && currentComponentPack.viewSchema.items.properties))
            ? { childList: [] }
            : {}
    };
}

// formLabel格式化
export function formatFormLabelWidth(value) {
    return value ? `${value * 4}px` : undefined;
}

// 转回来
export function deFormatFormLabelWidth(value) {
    return parseFloat(value) / 4;
}

function filterObj(obj, filter = (key, value) => (isObject(value) && !isEmptyObject(value)) || value !== undefined) {
    const result = {};
    if (!isObject(obj)) return result;

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const filterVal = filter(key, obj[key]);
            // 返回值Bool
            const isBoolOrUndefined = filterVal === undefined || Boolean(filterVal) === filterVal;

            // 如果是 Boolean 类型，使用原值
            if (isBoolOrUndefined && filterVal) {
                result[key] = obj[key];
            }

            // 非Boolean类型 使用返回后的值
            if (!isBoolOrUndefined) {
                result[key] = filterVal;
            }
        }
    }

    return result;
}
function addRelatin2Schema(viewSchema, relation, componentList) {
    // 给schema添加关联关系
    return viewSchema;
}
// 更新可关联表单列表
export function updateRelationList(editorItem, componentList) {
    if (!editorItem) return {};
    console.log('更新可关联表单列表', editorItem, componentList);
    const newList = componentList.map((item) => {
        const { enum: enums, enumNames } = item.componentValue.options.schemaOptions;
        return {
            title: item.id,
            type: 'string',
            enum: enums,
            enumNames
        };
    });
    debugger;
    const relationObj = editorItem.componentPack.propsSchema.properties.baseValue.properties.schemaOptions.properties.relation;
    relationObj.anyOf = newList;
    return editorItem;
}
export function editorItem2SchemaFieldProps(editorItem, formData, componentList = []) {
    // baseValue
    const {
        schemaOptions: baseSchemaOptions,
        uiOptions: {
            required,
            ...baseUiOptions
        } = {}
    } = editorItem.componentValue.baseValue;
    // options
    const {
        schemaOptions,
        uiOptions
    } = editorItem.componentValue.options || {};

    // rules
    const {
        schemaOptions: ruleSchemaOptions,
        uiOptions: ruleUiOptions,
    } = editorItem.componentValue.rules || {};

    // schema
    console.log('baseSchemaOptions', baseSchemaOptions);
    // 如果存在关联关系
    const relation = baseSchemaOptions.relation;
    let viewSchema = JSON.parse(JSON.stringify(editorItem.componentPack.viewSchema));
    if (relation) {
        console.log('关联关系是', viewSchema, relation, componentList);
        viewSchema = addRelatin2Schema(viewSchema, relation, componentList);
    }

    const schema = {
        ...viewSchema,
        ...filterObj({
            ...baseSchemaOptions,
            ...schemaOptions,
            ...ruleSchemaOptions
        })
    };

    // false 时可省略的属性值
    // todo: 这里需要优化自动对比default的值
    const ignoreAttrs = {
        // slider
        showInput: false,
        showStops: false,
        showInputControls: true,
        showTooltip: true,
        debounce: 300,

        // input number
        controlsPosition: 'default',
        stepStrictly: false,

        // input
        clearable: false,
        disabled: false,
        showPassword: false,
        showWordLimit: false,
        type: 'text',

        showTitle: true,
        showDescription: true,
    };

    // uiSchema
    const {
        hidden, widget, field, fieldProps, ...mergeUiOptions
    } = filterObj({
        ...baseUiOptions,
        ...uiOptions,
        ...ruleUiOptions
    }, (key, value) => {
        // 省略掉默认值
        if (ignoreAttrs[key] === value) return false;

        if (key === 'labelWidth') {
            return formatFormLabelWidth(value);
        }

        // 过滤undefined
        return value !== undefined;
    });

    const uiSchema = {
        ...Object.entries({
            hidden, widget, field, fieldProps
        }).reduce((preVal, [key, value]) => {
            if (value !== undefined) {
                preVal[`ui:${key}`] = value;
            }
            return preVal;
        }, {}),
        ...isEmptyObject(mergeUiOptions) ? {} : {
            'ui:options': mergeUiOptions
        }
    };

    return {
        rootSchema: schema,
        schema,
        required,
        rootFormData: formData,
        curNodePath: editorItem.componentValue.property || '',
        uiSchema
    };
}

function genBaseObj() {
    return {
        type: 'object',
        required: [],
        properties: {},
        'ui:order': []
    };
}

export function componentList2JsonSchema(componentList) {
    const baseObj = genBaseObj();
    console.log('componentList', componentList);
    let parentObj = baseObj;
    let queue = [{ $$parentFlag: parentObj }, ...componentList];

    const hasChild = data => Array.isArray(data.childList) && data.childList.length > 0;
    // 队列广度，同时标记父节点
    while (queue.length) {
        // 出队
        const item = queue.shift();

        // 标记节点 切换parent
        if (item.$$parentFlag) {
            parentObj = item.$$parentFlag;
        } else {
            const { schema, required, uiSchema } = editorItem2SchemaFieldProps(item, {}, componentList);
            const curSchema = {
                ...schema,
                ...uiSchema
            };

            // 入队
            if (hasChild(item)) {
                queue = [...queue, { $$parentFlag: curSchema }, ...item.childList];
            }

            // 连接数据
            (parentObj.properties || parentObj.items.properties)[item.componentValue.property] = curSchema;

            // 设置 ui:order
            (parentObj['ui:order'] || parentObj.items['ui:order']).push(item.componentValue.property);

            // 设置 required
            if (required) {
                (parentObj.required || parentObj.items.required).push(item.componentValue.property);
            }
        }
    }
    console.log('baseObj', baseObj);
    return baseObj;
}
