import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { List, useDataGrid } from "@refinedev/mui";
import React from "react";

export const HiddenProjectList = () => {
  const { dataGridProps } = useDataGrid({});

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: "uuid",
        headerName: "ID",
        type: "string",
        sortable: false,
      },
      {
        field: "title",
        flex: 1,
        headerName: "案件名",
        type: "string",
        sortable: false,
      },
      {
        field: "rawTitle",
        flex: 1,
        headerName: "案件名(加工前)",
        type: "string",
        sortable: false,
      },
      {
        field: "organizationName",
        flex: 1,
        headerName: "発注機関名",
        type: "string",
        sortable: false,
      },
      {
        field: "hiddenAt",
        flex: 1,
        headerName: "非表示日時",
        type: "string",
        sortable: false,
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
        getRowId={(row) => row.uuid}
      />
    </List>
  );
};
