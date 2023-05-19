"use client";

import { useEffect } from "react";
import { posthog } from "posthog-js";
import { usePostHog } from "@/hooks/usePostHog";

const PostHog = () => {
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
            if (currentUrl.searchParams.get("nonce")) {
              currentUrl.searchParams.set("nonce", "redacted");
            }
            if (currentUrl.searchParams.get("state")) {
              currentUrl.searchParams.set("state", "redacted");
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

export default PostHog;
