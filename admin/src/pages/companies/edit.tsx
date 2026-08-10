import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  FormControlLabel,
  Typography,
  RadioGroup,
  Radio,
  Select,
  MenuItem,
} from "@mui/material";
import { Edit } from "@refinedev/mui";
import { useForm } from "@refinedev/react-hook-form";
import { Company, Feature } from "../../models/company";
import { Controller } from "react-hook-form";
import { axiosInstance } from "@refinedev/simple-rest";

export const CompanyEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { formLoading, query },
    register,
    control,
    formState: { errors },
  } = useForm<Company>({
    warnWhenUnsavedChanges: true,
    defaultValues: {
      name: "",
      features: [],
      isTrial: false,
    },
  });

  const [companyFeatures, setCompanyFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    // 組織一覧を取得
    const apiUrl = import.meta.env.VITE_API_URL;
    axiosInstance
      .get(`${apiUrl}/v1/admin/company_features`, {
      })
      .then((res) => setCompanyFeatures(res.data?.features || []))
      .catch((err) => console.error("Failed to fetch companies:", err));
  }, []);

  return (
    <Edit isLoading={formLoading} saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: "flex", flexDirection: "column" }}
        autoComplete="off"
      >
        <Box py={1}>
          <Typography>会社名*</Typography>
          <TextField
            {...register("name", {
              required: "This field is required",
            })}
            error={!!(errors as any)?.name}
            helperText={(errors as any)?.name?.message}
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            type="text"
            name="name"
          />
        </Box>

        <Box py={1}>
          <Typography>追加機能</Typography>
          <Controller
            name="features"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                multiple
                value={field.value.map((feature: Feature) => feature.key) || []}
                fullWidth
                onChange={(e) => {
                  const selectedKeys = e.target.value as string[];
                  const selectedFeatures = companyFeatures.filter((feature) =>
                    selectedKeys.includes(feature.key)
                  );
                  field.onChange(selectedFeatures);
                }}
                error={!!errors.features}
              >
                <MenuItem value="" disabled>
                  追加機能を選択してください
                </MenuItem>
                {companyFeatures.map((feature)=> (
                  <MenuItem
                    key={feature.id}
                    value={feature.key}
                    sx={{ px: ".25em", mx: ".5em", fontSize: "1.125em" }}
                  >
                    {feature.key}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
        </Box>

        <Box py={1}>
          <Typography>契約タイプ</Typography>
          <Box>
            <Controller
              name="isTrial"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  row
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  name="isTrial"
                >
                  {["本契約", "トライアル"].map((type: string, idx: number) => {
                    return (
                      <FormControlLabel
                        key={idx}
                        value={type === "トライアル"}
                        label={type}
                        control={<Radio />}
                        sx={{
                          px: ".25em",
                          mx: ".5em",
                          mt: "1.25em",
                          mb: ".25em",
                          fontSize: "1.125em",
                        }}
                      />
                    );
                  })}
                </RadioGroup>
              )}
            />
          </Box>
        </Box>
      </Box>
    </Edit>
  );
};
