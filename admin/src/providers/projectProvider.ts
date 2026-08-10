/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { DataProvider } from "@refinedev/core";
import dataProvider, { axiosInstance, stringify } from "@refinedev/simple-rest";
import { AxiosInstance } from "axios";
import { Project } from "../models/project";

async function sha256(message: string) {
  // 文字列をUint8Arrayにエンコードする
  const encoder = new TextEncoder();
  const msgUint8 = encoder.encode(message);

  // エンコードされたメッセージのSHA-256ハッシュを計算する
  // ここでWeb Crypto APIを使用している
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);

  // SHA-256ハッシュの計算結果(hashBuffer)はArrayBufferなので、
  // それをUint8Arrayに変換し、16進数の文字列に変換する
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // SHA-256ハッシュの16進数の文字列を返す
  return hashHex;
}

const createProjectFormData = (project: Project, key?: string): FormData => {
  // create form data
  const form = new FormData();
  form.append("key", key ?? project.key);
  form.append("title", project.title);
  form.append("rawTitle", project.title);
  form.append("source", project.source);
  form.append("isExperienceRequired", project.isExperienceRequired ? "true" : "false");
  form.append("isOfficeRequired", project.isOfficeRequired ? "true" : "false");

  // セキュリティ要件の追加
  if (project.projectSecurityQualifications) {
    if (project.projectSecurityQualifications.length === 0) {
      form.append("projectSecurityQualifications", "");
    } else {
      Array.from(project.projectSecurityQualifications).map((qualification) => {
        form.append("projectSecurityQualifications[]", qualification);
      });
    }
  }

  Array.from(project.prefectures).map((a) => {
    form.append("prefectures[]", a);
  });
  form.append("description", project.description ?? "");
  if (project.externalDocumentUri) {
    form.append("externalDocumentUrl", project.externalDocumentUri);
  }
  if (project.organizationName) {
    form.append("organizationName", project.organizationName);
  }
  if (project.procedureType) {
    form.append("procedureType", project.procedureType);
  }
  if (project.biddingDeadlineDate !== undefined) {
    form.append(
      "biddingDeadlineDate",
      project.biddingDeadlineDate === null ? "" : project.biddingDeadlineDate,
    );
  }
  if (project.briefingSessionDate !== undefined) {
    form.append(
      "briefingSessionDate",
      project.briefingSessionDate === null ? "" : project.briefingSessionDate,
    );
  }
  if (project.applicationDocumentDeadlineDate !== undefined) {
    form.append(
      "applicationDocumentDeadlineDate",
      project.applicationDocumentDeadlineDate === null
        ? ""
        : project.applicationDocumentDeadlineDate,
    );
  }
  if (project.proposalDocumentDeadlineDate !== undefined) {
    form.append(
      "proposalDocumentDeadlineDate",
      project.proposalDocumentDeadlineDate === null
        ? ""
        : project.proposalDocumentDeadlineDate,
    );
  }
  if (project.publicationDate !== undefined) {
    form.append(
      "publicationDate",
      project.publicationDate === null ? "" : project.publicationDate,
    );
  }
  if (project.plannedPrice) {
    form.append("plannedPrice", project.plannedPrice.toString());
  }

  if (project.participateQualificationGradeIds !== undefined) {
    if (project.participateQualificationGradeIds.length === 0) {
      form.append("participateQualificationGradeIds", "");
    } else {
      Array.from(project.participateQualificationGradeIds).map((gradeId) => {
        form.append("participateQualificationGradeIds[]", gradeId);
      });
    }
  }

  if (project.attachments) {
    const attachments = Array.from(project.attachments);

    attachments.map((a) => {
      form.append("attachments[]", a);
    });
  }

  if (project.screenshots) {
    const screenshots = Array.from(project.screenshots);

    screenshots.map((a) => {
      form.append("screenshots[][file]", a);
      form.append(
        "screenshots[][source_url]",
        project.externalDocumentUri ?? "",
      );
    });
  }

  return form;
};

export const projectDataProvider = (
  apiUrl: string,
  httpClient: AxiosInstance = axiosInstance,
): DataProvider => {
  const simpleRestDataProvider = dataProvider(apiUrl);
  const customRestDataProvider: DataProvider = {
    ...simpleRestDataProvider,
    getList: async ({ resource, pagination, filters, sorters }) => {
      const url = `${apiUrl}/v1/admin/projects/search`;
      const query: Record<string, string> = {
        page: (pagination?.current ?? 1).toString(),
        per_page: (pagination?.pageSize ?? 100).toString(),
      };

      if (sorters && sorters.length > 0) {
        const sorter = sorters[0];
        if (sorter.field === "publicationDate") {
          query.sort_by = `publication_date_${sorter.order}`;
        }
        if (sorter.field === "applicationDocumentDeadlineDate") {
          query.sort_by = `application_document_deadline_date_${sorter.order}`;
        }
        if (sorter.field === "proposalDocumentDeadlineDate") {
          query.sort_by = `proposal_document_deadline_date_${sorter.order}`;
        }
        if (sorter.field === "biddingDeadlineDate") {
          query.sort_by = `bidding_deadline_date_${sorter.order}`;
        }
      }

      (filters || []).forEach((filter) => {
        if ("field" in filter) {
          switch (filter.field) {
            case "keywords":
              query["keywords[]"] = filter.value.toString();
              break;
            case "or_keywords":
              query["or_keywords[]"] = filter.value.toString();
              break;
            case "not_keywords":
              query["not_keywords[]"] = filter.value.toString();
              break;
            case "publicationDate":
              if (filter.operator === "eq" && filter.value === null) {
                query.publication_date_eq = "null";
              } else if (filter.operator === "gte") {
                query.publication_date_from = filter.value;
              } else if (filter.operator === "lte") {
                query.publication_date_to = filter.value;
              }
              break;
            case "applicationDocumentDeadlineDate":
              if (filter.operator === "eq" && filter.value === null) {
                query.application_document_deadline_date_eq = "null";
              } else if (filter.operator === "gte") {
                query.application_document_deadline_date_from = filter.value;
              } else if (filter.operator === "lte") {
                query.application_document_deadline_date_to = filter.value;
              }
              break;
            case "proposalDocumentDeadlineDate":
              if (filter.operator === "eq" && filter.value === null) {
                query.proposal_document_deadline_date_eq = "null";
              } else if (filter.operator === "gte") {
                query.proposal_document_deadline_date_from = filter.value;
              } else if (filter.operator === "lte") {
                query.proposal_document_deadline_date_to = filter.value;
              }
              break;
            case "biddingDeadlineDate":
              if (filter.operator === "eq" && filter.value === null) {
                query.bidding_deadline_date_eq = "null";
              } else if (filter.operator === "gte") {
                query.bidding_deadline_date_from = filter.value;
              } else if (filter.operator === "lte") {
                query.bidding_deadline_date_to = filter.value;
              }
              break;
          }
        }
      });

      const { data } = await httpClient.get(`${url}?${stringify(query)}`);
      return {
        data: data.projects,
        total: data.meta.pagination.count,
      };
    },
    getOne: async ({ resource, id }) => {
      const { data } = await httpClient.get(`${apiUrl}/v1/admin/projects/${id}/detail`);

      return { data: data };
    },
    create: async ({ resource, variables }) => {
      const project = variables as Project;

      let key = project.key;

      if (project.key.length === 0 || !project.manualInputId) {
        // keyの作成
        key = await sha256(
          project.prefectures.join(",") + project.title + project.source,
        );
        console.log(key);
      }

      const getProjectUrl = `${apiUrl}/v1/admin/projects/${key}?source=${project.source}`;

      try {
        const { status } = await httpClient.get(getProjectUrl, {
          headers: {
            "x-labid-admin-key": import.meta.env.VITE_ADMIN_API_KEY,
          },
        });

        if (status === 200) {
          alert("すでに登録済みの案件キーです");
          throw Error("すでに登録済みの案件キーです");
        }
      } catch {
        // create form data
        const form = createProjectFormData(project, key);

        const { data } = await httpClient.post(
          `${apiUrl}/v1/admin/projects`,
          form,
          {
            headers: {
              "x-labid-admin-key": import.meta.env.VITE_ADMIN_API_KEY,
            },
          },
        );
        return { data: data };
      }

      const { data } = await httpClient.post(`${apiUrl}/v1/admin/projects`, {
        key: key,
        title: project.title,
        description: project.description ?? "",
        organization_name: project.organizationName,
        attachments: [],
        screenshots: [],
        procedure_type: project.procedureType,
        source: project.source,
        publication_date: "",
        briefing_session_date: "",
        document_deadline_date: "",
        bidding_deadline_date: "",
        tender_opening_date: "",
        delivery_deadline_date: "",
        external_document_uri: "",
        prefectures: project.prefectures,
        participate_qualification_grade_ids: project.participateQualificationGradeIds,
      });
      return { data: data };
    },

    update: async ({ resource, id, variables }) => {
      const project = variables as Project;
      const form = createProjectFormData(project);

      const { data } = await httpClient.put(
        `${apiUrl}/v1/admin/projects/${id}`,
        form,
        {
          headers: {
            "x-labid-admin-key": import.meta.env.VITE_ADMIN_API_KEY,
          },
        },
      );
      return { data: data };
    },

    deleteOne: async ({ resource, id, meta }) => {
      const deleteUrl = `${apiUrl}/v1/admin/projects/${id}`;

      try {
        const { data } = await httpClient.delete(deleteUrl, {
          headers: {
            "x-labid-admin-key": import.meta.env.VITE_ADMIN_API_KEY,
          },
        });

        return { data };
      } catch (error) {
        console.error("Error deleting project:", error);
        throw error;
      }
    },
  };
  return customRestDataProvider;
};
