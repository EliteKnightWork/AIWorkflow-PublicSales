import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";

export const ConfigError = () => {
  return (
    <Box
      alignItems="center"
      display="flex"
      flexDirection="column"
      gap={2}
      justifyContent="center"
      minHeight="100vh"
      padding={2}
      textAlign="center"
    >
      <Alert severity="error">
        Auth0 の設定が不足しています。環境変数
        VITE_AUTH0_DOMAIN / VITE_AUTH0_CLIENT_ID / VITE_AUTH0_AUDIENCE
        を設定してください。
      </Alert>
    </Box>
  );
};

