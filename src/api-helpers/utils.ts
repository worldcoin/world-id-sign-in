import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { OIDCErrorCodes } from "./errors";

type BodySource = "query" | "body" | "formData";

export const validateRequestSchema = async <T extends yup.Schema>({
  schema,
  req,
  bodySource = "body",
}: {
  schema: T;
  req: NextRequest;
  bodySource?: BodySource;
}): Promise<
  | { isValid: true; parsedParams: yup.InferType<T>; errorResponse?: null }
  | { isValid: false; parsedParams?: null; errorResponse: NextResponse }
> => {
  let parsedParams: yup.InferType<typeof schema>;
  let rawParams: Record<string, string> = {};

  try {
    if (bodySource === "query") {
      rawParams = Object.fromEntries(req.nextUrl.searchParams);
    } else if (bodySource === "body") {
      rawParams = req.body
        ? JSON.parse(await new Response(req.body).text())
        : undefined;
    } else if (bodySource === "formData") {
      const formData = await req.formData();
      const formDataEntries = Array.from(formData.entries());
      for (const [key, value] of formDataEntries) {
        rawParams[key] = value as string;
      }
    }

    parsedParams = await schema.validate(rawParams);
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errorParams = new URLSearchParams({
        ...rawParams,
        code: OIDCErrorCodes.InvalidRequest,
        detail: error.message ?? "",
      });

      if (error.path) {
        errorParams.append("attribute", error.path);
      }

      return {
        isValid: false,
        errorResponse: NextResponse.redirect(
          new URL(`/error?${errorParams.toString()}`, req.url),
          { status: 302 }
        ),
      };
    }

    console.error("Unhandled yup validation error.", { error, req });

    const errorParams = new URLSearchParams({
      ...rawParams,
      code: OIDCErrorCodes.ServerError,
      detail: "Something went wrong. Please try again or contact support.",
    });
    return {
      isValid: false,
      errorResponse: NextResponse.redirect(
        new URL(`/error?${errorParams.toString()}`, req.url),
        { status: 302 }
      ),
    };
  }

  return { isValid: true, parsedParams };
};
