import { DataProvider } from "@refinedev/core";
import dataProvider, { axiosInstance, stringify } from "@refinedev/simple-rest";
import { AxiosInstance } from "axios";
import { User } from "../models/user";

const createUserFormData = (user: {
  name: string;
  email: string;
  password?: string;
  companyId: string;
}): FormData => {
  // create form data
  const form = new FormData();
  form.append("name", user.name ?? "");
  form.append("email", user.email ?? "");
  if (user.password) {
    form.append("password", user.password);
  }
  form.append("companyId", user.companyId ?? "");
  return form;
};

export const usersDataProvider = (
  apiUrl: string,
  httpClient: AxiosInstance = axiosInstance,
): DataProvider => {
  const simpleRestDataProvider = dataProvider(apiUrl);
  const customRestDataProvider: DataProvider = {
    ...simpleRestDataProvider,
    getList: async ({ pagination, filters }) => {
      const url = `${apiUrl}/v1/admin/users/search`;

      try {
        // pagination
        const query: {
          page?: number;
          name?: string;
          email?: string;
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
                case "email":
                  query.email = filter.value.toString();
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
        return { data: data.users, total: data.meta.pagination.count };
      } catch (e: any) {
        alert(`${e?.message ?? "不明なエラー"}[${e?.statusCode}]`);
        return { data: null, total: 0 };
      }
    },

    getOne: async ({ id }) => {
      try {
        const userRes = await httpClient.get(`${apiUrl}/v1/admin/users/${id}`);
        if (userRes.status !== 200) {
          alert(`${userRes.statusText}[${userRes.status}]`);
          return { data: null };
        }

        const companiesRes = await httpClient.get(
          `${apiUrl}/v1/admin/companies?${stringify({ all: true })}`,
        );
        if (companiesRes.status !== 200) {
          alert(`${companiesRes.statusText}[${companiesRes.status}]`);
          return { data: null };
        }

        const user = userRes.data;
        const companies = companiesRes.data.companies;
        const data = {
          ...user,
          companies: companies,
        };
        return { data: data };
      } catch (e: any) {
        alert(`${e?.message ?? "不明なエラー"}[${e?.statusCode}]`);
        return { data: null };
      }
    },

    update: async ({ id, variables }) => {
      const user = variables as User;
      const form = createUserFormData(user);

      try {
        const res = await httpClient.patch(
          `${apiUrl}/v1/admin/users/${id}`,
          form,
          {
            headers: {
              "x-labid-admin-key": import.meta.env.VITE_ADMIN_API_KEY,
            },
          },
        );

        const status = res.status;
        if (status !== 200) {
          alert(`${res.statusText}[${res.status}]`);
        }
        const data = res.data;
        return { data: data };
      } catch (e: any) {
        alert(`${e?.message ?? "不明なエラー"}[${e?.statusCode}]`);
        return { data: null };
      }
    },

    create: async ({ variables }) => {
      const user = variables as User;
      const form = createUserFormData(user);

      try {
        const res = await httpClient.post(
          `${apiUrl}/v1/admin/users`,
          form,
          {
            headers: {
              "x-labid-admin-key": import.meta.env.VITE_ADMIN_API_KEY,
            },
          },
        );

        const status = res.status;
        if (status !== 201) {
          // エラーレスポンスの場合は例外を投げる
          const errorMessage = res.data?.errors?.join(', ') || res.statusText || 'ユーザー作成に失敗しました';
          throw new Error(errorMessage);
        }
        return { data: res.data };
      } catch (e: any) {
        // エラーメッセージを表示するが、例外を再投げしてRefineにエラーを伝える
        const errorMessage = e?.response?.data?.errors?.join(', ') || e?.message || '不明なエラー';
        alert(errorMessage);
        throw e; // 例外を再投げしてRefineにエラーを伝える
      }
    },

    deleteOne: async ({ id }) => {
      const deleteUrl = `${apiUrl}/v1/admin/users/${id}`;

      try {
        const { data } = await httpClient.delete(deleteUrl, {
          headers: {
            "x-labid-admin-key": import.meta.env.VITE_ADMIN_API_KEY,
          },
        });

        return { data: data };
      } catch (e: any) {
        alert(`${e?.message ?? "不明なエラー"}[${e?.statusCode}]`);
        return { data: null };
      }
    }

  };
  return customRestDataProvider;
};
