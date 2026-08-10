import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Autocomplete,
} from "@mui/material";
import { Create, TagField } from "@refinedev/mui";
import { useForm } from "@refinedev/react-hook-form";
import { useMemo, useRef, useState, useEffect } from "react";
import { prefectureList } from "../../utils/prefectureUtils";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Project } from "../../models/project";
import { Controller } from "react-hook-form";
import { displayQualificationName, ParticipateQualification } from "../../models/participateQualification";
import { useList } from "@refinedev/core";

export const ProjectCreate = () => {
  const {
    saveButtonProps,
    refineCore: { formLoading },
    register,
    setValue,
    watch,
    getValues,
    control,
    formState: { errors },
  } = useForm<Project>({
    defaultValues: {
      biddingDeadlineDate: "",
      briefingSessionDate: "",
      description: "",
      applicationDocumentDeadlineDate: "",
      proposalDocumentDeadlineDate: "",
      manualInputId: false,
      key: "",
      organizationName: "",
      externalDocumentUri: "",
      prefectures: [],
      multiSelect: [],
      procedureType: "",
      publicationDate: "",
      screenshots: null,
      attachments: null,
      plannedPrice: null,
      source: "manual",
      title: "",
      isExperienceRequired: false,
    },
  });
  const isManualInputId = watch("manualInputId");

  // 参加資格の選択肢の状態
  const [qualificationOptions, setQualificationOptions] = useState<{ id: string; name: string, qualificationId: string, qualificationName: string }[]>([]);

  // 参加資格のフィルター
  const [qualificationFilter, setQualificationFilter] = useState<string>("");

  // 参加資格等級データを取得
  const { data: qualificationsData, error: qualificationError } = useList<ParticipateQualification>({
    resource: "participate_qualifications",
    pagination: { current: 1 },
    filters: [
      {
        field: "name",
        operator: "contains",
        value: qualificationFilter,
      },
    ],
    queryOptions: {
      enabled: !!qualificationFilter,
    }
  });

  useEffect(() => {
    if (qualificationError) {
      alert(`参加資格情報の取得に失敗しました: ${qualificationError.message}`);
    } else {
      if (qualificationFilter) {
        const data = qualificationsData?.data || [];
        const list = data.flatMap(q =>
          q.grades.map(g => ({
            id: g.gradeId?.toString() || '',
            name: g.name || '等級なし',
            qualificationId: q.id.toString(),
            qualificationName: displayQualificationName(q),
          }))
        );
        setQualificationOptions(list);
      } else {
        setQualificationOptions([]);
      }
    }
  }, [qualificationsData, qualificationError, qualificationFilter]);

  const atatchmentInputRef = useRef<HTMLInputElement>(null);
  const [atatchmentInputFiles, setAtatchmentInputFiles] =
    useState<FileList | null>(null);

  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const [screenshotInputFiles, setScreenshotInputFiles] =
    useState<FileList | null>(null);

  const attachmentFileArray: File[] = useMemo(() => {
    return atatchmentInputFiles ? [...Array.from(atatchmentInputFiles)] : [];
  }, [atatchmentInputFiles]);

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    if (!atatchmentInputRef.current?.files) return;
    const newFileArray = [
      ...attachmentFileArray,
      ...Array.from(e.target.files),
    ].filter(
      (file, index, self) =>
        self.findIndex((f) => f.name === file.name) === index, // 重複を削除
    );
    const dt = new DataTransfer();
    newFileArray.forEach((file) => dt.items.add(file));
    atatchmentInputRef.current.files = dt.files; // input内のFileListを更新
    setAtatchmentInputFiles(dt.files); // Reactのstateを更新
    setValue("attachments", dt.files);
  };

  const handleAttachmentDelete = (index: number) => {
    if (!atatchmentInputRef.current?.files) return;
    const dt = new DataTransfer();
    attachmentFileArray.forEach((file, i) => i !== index && dt.items.add(file));
    atatchmentInputRef.current.files = dt.files; // input内のFileListを更新
    setAtatchmentInputFiles(dt.files); // Reactのstateを更新
    setValue("attachments", dt.files);
  };

  const screenshotFileArray: File[] = useMemo(() => {
    return screenshotInputFiles ? [...Array.from(screenshotInputFiles)] : [];
  }, [screenshotInputFiles]);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    if (!screenshotInputRef.current?.files) return;
    const newFileArray = [
      ...screenshotFileArray,
      ...Array.from(e.target.files),
    ].filter(
      (file, index, self) =>
        self.findIndex((f) => f.name === file.name) === index, // 重複を削除
    );
    const dt = new DataTransfer();
    newFileArray.forEach((file) => dt.items.add(file));
    screenshotInputRef.current.files = dt.files; // input内のFileListを更新
    setScreenshotInputFiles(dt.files); // Reactのstateを更新
    setValue("screenshots", dt.files);
  };

  const handleScreenshotDelete = (index: number) => {
    if (!screenshotInputRef.current?.files) return;
    const dt = new DataTransfer();
    screenshotFileArray.forEach((file, i) => i !== index && dt.items.add(file));
    screenshotInputRef.current.files = dt.files; // input内のFileListを更新
    setScreenshotInputFiles(dt.files); // Reactのstateを更新
    setValue("screenshots", dt.files);
  };

  return (
    <Create isLoading={formLoading} saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: "flex", flexDirection: "column" }}
        autoComplete="off"
      >
        <Stack direction={"row"} alignItems={"center"}>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  // value={getFieldState('manualInputId')}
                  checked={isManualInputId}
                  onChange={(e) => setValue("manualInputId", e.target.checked)}
                />
              }
              label="案件IDを手入力する"
            />
          </FormGroup>
        </Stack>
        <Box py={1}>
          {isManualInputId && (
            <>
              <Typography>案件ID*</Typography>
              <TextField
                {...register("key")}
                error={!!(errors as any)?.key}
                helperText={(errors as any)?.key?.message}
                margin="normal"
                fullWidth
                InputLabelProps={{ shrink: true }}
                type="text"
                name="key"
              />
            </>
          )}
        </Box>

        <Box py={1}>
          <Typography>案件名*</Typography>
          <TextField
            {...register("title", {
              required: "This field is required",
            })}
            error={!!(errors as any)?.title}
            helperText={(errors as any)?.title?.message}
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            type="text"
            name="title"
          />
        </Box>

        <Box py={1}>
          <Typography>入札方式*</Typography>
          <TextField
            {...register("procedureType", {
              required: "This field is required",
            })}
            error={!!(errors as any)?.procedureType}
            helperText={(errors as any)?.procedureType?.message}
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            type="text"
            name="procedureType"
          />
          <Box>
            {[
              "一般競争入札",
              "指名競争入札",
              "企画競争入札",
              "随意契約",
              "見積もり合わせ",
              "資料招請",
              "意見招請",
              "その他",
            ].map((type: string, idx: number) => {
              return (
                <TagField
                  key={idx}
                  sx={{
                    px: ".25em",
                    mx: ".5em",
                    mt: "1.25em",
                    mb: ".25em",
                    fontSize: "1.125em",
                  }}
                  value={type}
                  onClick={() => {
                    setValue("procedureType", type);
                  }}
                />
              );
            })}
          </Box>
        </Box>

        <Box py={1}>
          <Typography>案件URL*</Typography>
          <TextField
            {...register("externalDocumentUri", {
              required: "This field is required",
            })}
            error={!!(errors as any)?.externalDocumentUri}
            helperText={(errors as any)?.externalDocumentUri?.message}
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            type="text"
            name="externalDocumentUri"
          />
        </Box>

        <Box py={1}>
          <Typography>都道府県*</Typography>
          <Controller
            name="prefectures"
            control={control}
            rules={{ required: "At least one option must be selected" }}
            render={({ field }) => (
              <>
                <Select
                  {...field}
                  labelId="multi-select-label"
                  multiple
                  fullWidth
                  renderValue={() => (
                    <Box>
                      {getValues("prefectures").map(
                        (prefecture: string, idx: number) => {
                          return (
                            <TagField
                              key={idx}
                              sx={{
                                px: ".25em",
                                mx: ".5em",
                                fontSize: "1.125em",
                              }}
                              value={prefecture}
                              onDelete={() => {
                                setValue(
                                  "prefectures",
                                  getValues("prefectures").filter(
                                    (pref: string) => pref != prefecture,
                                  ),
                                );
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                              }}
                            />
                          );
                        },
                      )}
                    </Box>
                  )}
                >
                  {prefectureList.map((prefecture, idx) => (
                    <MenuItem key={idx} value={prefecture}>
                      <Checkbox checked={field.value?.includes(prefecture)} />
                      <ListItemText primary={prefecture} />
                    </MenuItem>
                  ))}
                </Select>
              </>
            )}
          />
        </Box>

        <Box py={1}>
          <Typography>発注機関名</Typography>
          <TextField
            {...register("organizationName")}
            error={!!(errors as any)?.organizationName}
            helperText={(errors as any)?.organizationName?.message}
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            type="text"
            name="organizationName"
          />
        </Box>

        <Box py={1}>
          <Typography>公告日</Typography>
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            dateFormats={{ year: "YYYY年" }}
          >
            <DatePicker
              format="YYYY/MM/DD"
              onChange={(e) => {
                setValue("publicationDate", e?.format("YYYY-MM-DD"));
              }}
              sx={{ my: 1, width: "100%" }}
              slotProps={{ calendarHeader: { format: "YYYY年MM月" } }}
            />
          </LocalizationProvider>
        </Box>

        <Box py={1}>
          <Typography>応募書類提出期日</Typography>
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            dateFormats={{ year: "YYYY年" }}
          >
            <DatePicker
              format="YYYY/MM/DD"
              onChange={(e) =>
                setValue(
                  "applicationDocumentDeadlineDate",
                  e?.format("YYYY-MM-DD"),
                )
              }
              sx={{ my: 1, width: "100%" }}
              slotProps={{ calendarHeader: { format: "YYYY年MM月" } }}
            />
          </LocalizationProvider>
        </Box>

        <Box py={1}>
          <Typography>提案書提出期日</Typography>
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            dateFormats={{ year: "YYYY年" }}
          >
            <DatePicker
              format="YYYY/MM/DD"
              onChange={(e) =>
                setValue(
                  "proposalDocumentDeadlineDate",
                  e?.format("YYYY-MM-DD"),
                )
              }
              sx={{ my: 1, width: "100%" }}
              slotProps={{ calendarHeader: { format: "YYYY年MM月" } }}
            />
          </LocalizationProvider>
        </Box>

        <Box py={1}>
          <Typography>入札日</Typography>
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            dateFormats={{ year: "YYYY年" }}
          >
            <DatePicker
              label="入札日"
              format="YYYY/MM/DD"
              onChange={(e) =>
                setValue("biddingDeadlineDate", e?.format("YYYY-MM-DD"))
              }
              sx={{ my: 1, width: "100%" }}
              slotProps={{ calendarHeader: { format: "YYYY年MM月" } }}
            />
          </LocalizationProvider>
        </Box>

        <Box py={1}>
          <Typography>予定価格</Typography>
          <TextField
            {...register("plannedPrice")}
            error={!!(errors as any)?.plannedPrice}
            helperText={(errors as any)?.plannedPrice?.message}
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            type="number"
            name="plannedPrice"
          />
        </Box>

        <Box py={1}>
          <Typography>参加資格等級</Typography>
          <Controller
            name="participateQualificationGrades"
            control={control}
            render={({ field }) => {
              const options = [
                ...qualificationOptions,
                ...(field.value || [])
                  .filter((v: any) => !qualificationOptions.some(o => o.id === v.id))
                  .sort((a: any, b: any) => a.qualificationId.localeCompare(b.qualificationId)),
              ];
              return (
                <Autocomplete
                  multiple
                  value={field.value || []}
                  inputValue={qualificationFilter}
                  options={options}
                  disableCloseOnSelect
                  getOptionLabel={(option) => `${option.qualificationName}: ${option.name}`}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  groupBy={(option) => `${option.qualificationId}: ${option.qualificationName}`}
                  onChange={(event, newValue) => {
                    field.onChange(newValue.map((v) => v));
                    setValue("participateQualificationGradeIds", newValue.map((v) => v.id));
                  }}
                  onInputChange={(event, newValue, reason) => {
                    if (reason === "input") {
                      setQualificationFilter(newValue)
                    }
                  }}
                  renderOption={(props, option, { selected }) => {
                    const { key, ...optionProps } = props;
                    return (
                      <li key={key} {...optionProps}>
                        <Checkbox
                          style={{ marginRight: 8 }}
                          checked={selected}
                        />
                        {`${option.qualificationName}: ${option.name}`}
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      margin="normal"
                      fullWidth
                      placeholder="参加資格等級を検索"
                    />
                  )}
                />
              );
            }}
          />
        </Box>

        <Box py={1}>
          <Typography>添付資料</Typography>
          <Box>
            <input
              type="file"
              multiple
              onChange={handleAttachmentChange}
              ref={atatchmentInputRef}
            />
            <div className="w-fit space-y-3">
              {attachmentFileArray.map((file, index) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between gap-2"
                >
                  <div>{file.name}</div>
                  <button onClick={() => handleAttachmentDelete(index)}>
                    削除
                  </button>
                </div>
              ))}
            </div>
          </Box>
        </Box>

        <Box py={1}>
          <Typography>スクリーンショット</Typography>
          <Box>
            <input
              type="file"
              multiple
              onChange={handleScreenshotChange}
              ref={screenshotInputRef}
            />
            <div className="w-fit space-y-3">
              {screenshotFileArray.map((file, index) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between gap-2"
                >
                  <div>{file.name}</div>
                  <button onClick={() => handleScreenshotDelete(index)}>
                    削除
                  </button>
                </div>
              ))}
            </div>
          </Box>
        </Box>

        {/* <Box py={1}>
          <Typography>案件詳細</Typography>
          <TextField
            {...register('description')}
            error={!!(errors as any)?.description}
            helperText={(errors as any)?.description?.message}
            margin='normal'
            fullWidth
            InputLabelProps={{ shrink: true }}
            minRows={5}
            multiline
            type='text'
            name='description'
          />
        </Box> */}
      </Box>
    </Create>
  );
};
