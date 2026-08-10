'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Flex, Text } from '@radix-ui/themes';
import { type MouseEventHandler, useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import {
  CompanyAttachmentsUpdatePayloadUpsertItemFileType,
  type UpdateCompanyInformationBody,
} from '@/api/generated/models';
import type { CompanyInformationResponse } from '@/api/generated/models/companyInformationResponse';
import { Button } from '@/shared/Button';
import { FileUploadItem } from '@/shared/FileUpload/FileUpload';
import FileUploadInline from '@/shared/FileUploadInline';
import { FormButton } from '@/shared/FormButton';
import { Select, SelectItem, SelectItemText } from '@/shared/Select';
import { TextField } from '@/shared/TextField';
import { WithError } from '@/shared/WithError';
import { WithLabel } from '@/shared/WithLabel';
import withLabelStyles from '@/shared/WithLabel/withLabel.module.css';
import styles from './companyInformationForm.module.css';
import { FILE_TYPE_OPTIONS } from './constants';
import {
  type UpdateCompanyInformationFormSchema,
  updateCompanyInformationFormSchema,
} from './schemas';
import { responseToFormValues } from './utils';

export type CompanyInformationFormProps = {
  initialValue: CompanyInformationResponse | null;
  onSubmit: (values: UpdateCompanyInformationBody) => void | Promise<void>;
  onCancel?: MouseEventHandler<HTMLButtonElement>;
};

export default function CompanyInformationForm({
  initialValue,
  onSubmit,
  onCancel,
}: CompanyInformationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleSubmit, control } = useForm({
    resolver: zodResolver(updateCompanyInformationFormSchema),
    defaultValues: responseToFormValues(initialValue),
    shouldFocusError: true, // エラーが発生したフィールドにフォーカスを当てる(各コンポーネントに field.ref を渡す必要がある)
    mode: 'onBlur',
  });

  const offices = useFieldArray({
    control,
    name: 'offices.upsert',
    keyName: 'key',
  });

  const attachments = useFieldArray({
    control,
    name: 'attachments.upsert',
    keyName: 'key',
  });

  const doSubmit: SubmitHandler<UpdateCompanyInformationFormSchema> = async (values) => {
    setIsSubmitting(true);
    await onSubmit(values);
    setIsSubmitting(false);
  };

  return (
    <Box className={styles.root}>
      <form onSubmit={handleSubmit(doSubmit)}>
        <Box className={styles.formContent}>
          <Text className={styles.descriptionText}>
            設定した企業情報をもとにLabidが案件の収集や参加申請書類の自動化などを行います
          </Text>

          {/* 法人番号 */}
          <Controller
            control={control}
            name='companyInformation.corporateNumber'
            render={({ field, fieldState }) => (
              <WithLabel label='法人番号'>
                <WithError error={fieldState.error?.message}>
                  <TextField {...field} value={field.value ?? ''} placeholder='法人番号を入力' />
                </WithError>
              </WithLabel>
            )}
          />

          {/* 会社名 */}
          <Controller
            control={control}
            name='companyInformation.name'
            render={({ field, fieldState }) => (
              <WithLabel label='会社名'>
                <WithError error={fieldState.error?.message}>
                  <TextField {...field} value={field.value ?? ''} placeholder='会社名を入力' />
                </WithError>
              </WithLabel>
            )}
          />

          {/* 郵便番号 */}
          <Controller
            control={control}
            name='companyInformation.postalCode'
            render={({ field, fieldState }) => (
              <WithLabel label='郵便番号'>
                <WithError error={fieldState.error?.message}>
                  <TextField {...field} value={field.value ?? ''} placeholder='郵便番号を入力' />
                </WithError>
              </WithLabel>
            )}
          />

          {/* 住所 */}
          <Controller
            control={control}
            name='companyInformation.address'
            render={({ field, fieldState }) => (
              <WithLabel label='住所'>
                <WithError error={fieldState.error?.message}>
                  <TextField {...field} value={field.value ?? ''} placeholder='住所を入力' />
                </WithError>
              </WithLabel>
            )}
          />

          {/* 代表者名 */}
          <Controller
            control={control}
            name='companyInformation.director'
            render={({ field, fieldState }) => (
              <WithLabel label='代表者名'>
                <WithError error={fieldState.error?.message}>
                  <TextField {...field} value={field.value ?? ''} placeholder='代表者名を入力' />
                </WithError>
              </WithLabel>
            )}
          />

          {/* 電話番号 */}
          <Controller
            control={control}
            name='companyInformation.telNum'
            render={({ field, fieldState }) => (
              <WithLabel label='電話番号'>
                <WithError error={fieldState.error?.message}>
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    placeholder='電話番号を入力'
                    inputMode='tel'
                  />
                </WithError>
              </WithLabel>
            )}
          />

          {/* FAX */}
          <Controller
            control={control}
            name='companyInformation.faxNum'
            render={({ field, fieldState }) => (
              <WithLabel label='FAX'>
                <WithError error={fieldState.error?.message}>
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    placeholder='FAX番号を入力'
                    inputMode='tel'
                  />
                </WithError>
              </WithLabel>
            )}
          />

          {/* 資本金 */}
          <Controller
            control={control}
            name='companyInformation.capital'
            render={({ field, fieldState }) => (
              <WithLabel label='資本金'>
                <WithError error={fieldState.error?.message}>
                  <TextField
                    {...field}
                    value={field.value?.toString() ?? ''}
                    placeholder='資本金を入力'
                    inputMode='numeric'
                  />
                </WithError>
              </WithLabel>
            )}
          />

          {/* 従業員数 */}
          <Controller
            control={control}
            name='companyInformation.employeesNum'
            render={({ field, fieldState }) => (
              <WithLabel label='従業員数'>
                <WithError error={fieldState.error?.message}>
                  <TextField
                    {...field}
                    value={field.value?.toString() ?? ''}
                    placeholder='従業員数を入力'
                    inputMode='numeric'
                  />
                </WithError>
              </WithLabel>
            )}
          />

          {/* 業種 */}
          <Controller
            control={control}
            name='companyInformation.industryType'
            render={({ field, fieldState }) => (
              <WithLabel label='業種'>
                <WithError error={fieldState.error?.message}>
                  <TextField {...field} value={field.value ?? ''} placeholder='業種を入力' />
                </WithError>
              </WithLabel>
            )}
          />

          {/* 売上高 */}
          <Controller
            control={control}
            name='companyInformation.sales'
            render={({ field, fieldState }) => (
              <WithLabel label='売上高'>
                <WithError error={fieldState.error?.message}>
                  <TextField
                    {...field}
                    value={field.value?.toString() ?? ''}
                    placeholder='売上高を入力'
                    inputMode='numeric'
                  />
                </WithError>
              </WithLabel>
            )}
          />

          {/* 設立年月日 */}
          <Controller
            control={control}
            name='companyInformation.establishedAt'
            render={({ field, fieldState }) => (
              <WithLabel label='設立年月日'>
                <WithError error={fieldState.error?.message}>
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    placeholder='設立年月日を入力(YYYY/MM/DD)'
                    inputMode='text'
                  />
                </WithError>
              </WithLabel>
            )}
          />

          {/* 事業所 */}
          <Box className={styles.rowsSection}>
            <Box className={styles.rowsHeader}>
              <Box className={styles.rowNameLabel}>
                <Text className={withLabelStyles.labelText}>事業所名</Text>
              </Box>
              <Box className={styles.rowAddressLabel}>
                <Text className={withLabelStyles.labelText}>事業所住所</Text>
              </Box>
            </Box>

            <Box className={styles.rowsList}>
              {offices.fields.map((field, index) => (
                <Box key={field.id ?? `id-${index}`} className={styles.rowItem}>
                  <Box className={styles.rowNameField}>
                    <Controller
                      control={control}
                      name={`offices.upsert.${index}.name`}
                      render={({ field: formField, fieldState }) => (
                        <WithError error={fieldState.error?.message}>
                          <TextField
                            {...formField}
                            value={formField.value ?? ''}
                            placeholder='事業所名を入力'
                          />
                        </WithError>
                      )}
                    />
                  </Box>
                  <Box className={styles.rowAddressField}>
                    <Controller
                      control={control}
                      name={`offices.upsert.${index}.address`}
                      render={({ field: formField, fieldState }) => (
                        <WithError error={fieldState.error?.message}>
                          <TextField
                            {...formField}
                            value={formField.value ?? ''}
                            placeholder='事業所住所を入力'
                          />
                        </WithError>
                      )}
                    />
                  </Box>
                  <Controller
                    control={control}
                    name={'offices.deleteIds'}
                    render={({ field: formField }) => (
                      <FormButton
                        className={styles.deleteButton}
                        size='small'
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.preventDefault();
                          offices.remove(index);
                          if (typeof field.id === 'number') {
                            formField.onChange([...(formField.value ?? []), field.id]);
                          }
                        }}
                        aria-label='事業所を削除'
                      >
                        削除
                        <span className='material-icons' translate='no' aria-hidden='true'>
                          close
                        </span>
                      </FormButton>
                    )}
                  />
                </Box>
              ))}
            </Box>

            <Flex justify={'center'}>
              <Button
                size='small'
                variant='tertiary'
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  offices.append({ name: '', address: '' });
                }}
                aria-label='事業所を追加'
                data-testid='add-office-button'
              >
                追加
                <span className='material-icons' translate='no' aria-hidden='true'>
                  add
                </span>
              </Button>
            </Flex>
          </Box>

          {/* 関連ファイル */}
          <WithLabel label='関連ファイル'>
            <Box className={styles.rowsSection}>
              <Box className={styles.rowsList}>
                {attachments.fields.map((field, index) => (
                  <Box key={field.id ?? `id-${index}`} className={styles.rowItem}>
                    <Box className={styles.rowNameField}>
                      <Controller
                        control={control}
                        name={`attachments.upsert.${index}.fileType`}
                        render={({ field: formField, fieldState }) => (
                          <WithError error={fieldState.error?.message}>
                            <Select {...formField} value={formField.value} placeholder='種類を選択'>
                              {FILE_TYPE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <SelectItemText>{option.label}</SelectItemText>
                                </SelectItem>
                              ))}
                            </Select>
                          </WithError>
                        )}
                      />
                    </Box>
                    <Box className={styles.rowAddressField}>
                      <Controller
                        control={control}
                        name={`attachments.upsert.${index}.file`}
                        render={({ field: formField, fieldState }) => {
                          const isInitial = attachments.fields[index].id !== undefined;
                          if (isInitial) {
                            const fileName = initialValue?.attachments.find(
                              (attachment) => attachment.id === field.id
                            )?.name;
                            return (
                              <Box className={styles.fileNameField}>
                                <FileUploadItem fileName={fileName} showDeleteButton={false} />
                              </Box>
                            );
                          }
                          return (
                            <WithError error={fieldState.error?.message}>
                              <FileUploadInline
                                showDeleteButton={false}
                                file={formField.value}
                                onChange={(file) => {
                                  formField.onChange(file);
                                }}
                              />
                            </WithError>
                          );
                        }}
                      />
                    </Box>
                    <Controller
                      control={control}
                      name={'attachments.deleteIds'}
                      render={({ field: formField }) => (
                        <FormButton
                          className={styles.deleteButton}
                          size='small'
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.preventDefault();
                            attachments.remove(index);
                            if (typeof field.id === 'number') {
                              formField.onChange([...(formField.value ?? []), field.id]);
                            }
                          }}
                          aria-label='関連ファイルを削除'
                        >
                          削除
                          <span className='material-icons' translate='no' aria-hidden='true'>
                            close
                          </span>
                        </FormButton>
                      )}
                    />
                  </Box>
                ))}
              </Box>

              <Flex justify={'center'}>
                <Button
                  size='small'
                  variant='tertiary'
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    attachments.append({
                      fileType:
                        CompanyAttachmentsUpdatePayloadUpsertItemFileType.certificate_of_registered_matters,
                      file: undefined,
                    });
                  }}
                  aria-label='関連ファイルを追加'
                  data-testid='add-attachment-button'
                >
                  追加
                  <span className='material-icons' translate='no' aria-hidden='true'>
                    add
                  </span>
                </Button>
              </Flex>
            </Box>
          </WithLabel>

          {/* 保存ボタン */}
          <Box className={styles.footerButtons}>
            {onCancel && (
              <Button
                size='xl'
                variant='default'
                type='button'
                onClick={onCancel}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
            )}
            <Button size='xl' variant='primary' type='submit' loading={isSubmitting}>
              保存
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
}
