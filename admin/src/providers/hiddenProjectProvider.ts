import { DataProvider } from "@refinedev/core";
import dataProvider, { axiosInstance, stringify } from "@refinedev/simple-rest";
import { AxiosInstance } from "axios";

export const hiddenProjectDataProvider = (
  apiUrl: string,
  httpClient: AxiosInstance = axiosInstance,
): DataProvider => {
  const simpleRestDataProvider = dataProvider(apiUrl);
  const customRestDataProvider: DataProvider = {
    ...simpleRestDataProvider,
    getList: async ({ resource, pagination, sorters, filters, meta }) => {
      const url = `${apiUrl}/v1/admin/hidden_projects`;

      // pagination
      const query: {
        page: number;
      } = {
        page: pagination?.current ?? 1,
      };
      const { data } = await httpClient.get(`${url}?${stringify(query)}`, {
        headers: {
          "x-labid-admin-key": import.meta.env.VITE_ADMIN_API_KEY,
        },
      });

      return {
        data: data.hiddenProjects,
        total: data.meta.pagination.count,
      };
    },
  };
  return customRestDataProvider;
};
