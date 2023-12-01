"use client";

import { useEffect } from "react";
import { posthog } from "posthog-js";
import { usePostHog } from "@/hooks/usePostHog";

const allowedSearchParameters = [
  "code",
  "detail",
  "error_description",
  "client_id",
  "response_type",
  "response_mode",
  "scope",
];

export const PostHog = () => {
  usePostHog();

  useEffect(() => {
    // cspell: disable-next-line
    posthog.init("phc_QttqgDbMQDYHX1EMH7FnT6ECBVzdp0kGUq92aQaVQ6I", {
      autocapture: true,
      disable_session_recording: true,
      persistence: "localStorage",
      cross_subdomain_cookie: false,
      sanitize_properties: (props) => {
        if (props?.$current_url) {
          try {
            const currentUrl = new URL(props.$current_url);
            for (const param of Object.keys(currentUrl.searchParams)) {
              if (!allowedSearchParameters.includes(param)) {
                currentUrl.searchParams.set(param, "redacted");
              }
            }
            props.$current_url = currentUrl.toString();
          } catch {}
        }
        return props;
      },
    });
  }, []);

  return null;
};
