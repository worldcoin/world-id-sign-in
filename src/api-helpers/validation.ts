import "server-only";
import { OIDCResponseMode, OIDCResponseType } from "@/types";
import * as yup from "yup";

export const OIDCResponseModeValidation = yup
  .string<OIDCResponseMode>()
  .ensure() // cast null and undefined to "", for next step
  .transform((value) => (value === "" ? undefined : value)) // transform "" to undefined, so default applies
  .when("response_type", {
    is: OIDCResponseType.Code,
    // REFERENCE: https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html
    then: (schema) => schema.default(OIDCResponseMode.Query),
    otherwise: (schema) => schema.default(OIDCResponseMode.Fragment),
  })
  .test({
    name: "is-valid-response-mode",
    message: "Invalid response mode.",
    test: (value, context) => {
      if (!value) {
        return true;
      }

      if (!(Object.values(OIDCResponseMode) as string[]).includes(value)) {
        return false;
      }

      const rawResponseType = context.parent.response_type as string;

      //  REFERENCE: https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#Combinations
      //  REFERENCE: https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#id_token
      //  To prevent access token leakage we also prevent `query` mode when requesting only an access token (OAuth 2.0 flow)
      if (value === OIDCResponseMode.Query) {
        if (
          rawResponseType.includes(OIDCResponseType.IdToken) ||
          rawResponseType.includes(OIDCResponseType.Token)
        ) {
          throw context.createError({
            path: "response_mode",
            message: `Invalid response mode: ${value}. For response type ${rawResponseType}, query is not supported for security reasons.`,
          });
        }
      }

      return true;
    },
  }) as yup.StringSchema<OIDCResponseMode, yup.AnyObject, undefined, "">;
