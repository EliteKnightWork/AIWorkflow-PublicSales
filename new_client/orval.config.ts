import { defineConfig } from "orval";

export default defineConfig({
  backend: {
    input: "../openapi.yml",
    output: {
      mode: "tags",
      clean: true,
      target: "./src/api/generated/endpoints",
      schemas: "./src/api/generated/models",
      client: "react-query",
      httpClient: "fetch",
      tsconfig: "./tsconfig.json",
      baseUrl: "",
      override: {
        mutator: {
          path: "./src/api/custom-fetch-instance.ts",
          name: "customFetchInstance",
        },
        query: {
          useQuery: true,
          usePrefetch: true,
        },
        fetch: {
          includeHttpResponseReturnType: false,
        },
        formData: {
          path: "./src/api/custom-form-data.ts",
          name: "customFormData",
        }
      },
    },
  },
});
