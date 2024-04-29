import "server-only";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { OIDCErrorCodes } from "./errors";
import { OIDCFlowType, OIDCResponseType } from "@/types";
import { internalRedirect } from "@/lib/utils";

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
  | {
      isValid: true;
      parsedParams: yup.InferType<T>;
      errorResponse?: null;
      error?: null;
    }
  | {
      isValid: false;
      parsedParams?: null;
      errorResponse: NextResponse;
      error: { code: string; detail: string; attr?: string };
    }
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

    console.log("pre yup validation response_type: ", rawParams.response_type);
    console.log("pre yup validation response_mode: ", rawParams.response_mode);

    parsedParams = await schema.validate(rawParams);

    console.log(
      "post yup validation response_type: ",
      parsedParams.response_type
    );
    console.log(
      "post yup validation response_mode: ",
      parsedParams.response_mode
    );
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const code = OIDCErrorCodes.InvalidRequest;
      const errorParams = new URLSearchParams({
        ...rawParams,
        code,
      });

      if (error.path) {
        errorParams.append("attribute", error.path);
      }

      if (error.message) {
        errorParams.append("detail", error.message);
      }

      return {
        isValid: false,
        errorResponse: internalRedirect(
          `/error?${errorParams.toString()}`,
          req.url
        ),
        error: { code, detail: error.message, attr: error.path || undefined },
      };
    }

    console.error("Unhandled yup validation error.", { error, req });

    const code = OIDCErrorCodes.ServerError;
    const detail = "Something went wrong. Please try again or contact support.";
    const errorParams = new URLSearchParams({
      ...rawParams,
      code,
      detail,
    });
    return {
      isValid: false,
      errorResponse: internalRedirect(
        `/error?${errorParams.toString()}`,
        req.url
      ),
      error: { code, detail },
    };
  }

  return { isValid: true, parsedParams };
};

export function checkFlowType(responseType: string) {
  const params = responseType.split(" ");

  const includesAll = (requiredParams: string[]): boolean => {
    return requiredParams.every((param) => params.includes(param));
  };

  // NOTE: List of valid response types for the hybrid flow
  // Source: https://openid.net/specs/openid-connect-core-1_0.html#HybridFlowAuth:~:text=this%20value%20is%20code%C2%A0id_token%2C%20code%C2%A0token%2C%20or%20code%C2%A0id_token%C2%A0token.
  if (
    includesAll([OIDCResponseType.Code, OIDCResponseType.IdToken]) ||
    includesAll([OIDCResponseType.Code, OIDCResponseType.Token]) ||
    includesAll([
      OIDCResponseType.Code,
      OIDCResponseType.IdToken,
      OIDCResponseType.Token,
    ])
  ) {
    return OIDCFlowType.Hybrid;
  }

  // NOTE: List of valid response types for the code flow
  // Source: https://openid.net/specs/openid-connect-core-1_0.html#CodeFlowAuth:~:text=Authorization%20Code%20Flow%2C-,this%20value%20is%20code.,-client_id
  if (includesAll([OIDCResponseType.Code])) {
    return OIDCFlowType.AuthorizationCode;
  }

  // NOTE: List of valid response types for the implicit flow
  // Source: https://openid.net/specs/openid-connect-core-1_0.html#ImplicitFlowAuth:~:text=this%20value%20is%20id_token%C2%A0token%20or%20id_token
  if (
    includesAll([OIDCResponseType.IdToken]) ||
    includesAll([OIDCResponseType.IdToken, OIDCResponseType.Token])
  ) {
    return OIDCFlowType.Implicit;
  }

  if (includesAll([OIDCResponseType.Token])) {
    return OIDCFlowType.Token;
  }

  return null;
}
