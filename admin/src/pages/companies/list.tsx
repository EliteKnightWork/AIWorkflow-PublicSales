import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { EditButton, List, CreateButton } from "@refinedev/mui";
import React, { useState } from "react";
import { type CrudFilters, useList } from "@refinedev/core";
import { Checkbox, Box, Stack, TextField, InputAdornment, Button } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CustomDeleteButton from "./delete";
import { Feature } from "../../models/company";

export const CompaniesList = () => {
  const [nameKeyword, setNameKeyword] = useState("");
  const [filters, setFilters] = useState<CrudFilters>([]);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });

  const { data, isLoading } = useList({
    resource: "companies",
    filters: filters,
    pagination: {
      current: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
    },
    meta: {
      dataProviderName: "companies",
    },
  });

  const handleSearch = () => {
    const newFilters: CrudFilters = [];

    if (nameKeyword.trim()) {
      newFilters.push({
        field: "name",
        operator: "contains",
        value: nameKeyword.trim(),
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
        field: "id",
        headerName: "ID",
        type: "string",
        sortable: false,
      },
      {
        field: "name",
        flex: 1,
        headerName: "企業名",
        type: "string",
        sortable: false,
      },
      {
        field: "features",
        flex: 1,
        headerName: "機能一覧",
        renderCell: ({ value }) => <div>{value.map((feature: Feature) => feature.key).join(", ")}</div>,
        sortable: false,
      },
      {
        field: "isTrial",
        flex: 1,
        headerName: "トライアル",
        type: "boolean",
        sortable: false,
        renderCell: ({ value }) => <Checkbox checked={value} disabled />,
      },
      {
        field: "actionsDelete",
        headerName: "削除",
        renderCell: ({ row }) => (
          <CustomDeleteButton
            resource="companies"
            recordItemId={row.id}
            name={row.name}
          />
        ),
      },
      {
        field: "actions",
        headerName: "編集",
        renderCell: ({ row }) => (
          <EditButton hideText resource="companies" recordItemId={row.id} />
        ),
      },
    ],
    [],
  );
  return (
    <List>
      <Box mb={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <CreateButton resource="companies" />
        </Stack>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="企業名"
              placeholder="企業名で検索"
              variant="outlined"
              value={nameKeyword}
              onChange={(e) => setNameKeyword(e.target.value)}
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
            <Button variant="contained" color="primary" onClick={handleSearch}>
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
        pageSizeOptions={[25]}
        paginationMode="server"
        rowCount={data?.total ?? 0}
        getRowId={(row) => row.id}
      />
    </List>
  );
};
