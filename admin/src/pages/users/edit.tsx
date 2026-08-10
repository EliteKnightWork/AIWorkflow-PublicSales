import { Box, MenuItem, Select, TextField, Typography } from "@mui/material";
import { Edit } from "@refinedev/mui";
import { useForm } from "@refinedev/react-hook-form";
import { Controller } from "react-hook-form";
import { Company } from "../../models/company";
import { useEffect, useState } from "react";

export const UsersEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { formLoading, query },
    register,
    control,
    formState: { errors },
  } = useForm({
    warnWhenUnsavedChanges: true,
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const postData = query?.data?.data;

  useEffect(() => {
    if (!postData) {
      return;
    }

    if (postData.companies) {
      setCompanies(postData.companies);
    }
  }, [postData]);

  return (
    <Edit isLoading={formLoading} saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: "flex", flexDirection: "column" }}
        autoComplete="off"
      >
        <Box py={1}>
          <Typography>ユーザーID</Typography>
          <TextField
            {...register("id")}
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            type="number"
            name="id"
            disabled
          />
        </Box>

        <Box py={1}>
          <Typography>ユーザー名</Typography>
          <TextField
            {...register("name")}
            error={!!errors.name}
            helperText={errors.name?.message as string}
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            type="text"
            name="name"
          />
        </Box>

        <Box py={1}>
          <Typography>メールアドレス*</Typography>
          <TextField
            {...register("email", {
              required: "This field is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "形式が正しくありません",
              },
            })}
            error={!!errors.email}
            helperText={errors.email?.message as string}
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            type="email"
            name="email"
          />
        </Box>

        <Box py={1}>
          <Typography>会社</Typography>
          <Controller
            name="companyId"
            control={control}
            defaultValue={postData?.company?.id || ""}
            render={({ field }) => (
              <Select
                {...field}
                value={field.value || ""}
                fullWidth
                displayEmpty
              >
                <MenuItem
                  value=""
                  sx={{ px: ".25em", mx: ".5em", fontSize: "1.125em" }}
                >
                  未選択
                </MenuItem>
                {companies.map((company, idx) => (
                  <MenuItem
                    key={idx}
                    value={company.id}
                    sx={{ px: ".25em", mx: ".5em", fontSize: "1.125em" }}
                  >
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
        </Box>
      </Box>
    </Edit>
  );
};
