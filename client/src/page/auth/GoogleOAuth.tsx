import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader } from "lucide-react";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/store/store";
import { exchangeGoogleCodeMutationFn } from "@/lib/api";

const GoogleOAuth = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setAccessToken } = useStore();

  const code = params.get("code");
  const [isExchanging, setIsExchanging] = React.useState(Boolean(code));

  React.useEffect(() => {
    if (!code) return;

    // Codes are single-use, so React 18's double-invoked effect in development
    // would spend the code on the first run and fail on the second.
    let cancelled = false;

    exchangeGoogleCodeMutationFn(code)
      .then(({ access_token, current_workspace }) => {
        if (cancelled) return;
        setAccessToken(access_token);
        navigate(
          current_workspace ? `/workspace/${current_workspace}` : "/",
          { replace: true }
        );
      })
      .catch(() => {
        if (!cancelled) setIsExchanging(false);
      });

    return () => {
      cancelled = true;
    };
  }, [code, navigate, setAccessToken]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <Logo />
          TaskFlow.
        </Link>
        <div className="flex flex-col gap-6"></div>
      </div>
      <Card>
        <CardContent>
          {isExchanging ? (
            <div style={{ textAlign: "center", marginTop: "50px" }}>
              <Loader className="animate-spin mx-auto" />
              <p style={{ marginTop: "20px" }}>Signing you in…</p>
            </div>
          ) : (
            <div style={{ textAlign: "center", marginTop: "50px" }}>
              <h1>Authentication Failed</h1>
              <p>We couldn't sign you in with Google. Please try again.</p>

              <Button
                onClick={() => navigate("/")}
                style={{ marginTop: "20px" }}
              >
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleOAuth;
