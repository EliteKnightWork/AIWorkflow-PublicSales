import { DataProvider } from "@refinedev/core";
import dataProvider, { axiosInstance, stringify } from "@refinedev/simple-rest";
import { AxiosInstance } from "axios";

export const proposalsDataProvider = (
  apiUrl: string,
  httpClient: AxiosInstance = axiosInstance,
): DataProvider => {
  const simpleRestDataProvider = dataProvider(apiUrl);
  const customRestDataProvider: DataProvider = {
    ...simpleRestDataProvider,
    getList: async ({ pagination }) => {
      const url = `${apiUrl}/v1/admin/proposal_jobs`;

      const query: {
        page: number;
        completed: boolean;
      } = {
        page: pagination?.current ?? 1,
        completed: true,
      };
      const { data } = await httpClient.get(`${url}?${stringify(query)}`, {
        headers: {
          "x-labid-admin-key": import.meta.env.VITE_ADMIN_API_KEY,
        },
      });

      return {
        data: data.proposalJobs,
        total: data.meta.pagination.count,
      };
    },
  };
  return customRestDataProvider;
};