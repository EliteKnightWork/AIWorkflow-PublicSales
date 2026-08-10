import type { CustomObject } from '@/api/generated/models/customObject';
import type { CustomObjectItem } from '@/api/generated/models/customObjectItem';
import type { Project } from '@/api/generated/models/project';

type ConvertProjectToCSVOptions = {
  customObjectsByPipelineId?: Map<number, CustomObject[]>;
  userNameById?: Map<number, string>;
};

type CustomFieldDefinition = {
  templateItemId: number;
  header: string;
  inputType: CustomObjectItem['inputType'];
  order: number;
  templateTitle: string;
  itemTitle: string;
};

type PipelineCustomItemMap = Map<number, CustomObjectItem[]>;

const CSV_HEADER = [
  '案件名',
  '案件ステータス',
  '案件担当者',
  '入札方式',
  '都道府県',
  '発注機関',
  '公告日',
  '参加申し込み期日',
  '提案書期日',
  '入札日',
  '予定価格',
  '掲載元URL',
  'Labid URL',
];

type SanitizeOptions = {
  preserveLineBreaks?: boolean;
};

const sanitizeValue = (value?: string | null, options: SanitizeOptions = {}) => {
  const { preserveLineBreaks = false } = options;
  const normalized = (value ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/"/g, '""');

  if (preserveLineBreaks) {
    return normalized;
  }

  return normalized.replace(/\n+/g, '');
};

const wrapCsvValue = (value?: string | null, options?: SanitizeOptions) =>
  `"${sanitizeValue(value, options)}"`;

const buildCustomFieldMetadata = (
  customObjectsByPipelineId?: Map<number, CustomObject[]>
): {
  definitions: CustomFieldDefinition[];
  pipelineValueMap: Map<number, PipelineCustomItemMap>;
} => {
  const pipelineValueMap = new Map<number, PipelineCustomItemMap>();
  const definitionLookup = new Map<number, CustomFieldDefinition>();

  if (!customObjectsByPipelineId) {
    return { definitions: [], pipelineValueMap };
  }

  customObjectsByPipelineId.forEach((customObjects, pipelineId) => {
    const itemMap: PipelineCustomItemMap = new Map();

    customObjects.forEach((customObject) => {
      const parentTitle = sanitizeValue(customObject.title);

      customObject.customObjectItems?.forEach((item) => {
        const templateItemId = item.customObjectTemplateItemId;
        if (templateItemId == null) return;

        if (!definitionLookup.has(templateItemId)) {
          definitionLookup.set(templateItemId, {
            templateItemId,
            header: `[${parentTitle}] ${sanitizeValue(item.title)}`,
            inputType: item.inputType,
            order: item.order ?? Number.MAX_SAFE_INTEGER,
            templateTitle: parentTitle,
            itemTitle: sanitizeValue(item.title),
          });
        }

        if (!itemMap.has(templateItemId)) {
          itemMap.set(templateItemId, []);
        }

        itemMap.get(templateItemId)?.push(item);
      });
    });

    if (itemMap.size > 0) {
      pipelineValueMap.set(pipelineId, itemMap);
    }
  });

  const definitions = Array.from(definitionLookup.values()).sort((a, b) => {
    const templateComparison = a.templateTitle.localeCompare(b.templateTitle, 'ja');
    if (templateComparison !== 0) return templateComparison;

    if (a.order !== b.order) {
      return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
    }

    return a.itemTitle.localeCompare(b.itemTitle, 'ja');
  });

  return { definitions, pipelineValueMap };
};

const formatCalendarValue = (value?: string | null) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return sanitizeValue(value);
  }

  const month = `0${date.getMonth() + 1}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  return `${date.getFullYear()}-${month}-${day}`;
};

const formatCustomFieldValue = (
  items: CustomObjectItem[] | undefined,
  definition: CustomFieldDefinition,
  userNameById?: Map<number, string>
) => {
  if (!items || items.length === 0) {
    return wrapCsvValue('');
  }

  switch (definition.inputType) {
    case 'checkbox': {
      const selected = items
        .filter((item) => item.isChecked)
        .map((item) => item.checkboxTitle ?? item.radioButtonTitle ?? '')
        .filter((label) => label && label.length > 0);
      return wrapCsvValue(selected.join(', '));
    }
    case 'radio': {
      const selected = items.find((item) => item.isChecked);
      return wrapCsvValue(selected ? (selected.radioButtonTitle ?? '') : '');
    }
    case 'person': {
      const names = items
        .map((item) => (item.userId != null ? (userNameById?.get(item.userId) ?? '') : ''))
        .filter((name) => name.length > 0);
      return wrapCsvValue(names.join(', '));
    }
    case 'calendar': {
      const first = items.find((item) => item.calendar);
      return wrapCsvValue(formatCalendarValue(first?.calendar));
    }
    case 'number': {
      const first = items.find((item) => item.numberValue != null);
      const value = first?.numberValue;
      return wrapCsvValue(value != null ? String(value) : '');
    }
    case 'url': {
      const first = items.find((item) => item.url);
      return wrapCsvValue(first ? (first.url ?? '') : '');
    }
    case 'free_text_multiline': {
      const first =
        items.find((item) => item.freeText != null && item.freeText.length > 0) ?? items[0];
      const value = first ? (first.freeText ?? '') : '';
      return wrapCsvValue(value, { preserveLineBreaks: true });
    }
    default: {
      const first =
        items.find((item) => item.freeText != null && item.freeText.length > 0) ?? items[0];
      return wrapCsvValue(first ? (first.freeText ?? '') : '');
    }
  }
};

export const convertProjectToCSV = (
  projects: Project[],
  options?: ConvertProjectToCSVOptions
): string => {
  const { customObjectsByPipelineId, userNameById } = options ?? {};
  const { definitions, pipelineValueMap } = buildCustomFieldMetadata(customObjectsByPipelineId);

  const headers = definitions.length
    ? CSV_HEADER.concat(definitions.map((definition) => definition.header))
    : CSV_HEADER;

  const csvArray = projects.map((project) => {
    const baseColumns = [
      `"${project.title?.replace(/[\n\r]+/g, '')}"`,
      `"${project.bidPipeline?.status?.name ?? ''}"`,
      `"${
        project.bidPipeline?.assignedUsers?.map((user) => user.name || user.email).join(',') || ''
      }"`,
      `"${project.procedureTypeGroup?.replace(/[\n\r]+/g, '')}"`,
      `"${project.prefectures?.join(',')}"`,
      `"${project.organizationName?.replace(/[\n\r]+/g, '')}"`,
      project.publicationDate,
      project.applicationDocumentDeadlineDate,
      project.proposalDocumentDeadlineDate,
      project.biddingDeadlineDate,
      project.plannedPrice,
      project.documentUrl,
      `${process.env.NEXT_PUBLIC_CLIENT_BASE_URL}/projects/${project.uuid}`,
    ];

    if (definitions.length === 0) {
      return baseColumns.join(',');
    }

    const pipelineId = project.bidPipeline?.id;
    const pipelineMap = pipelineId != null ? pipelineValueMap.get(Number(pipelineId)) : undefined;
    const customColumns = definitions.map((definition) =>
      formatCustomFieldValue(pipelineMap?.get(definition.templateItemId), definition, userNameById)
    );

    return baseColumns.concat(customColumns).join(',');
  });

  return [headers.join(','), ...csvArray].join('\n');
};
