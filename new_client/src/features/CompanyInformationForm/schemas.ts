import { z } from 'zod';
import { ZodIssueCode } from 'zod/v3';
import { CompanyAttachmentsUpdatePayloadUpsertItemFileType } from '@/api/generated/models';

export const companyInformationAttributesSchema = z.object({
  name: z
    .string()
    .min(1, { error: '会社名は必須です' })
    .max(255, { error: '255文字以内で入力してください' })
    .optional(),
  corporateNumber: z.string().max(255, { error: '255文字以内で入力してください' }).nullish(),
  postalCode: z.string().max(20, { error: '20文字以内で入力してください' }).nullish(),
  address: z.string().max(255, { error: '255文字以内で入力してください' }).nullish(),
  director: z.string().max(255, { error: '255文字以内で入力してください' }).nullish(),
  telNum: z
    .string()
    .regex(/^[0-9()+-]*$/, { error: '電話番号は半角の数字・+・-・()のみ利用できます' })
    .max(255, { error: '255文字以内で入力してください' })
    .nullish(),
  faxNum: z.string().max(255, { error: '255文字以内で入力してください' }).nullish(),
  capital: z
    .preprocess(
      (v) => (v ? Number(v) : null),
      z
        .number({ error: '数値で入力してください' })
        .int({ error: '整数で入力してください' })
        .min(0, { error: '0以上の数値を入力してください' })
        .nullish()
    )
    .nullish(),
  employeesNum: z
    .preprocess(
      (v) => (v ? Number(v) : null),
      z
        .number({ error: '数値で入力してください' })
        .int({ error: '整数で入力してください' })
        .min(0, { error: '0以上の数値を入力してください' })
        .nullish()
    )
    .nullish(),
  industryType: z.string().max(255, { error: '255文字以内で入力してください' }).nullish(),
  sales: z
    .preprocess(
      (v) => (v ? Number(v) : null),
      z
        .number({ error: '数値で入力してください' })
        .int({ error: '整数で入力してください' })
        .min(0, { error: '0以上の数値を入力してください' })
        .nullish()
    )
    .nullish(),
  /**
   * 設立日のバリデーション（YYYY/MM/DD形式かつ正しい日付であることを判定）
   */
  establishedAt: z
    .string()
    .regex(/^(\d{4}\/\d{1,2}\/\d{1,2})?$/, { error: 'YYYY/MM/DDの形式で入力してください' })
    .superRefine((v, ctx) => {
      // 未入力または空文字は許容（nullish変換前、未入力時にはここに来る）
      if (!v) return;
      // 形式チェック（regexで仮に通っても安全にsplit）
      const parts = v.split('/');
      if (parts.length !== 3) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: 'YYYY/MM/DDの形式で入力してください',
        });
        return;
      }
      const [y, m, d] = parts.map(Number);
      // 年・月・日いずれかがNaNの場合もエラー
      if ([y, m, d].some((n) => Number.isNaN(n))) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: '正しい日付を入力してください',
        });
        return;
      }
      // 日付の論理チェック（コア: Date生成→一致比較）
      const date = new Date(y, m - 1, d);
      // 年月日すべて一致するかを確認
      if (date.getFullYear() !== y || date.getMonth() + 1 !== m || date.getDate() !== d) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: '存在する日付を入力してください',
        });
        return;
      }

      // 未来の日付はエラー
      if (date > new Date()) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: '未来の日付を入力できません',
        });
        return;
      }
    })
    .transform((v) => {
      // 未入力ならそのまま返す
      if (!v) return v;
      const [y, m, d] = v.split('/').map(Number);
      // DB登録/API送信用の「YYYY-MM-DD」形式に変換
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    })
    .nullish(),
});

export const companyOfficesUpdatePayloadSchema = z.object({
  deleteIds: z.array(z.number()).optional(),
  upsert: z
    .array(
      z
        .object({
          id: z.number().optional(),
          name: z.string(),
          address: z.string(),
        })
        .superRefine(({ name, address }, ctx) => {
          if (name && !address) {
            ctx.addIssue({
              path: ['address'],
              code: ZodIssueCode.custom,
              message: '住所は必須です',
            });
          } else if (!name && address) {
            ctx.addIssue({
              path: ['name'],
              code: ZodIssueCode.custom,
              message: '事業所名は必須です',
            });
          }
        })
    )
    .transform((v) => v.filter((office) => office.name || office.address))
    .optional(),
});

export const companyAttachmentsUpdatePayloadSchema = z.object({
  deleteIds: z.array(z.number()).optional(),
  upsert: z
    .array(
      z.object({
        id: z.number().optional(),
        fileType: z.enum(CompanyAttachmentsUpdatePayloadUpsertItemFileType, {
          error: 'ファイル種別が不正です',
        }),
        file: z.instanceof(File, { error: 'ファイルが不正です' }).optional(),
      })
    )
    .transform((v) => v.filter((attachment) => attachment.id || attachment.file))
    .optional(),
});

export const updateCompanyInformationFormSchema = z.object({
  companyInformation: companyInformationAttributesSchema.optional(),
  offices: companyOfficesUpdatePayloadSchema.optional(),
  attachments: companyAttachmentsUpdatePayloadSchema.optional(),
});

export type UpdateCompanyInformationFormSchema = z.infer<typeof updateCompanyInformationFormSchema>;
