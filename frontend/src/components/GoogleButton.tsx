import { useEffect, useRef } from "react";

interface GoogleButtonProps {
  onSuccess: (idToken: string) => void;
}

interface GsiCredentialResponse {
  credential?: string;
}

interface GoogleIdentityServices {
  accounts?: {
    id?: {
      initialize: (config: {
        client_id: string;
        callback: (response: GsiCredentialResponse) => void;
      }) => void;
      renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

export const GoogleButton = ({ onSuccess }: GoogleButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onSuccess);
  callbackRef.current = onSuccess;

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !containerRef.current) return;

    const renderButton = () => {
      if (!window.google?.accounts?.id || !containerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: GsiCredentialResponse) => {
          if (response.credential) {
            callbackRef.current(response.credential);
          }
        },
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: "continue_with",
        width: containerRef.current.offsetWidth || 400,
      });
    };

    const existing = document.getElementById("gsi-script");
    if (existing && window.google) {
      renderButton();
      return;
    }

    const script = document.createElement("script");
    script.id = "gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderButton;
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [clientId]);

  if (!clientId) return null;

  return (
    <div className="flex justify-center">
      <div ref={containerRef} className="w-full max-w-sm"></div>
    </div>
  );
};
