import posthog from "posthog-js";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export const usePostHog = (): void => {
  const pathname = usePathname();

  useEffect(() => {
    posthog.capture("$pageview");
  }, [pathname]);
};
