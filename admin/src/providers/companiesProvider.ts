import { DataProvider } from "@refinedev/core";
import dataProvider, { axiosInstance, stringify } from "@refinedev/simple-rest";
import { AxiosInstance } from "axios";
import { Company, Feature } from "../models/company";

const createCompanyFormData = (company: {
  name: string;
  features: Feature[];
  isTrial?: boolean;
}): FormData => {
  // create form data
  const form = new FormData();
  form.append("name", company.name);
  company.features.forEach((feature) => {
    form.append("company_feature_keys[]", feature.key);
  });

  if (company.isTrial !== undefined) {
    form.append("is_trial", company.isTrial.toString());
  }
  return form;
};

export const companiesDataProvider = (
  apiUrl: string,
  httpClient: AxiosInstance = axiosInstance,
): DataProvider => {
  const simpleRestDataProvider = dataProvider(apiUrl);
  const customRestDataProvider: DataProvider = {
    ...simpleRestDataProvider,
    getList: async ({ resource, pagination, sorters, filters, meta }) => {
      const url = `${apiUrl}/v1/admin/companies`;

      try {
        // pagination
        const query: {
          page?: number;
          name?: string;
          per_page?: number;
        } = {
          page: pagination?.current ?? 1,
          per_page: pagination?.pageSize ?? 25,
        };

        // フィルタの適用
        if (filters) {
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
        const status = res.status;
        if (status !== 200) {
          alert(`${res.statusText}[${res.status}]`);
        }
        return { data: data.companies, total: data.meta.pagination.count };
      } catch (e: any) {
        alert(`${e?.message ?? "不明なエラー"}[${e?.statusCode}]`);
        return { data: null, total: 0 };
      }
    },

    getOne: async ({ id }) => {
      const { data } = await httpClient.get(
        `${apiUrl}/v1/admin/companies/${id}`,
      );

      return {
        data: data,
      };
    },

    create: async ({ variables }) => {
      const company = variables as Company;
      const form = createCompanyFormData(company);

      try {
        const res = await httpClient.post(
          `${apiUrl}/v1/admin/companies`,
          form,
          {
            headers: {
              "x-labid-admin-key": import.meta.env.VITE_ADMIN_API_KEY,
            },
          },
        );

        const status = res.status;
        if (status !== 201) {
          alert(`${res.statusText}[${res.status}]`);
        }
        return { data: res.data };
      } catch (e: any) {
        alert(`${e?.message ?? "不明なエラー"}[${e?.statusCode}]`);
        return { data: null };
      }
    },

    update: async ({ id, variables }) => {
      const company = variables as Company;
      const form = createCompanyFormData(company);

      try {
        const { data } = await httpClient.put(
          `${apiUrl}/v1/admin/companies/${id}`,
          form,
        );

        return { data: data };
      } catch (e: any) {
        alert(`${e?.message ?? "不明なエラー"}[${e?.statusCode}]`);
        return { data: null };
      }
    },

    deleteOne: async ({ id }) => {
      const deleteUrl = `${apiUrl}/v1/admin/companies/${id}`;

      try {
        const { data } = await httpClient.delete(deleteUrl, {
          headers: {
            "x-labid-admin-key": import.meta.env.VITE_ADMIN_API_KEY,
          },
        });

        return { data: data };
      } catch (e: any) {
        if (e.response?.data?.has_users) {
          alert("会社に紐づくユーザーが存在するため、削除できません。");
          return { data: null };
        } else {
          alert(`${e?.message ?? "不明なエラー"}[${e?.statusCode}]`);
          return { data: null };
        }
      }
    },
  };
  return customRestDataProvider;
};
