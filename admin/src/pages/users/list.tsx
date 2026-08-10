import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { EditButton, List, CreateButton } from "@refinedev/mui";
import React, { useState } from "react";
import { type CrudFilters, useList } from "@refinedev/core";
import { Box, Button, InputAdornment, Stack, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CustomDeleteButton from "./delete";

export const UsersList = () => {
  const [nameKeyword, setNameKeyword] = useState("");
  const [emailKeyword, setEmailKeyword] = useState("");
  const [filters, setFilters] = useState<CrudFilters>([]);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });

  const { data, isLoading } = useList({
    resource: "users",
    filters: filters,
    pagination: {
      current: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
    },
    meta: {
      dataProviderName: "users",
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

    if (emailKeyword.trim()) {
      newFilters.push({
        field: "email",
        operator: "contains",
        value: emailKeyword.trim(),
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
        headerName: "ユーザー名",
        type: "string",
        sortable: false,
      },
      {
        field: "email",
        flex: 1,
        headerName: "メールアドレス",
        type: "string",
        sortable: false,
      },
      {
        field: "companyId",
        flex: 1,
        headerName: "会社ID",
        type: "string",
        sortable: false,
        valueGetter: (params) => params.row.company?.id || "",
      },
      {
        field: "companyName",
        flex: 1,
        headerName: "会社名",
        type: "string",
        sortable: false,
        valueGetter: (params) => params.row.company?.name || "",
      },
      {
        field: "actionsDelete",
        headerName: "削除",
        renderCell: ({ row }) => (
          <CustomDeleteButton
            resource="users"
            recordItemId={row.id}
            name={row.name}
            companyName={row.company?.name}
          />
        ),
      },
      {
        field: "actionsEdit",
        headerName: "編集",
        renderCell: ({ row }) => (
          <EditButton hideText resource="users" recordItemId={row.id} />
        ),
      },
    ],
    [],
  );

  return (
    <List>
      <Box mb={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <CreateButton resource="users" />
        </Stack>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="ユーザー名"
              placeholder="ユーザー名で検索"
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
            <TextField
              label="メールアドレス"
              placeholder="メールアドレスで検索"
              variant="outlined"
              value={emailKeyword}
              onChange={(e) => setEmailKeyword(e.target.value)}
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
