import { OIDCResponseMode, OIDCResponseType } from "@/types";
import * as yup from "yup";

export const OIDCResponseModeValidation = yup
  .string<OIDCResponseMode>()
  .when("response_type", {
    is: OIDCResponseType.Code,
    // REFERENCE: https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html
    then: (schema) => schema.default(OIDCResponseMode.Query),
    otherwise: (schema) => schema.default(OIDCResponseMode.Fragment),
  })
  .test({
    name: "is-valid-response-mode",
    message: "Invalid response mode.",
    test: (value) => {
      if (!value) {
        return true;
      }

      if (!(Object.values(OIDCResponseMode) as string[]).includes(value)) {
        return false;
      }

      return true;
    },
  }) as yup.StringSchema<OIDCResponseMode, yup.AnyObject, undefined, "">;
