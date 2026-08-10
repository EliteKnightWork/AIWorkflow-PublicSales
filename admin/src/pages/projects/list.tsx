import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { EditButton, List } from "@refinedev/mui";
import React, { useMemo, useState } from "react";
import {
  Button,
  Box,
  Stack,
  FormControlLabel,
  Checkbox,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CustomDeleteButton from "./delete";
import { CrudFilters, CrudSort, useList } from "@refinedev/core";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";
import * as dayjs from "dayjs";
import "dayjs/locale/ja";

const dateTypes = [
  { value: "publicationDate", label: "公告日" },
  { value: "applicationDocumentDeadlineDate", label: "応募書類提出期日" },
  { value: "proposalDocumentDeadlineDate", label: "提案書提出期日" },
  { value: "biddingDeadlineDate", label: "入札日" },
];

dayjs.locale("ja");

export const ProjectList = () => {
  const cellStyle = useMemo(
    () => ({
      overflow: "hidden",
      overflowX: "auto",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      maxWidth: 400,
      padding: "8px",
      borderRadius: "4px",
    }),
    [],
  );

  const [selectedDateType, setSelectedDateType] = useState(dateTypes[0].value);
  const [publicationDateEmpty, setPublicationDateEmpty] = useState(false);
  const [
    applicationDocumentDeadlineDateEmpty,
    setApplicationDocumentDeadlineDateEmpty,
  ] = useState(false);
  const [
    proposalDocumentDeadlineDateEmpty,
    setProposalDocumentDeadlineDateEmpty,
  ] = useState(false);
  const [biddingDeadlineDateEmpty, setBiddingDeadlineDate] = useState(false);
  const [andKeywords, setAndKeywords] = useState("");
  const [orKeywords, setOrKeywords] = useState("");
  const [notKeywords, setNotKeywords] = useState("");
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);

  const [filters, setFilters] = useState<CrudFilters>([]);
  const [sorter, setSorters] = useState<CrudSort>({
    field: "publicationDate",
    order: "desc",
  });
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 100,
  });

  const { data, isLoading } = useList({
    resource: "project",
    filters: filters,
    sorters: [sorter],
    pagination: {
      current: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
    },
    meta: {
      dataProviderName: "project",
    },
  });

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    switch (name) {
      case "publicationDateEmpty":
        setPublicationDateEmpty(checked);
        break;
      case "applicationDocumentDeadlineDateEmpty":
        setApplicationDocumentDeadlineDateEmpty(checked);
        break;
      case "proposalDocumentDeadlineDateEmpty":
        setProposalDocumentDeadlineDateEmpty(checked);
        break;
      case "biddingDeadlineDateEmpty":
        setBiddingDeadlineDate(checked);
        break;
      default:
        break;
    }
  };

  const handleSearch = () => {
    const newFilters: CrudFilters = [];

    if (andKeywords.trim()) {
      const keywords = andKeywords.trim().split(/\s+/);
      keywords.forEach((keyword) => {
        newFilters.push({
          field: "keywords",
          operator: "contains",
          value: keyword,
        });
      });
    }

    if (orKeywords.trim()) {
      newFilters.push({
        operator: "contains",
        field: "or_keywords",
        value: orKeywords.trim(),
      });
    }

    if (notKeywords.trim()) {
      newFilters.push({
        operator: "contains",
        field: "not_keywords",
        value: notKeywords.trim(),
      });
    }

    if (publicationDateEmpty) {
      newFilters.push({
        field: "publicationDate",
        operator: "eq",
        value: null,
      });
    }

    if (applicationDocumentDeadlineDateEmpty) {
      newFilters.push({
        field: "applicationDocumentDeadlineDate",
        operator: "eq",
        value: null,
      });
    }

    if (proposalDocumentDeadlineDateEmpty) {
      newFilters.push({
        field: "proposalDocumentDeadlineDate",
        operator: "eq",
        value: null,
      });
    }

    if (biddingDeadlineDateEmpty) {
      newFilters.push({
        field: "biddingDeadlineDate",
        operator: "eq",
        value: null,
      });
    }

    if (dateFrom) {
      newFilters.push({
        field: selectedDateType,
        operator: "gte",
        value: dateFrom.format("YYYY-MM-DD"),
      });
    }

    if (dateTo) {
      newFilters.push({
        field: selectedDateType,
        operator: "lte",
        value: dateTo.format("YYYY-MM-DD"),
      });
    }

    setFilters(newFilters);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      handleSearch();
    }
  };

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: "uuid",
        headerName: "ID",
        type: "string",
        sortable: false,
        filterable: false,
      },
      {
        field: "title",
        flex: 1,
        headerName: "案件名",
        type: "string",
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Tooltip title={params.value} placement="top-start">
            <Box sx={cellStyle}>{params.value}</Box>
          </Tooltip>
        ),
      },
      {
        field: "publicationDate",
        flex: 1,
        headerName: "公告日",
        type: "string",
        sortable: true,
        sortComparator: (v1, v2) => {
          if (v1 === null && v2 === null) return 0;
          if (v1 === null) return 1;
          if (v2 === null) return -1;
          return v1.localeCompare(v2);
        },
        filterable: false,
      },
      {
        field: "applicationDocumentDeadlineDate",
        flex: 1,
        headerName: "応募書類提出期日",
        type: "string",
        sortable: true,
        sortComparator: (v1, v2) => {
          if (v1 === null && v2 === null) return 0;
          if (v1 === null) return 1;
          if (v2 === null) return -1;
          return v1.localeCompare(v2);
        },
        filterable: false,
      },
      {
        field: "proposalDocumentDeadlineDate",
        flex: 1,
        headerName: "提案書提出期日",
        type: "string",
        sortable: true,
        sortComparator: (v1, v2) => {
          if (v1 === null && v2 === null) return 0;
          if (v1 === null) return 1;
          if (v2 === null) return -1;
          return v1.localeCompare(v2);
        },
        filterable: false,
      },
      {
        field: "biddingDeadlineDate",
        flex: 1,
        headerName: "入札日",
        type: "string",
        sortable: true,
        sortComparator: (v1, v2) => {
          if (v1 === null && v2 === null) return 0;
          if (v1 === null) return 1;
          if (v2 === null) return -1;
          return v1.localeCompare(v2);
        },
        filterable: false,
      },
      {
        field: "organizationName",
        flex: 1,
        headerName: "発注機関名",
        type: "string",
        sortable: false,
        filterable: false,
      },
      {
        field: "actionsDelete",
        headerName: "削除",
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <CustomDeleteButton
            resource="project"
            recordItemId={row.uuid}
            title={row.title}
          />
        ),
        align: "center",
        headerAlign: "center",
        minWidth: 80,
      },
      {
        field: "actionsEdit",
        headerName: "編集",
        sortable: false,
        filterable: false,
        renderCell: function render({ row }) {
          return (
            <>
              {
                <EditButton
                  hideText
                  resource="project"
                  recordItemId={row.uuid}
                />
              }
              {/* <ShowButton hideText recordItemId={row.id} /> */}
              {/* <DeleteButton
                hideText
                recordItemId={row.id}
                onSuccess={(val) => console.log(val)}
              /> */}
            </>
          );
        },
        align: "center",
        headerAlign: "center",
        minWidth: 80,
      },
    ],
    [cellStyle],
  );

  const handleDateTypeChange = (event: any) => {
    setSelectedDateType(event.target.value);
  };

  return (
    <List>
      <Box mb={2}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="すべて含む"
              placeholder="(例：プロモーション SNS)"
              variant="outlined"
              value={andKeywords}
              onChange={(e) => setAndKeywords(e.target.value)}
              onKeyDown={handleKeyPress}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="いずれか含む"
              placeholder="(例：動画 SNS)"
              variant="outlined"
              value={orKeywords}
              onChange={(e) => setOrKeywords(e.target.value)}
              onKeyDown={handleKeyPress}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="含まない"
              placeholder="(例：印刷 ポスター)"
              variant="outlined"
              value={notKeywords}
              onChange={(e) => setNotKeywords(e.target.value)}
              onKeyDown={handleKeyPress}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="date-type-select-label">日付タイプ</InputLabel>
              <Select
                labelId="date-type-select-label"
                id="date-type-select"
                value={selectedDateType}
                label="日付タイプ"
                onChange={handleDateTypeChange}
              >
                {dateTypes.map((dateType) => (
                  <MenuItem key={dateType.value} value={dateType.value}>
                    {dateType.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="From"
                sx={{ minWidth: 200 }}
                value={dateFrom}
                format="YYYY/MM/DD"
                slotProps={{ calendarHeader: { format: "YYYY年MM月" } }}
                onChange={(value) => setDateFrom(value)}
              />
              <DatePicker
                label="To"
                sx={{ minWidth: 200 }}
                value={dateTo}
                format="YYYY/MM/DD"
                slotProps={{ calendarHeader: { format: "YYYY年MM月" } }}
                onChange={(value) => setDateTo(value)}
              />
            </LocalizationProvider>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel
              control={
                <Checkbox
                  checked={publicationDateEmpty}
                  onChange={handleCheckboxChange}
                  name="publicationDateEmpty"
                />
              }
              label="公告日 なし"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={applicationDocumentDeadlineDateEmpty}
                  onChange={handleCheckboxChange}
                  name="applicationDocumentDeadlineDateEmpty"
                />
              }
              label="応募書類提出期日 なし"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={proposalDocumentDeadlineDateEmpty}
                  onChange={handleCheckboxChange}
                  name="proposalDocumentDeadlineDateEmpty"
                />
              }
              label="提案書提出期日 なし"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={biddingDeadlineDateEmpty}
                  onChange={handleCheckboxChange}
                  name="biddingDeadlineDateEmpty"
                />
              }
              label="入札日 なし"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleSearch()}
            >
              検索
            </Button>
          </Stack>
        </Stack>
      </Box>
      <DataGrid
        rows={data?.data ?? []}
        columns={columns}
        loading={isLoading}
        autoHeight
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[100]}
        paginationMode="server"
        rowCount={data?.total ?? 0}
        getRowId={(row) => row.uuid}
        sortingMode="server"
        onSortModelChange={(sortModel) => {
          if (sortModel && sortModel[0]) {
            setSorters({
              field: sortModel[0].field,
              order: sortModel[0].sort ?? "desc",
            });
          }
        }}
      />
    </List>
  );
};
