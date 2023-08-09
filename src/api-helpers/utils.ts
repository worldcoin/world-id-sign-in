import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { OIDCErrorCodes } from "./errors";

export const validateRequestSchema = async <T>({
  schema,
  req,
}: {
  schema: yup.Schema<any>;
  req: NextRequest;
}): Promise<
  | { isValid: true; parsedParams: T; errorResponse?: null }
  | { isValid: false; parsedParams?: null; errorResponse: NextResponse }
> => {
  let parsedParams: T;

  const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
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
          new URL(`/error?${errorParams.toString()}`, req.url)
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
        new URL(`/error?${errorParams.toString()}`, req.url)
      ),
    };
  }

  return { isValid: true, parsedParams };
};
