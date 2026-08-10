import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

type LoginProps = {
  onLogin: () => void;
};

export const Login = ({ onLogin }: LoginProps) => {
  return (
    <Box
      alignItems="center"
      display="flex"
      flexDirection="column"
      gap={3}
      justifyContent="center"
      minHeight="100vh"
      padding={2}
      textAlign="center"
    >
      <Typography component="h1" variant="h4">
        Labid 管理画面
      </Typography>
      <Typography color="text.secondary" variant="body1">
        Auth0 アカウントでログインしてください。
      </Typography>
      <Button
        onClick={() => {
          onLogin();
        }}
        size="large"
        variant="contained"
      >
        Auth0でログイン
      </Button>
    </Box>
  );
};


