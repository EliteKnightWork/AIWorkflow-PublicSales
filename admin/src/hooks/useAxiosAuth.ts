import { useEffect, useRef, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { axiosInstance } from "@refinedev/simple-rest";
import { AxiosHeaders } from "axios";

export const useAxiosAuth = (): boolean => {
  const { getAccessTokenSilently, isAuthenticated, loginWithRedirect } =
    useAuth0();
  const interceptorRef = useRef<number | null>(null);
  const reauthInProgressRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!isAuthenticated) {
      setIsReady(false);
      if (interceptorRef.current !== null) {
        axiosInstance.interceptors.request.eject(interceptorRef.current);
        interceptorRef.current = null;
      }
      return () => {
        isMounted = false;
      };
    }

    const reauthenticate = async () => {
      if (reauthInProgressRef.current) {
        return;
      }

      reauthInProgressRef.current = true;

      try {
        await loginWithRedirect();
      } catch (redirectError) {
        console.error("Failed to re-authenticate user", redirectError);
      } finally {
        reauthInProgressRef.current = false;
      }
    };

    setIsReady(false);

    if (interceptorRef.current !== null) {
      axiosInstance.interceptors.request.eject(interceptorRef.current);
    }

    interceptorRef.current = axiosInstance.interceptors.request.use(
      async (config) => {
        try {
          const token = await getAccessTokenSilently();

          if (!token) {
            throw new Error("Access token is empty");
          }

          if (config.headers instanceof AxiosHeaders) {
            config.headers.set("Authorization", `Bearer ${token}`);
          } else {
            const headers = AxiosHeaders.from(config.headers ?? {});
            headers.set("Authorization", `Bearer ${token}`);
            config.headers = headers;
          }
        } catch (error) {
          console.error("Failed to retrieve access token", error);
          if (isMounted) {
            setIsReady(false);
          }
          await reauthenticate();
          return Promise.reject(error);
        }

        return config;
      },
      (error) => Promise.reject(error),
    );

    void (async () => {
      try {
        const token = await getAccessTokenSilently();

        if (!token) {
          throw new Error("Access token is empty");
        }

        if (isMounted) {
          setIsReady(true);
        }
      } catch (error) {
        console.error("Failed to retrieve access token", error);
        await reauthenticate();
        if (isMounted) {
          setIsReady(false);
        }
      }
    })();

    return () => {
      isMounted = false;
      if (interceptorRef.current !== null) {
        axiosInstance.interceptors.request.eject(interceptorRef.current);
        interceptorRef.current = null;
      }
      setIsReady(false);
    };
  }, [getAccessTokenSilently, isAuthenticated, loginWithRedirect]);

  return isReady;
};
