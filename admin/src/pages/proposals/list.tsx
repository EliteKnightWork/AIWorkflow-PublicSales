import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { List, useDataGrid } from "@refinedev/mui";
import React from "react";
import { IconButton } from "@mui/material";
import { Download } from "@mui/icons-material";

export const ProposalsList = () => {
  const { dataGridProps } = useDataGrid({});

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: "title",
        flex: 6,
        headerName: "案件名",
        type: "string",
        sortable: false,
        valueGetter: ({ row }) => row.project?.title || "",
      },
      {
        field: "companyName",
        flex: 2,
        headerName: "企業名",
        type: "string",
        sortable: false,
        valueGetter: ({ row }) => row.company?.name || "",
      },
      {
        field: "userName",
        flex: 2,
        headerName: "ユーザー名",
        type: "string",
        sortable: false,
        valueGetter: ({ row }) => row.user?.name || row.user?.email || "",
      },
      {
        field: "createdAt",
        flex: 2,
        headerName: "作成日",
        type: "dateTime",
        sortable: false,
        valueGetter: ({ row }) => new Date(row.proposalDocument.createdAt),
      },
      {
        field: "download",
        flex: 1,
        headerName: "ダウンロード",
        sortable: false,
        renderCell: ({ row }) => {
          const url = row.proposalDocument?.url;
          return (
            <IconButton color="primary" disabled={!url} onClick={() => window.open(url, "_blank")}>
              <Download />
            </IconButton>
          );
        },
      },
    ],
    [],
  );

  return (
    <List>
      <DataGrid
        {...dataGridProps}
        columns={columns}
        autoHeight
        pageSizeOptions={[25]}
        getRowId={(row) => row.id}
      />
    </List>
  );
};