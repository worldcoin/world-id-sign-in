"use client";

import { useEffect } from "react";
import { datadogRum } from "@datadog/browser-rum";

const DataDog = () => {
  useEffect(() => {
    datadogRum.init({
      version: "1.0.0",
      sessionSampleRate: 100,
      env: process.env.NODE_ENV,
      service: "world-id-sign-in",
      defaultPrivacyLevel: "mask-user-input",
      site: process.env.NEXT_PUBLIC_DATADOG_SITE,
      clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN as string,
      applicationId: process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID as string,
    });
  }, []);

  return null;
};

export default DataDog;
