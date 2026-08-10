import { Box, MenuItem, Select, TextField, Typography, InputAdornment, IconButton } from "@mui/material";
import { Create } from "@refinedev/mui";
import { useForm } from "@refinedev/react-hook-form";
import { Controller } from "react-hook-form";
import { Company } from "../../models/company";
import { useEffect, useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { axiosInstance } from "@refinedev/simple-rest";

export const UsersCreate: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { formLoading },
    register,
    control,
    formState: { errors },
  } = useForm({
    warnWhenUnsavedChanges: true,
    // onErrorは削除
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    // 組織一覧を取得
    const apiUrl = import.meta.env.VITE_API_URL;
    axiosInstance
      .get(`${apiUrl}/v1/admin/companies?all=true`, {
        headers: {
          "x-labid-admin-key": import.meta.env.VITE_ADMIN_API_KEY,
        },
      })
      .then((res) => setCompanies(res.data?.companies || []))
      .catch((err) => console.error("Failed to fetch companies:", err));
  }, []);

  // saveButtonPropsにonErrorを追加
  const customSaveButtonProps = {
    ...saveButtonProps,
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.errors?.join(", ") ||
        error?.message ||
        "ユーザー作成に失敗しました";
      setSubmitError(errorMessage);
    },
  };

  return (
    <Create
      isLoading={formLoading}
      saveButtonProps={customSaveButtonProps}
    >
      <Box
        component="form"
        sx={{ display: "flex", flexDirection: "column" }}
        autoComplete="off"
      >
        <Box py={1}>
          <Typography>ユーザー名*</Typography>
          <TextField
            {...register("name", {
              required: "ユーザー名は必須です",
            })}
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
              required: "メールアドレスは必須です",
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
          <Typography>パスワード*</Typography>
          <TextField
            {...register("password", {
              required: "パスワードは必須です",
              minLength: {
                value: 8,
                message: "パスワードは8文字以上で入力してください",
              },
            })}
            error={!!errors.password}
            helperText={errors.password?.message as string}
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            type={showPassword ? "text" : "password"}
            name="password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="パスワードの表示切り替え"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box py={1}>
          <Typography>組織*</Typography>
          <Controller
            name="companyId"
            control={control}
            rules={{ required: "組織は必須です" }}
            render={({ field }) => (
              <Select
                {...field}
                value={field.value || ""}
                fullWidth
                error={!!errors.companyId}
              >
                <MenuItem value="" disabled>
                  組織を選択してください
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
          {errors.companyId && (
            <Typography color="error" variant="caption">
              {errors.companyId.message as string}
            </Typography>
          )}
        </Box>

        {submitError && (
          <Box py={2}>
            <Typography variant="body2" color="error">
              エラー: {submitError}
            </Typography>
          </Box>
        )}

        <Box py={2}>
          <Typography variant="body2" color="text.secondary">
            ※ パスワードは8文字以上で入力してください。
          </Typography>
        </Box>
      </Box>
    </Create>
  );
};
