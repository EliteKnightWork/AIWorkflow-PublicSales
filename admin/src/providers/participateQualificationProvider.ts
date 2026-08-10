import { DataProvider } from "@refinedev/core";
import dataProvider, { axiosInstance, stringify } from "@refinedev/simple-rest";
import { AxiosInstance } from "axios";

export const participateQualificationProvider = (
  apiUrl: string,
  httpClient: AxiosInstance = axiosInstance,
): DataProvider => {
  const simpleRestDataProvider = dataProvider(apiUrl);
  const customRestDataProvider: DataProvider = {
    ...simpleRestDataProvider,
    getList: async ({ pagination, filters }) => {
      const url = `${apiUrl}/v1/admin/participate_qualifications`;

      const query: {
        page?: number;
        name?: string;
      } = {
        page: pagination?.current,
      };

      if (filters?.length) {
        for (const filter of filters) {
          if ("field" in filter) {
            switch (filter.field) {
              case "name":
                query.name = filter.value.toString();
                break;
            }
          }
        }
      }

      const res = await httpClient.get(`${url}?${stringify(query)}`, {
        headers: {
          "x-labid-admin-key": import.meta.env.VITE_ADMIN_API_KEY,
        },
      });

      const data = res.data;
      const qualifications = data?.participateQualifications;
      return { data: qualifications, total: qualifications.length };
    },
  };
  return customRestDataProvider;
};