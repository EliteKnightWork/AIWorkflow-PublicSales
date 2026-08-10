import {
  Box,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { Create } from "@refinedev/mui";
import { useForm } from "@refinedev/react-hook-form";
import { Company } from "../../models/company";

export const CompanyCreate = () => {
  const {
    saveButtonProps,
    refineCore: { formLoading },
    register,
    control,
    formState: { errors }
  } = useForm<Company>({
    defaultValues: {
      name: "",
      features: [],
      isTrial: false,
    },
  });

  return (
    <Create isLoading={formLoading} saveButtonProps={saveButtonProps}>
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
          <Typography>契約タイプ</Typography>
          <Box>
            <RadioGroup row defaultValue={false} name="isTrial">
              {["本契約", "トライアル"].map((type: string, idx: number) => {
                return (
                  <FormControlLabel
                    key={idx}
                    value={type === "トライアル"}
                    label={type}
                    control={<Radio {...register("isTrial")} />}
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
          </Box>
        </Box>
      </Box>
    </Create>
  );
};
