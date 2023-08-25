import { checkFlowType } from "@/api-helpers/utils";
import { OIDCFlowType } from "@/types";

import {
  AUTHORIZE_CODE_RESPONSE_TYPES,
  HYBRID_RESPONSE_TYPES,
  IMPLICIT_RESPONSE_TYPES,
} from "tests/__mocks__/authenticate.mock";

describe("Check flow type", () => {
  test("Detects authorization code flow", () => {
    AUTHORIZE_CODE_RESPONSE_TYPES.forEach((responseType) => {
      expect(checkFlowType(responseType)).toBe(OIDCFlowType.AuthorizationCode);
    });
  });

  test("Detects implicit flow", () => {
    IMPLICIT_RESPONSE_TYPES.forEach((responseType) => {
      expect(checkFlowType(responseType)).toBe(OIDCFlowType.Implicit);
    });
  });

  test("Detects hybrid flow", () => {
    HYBRID_RESPONSE_TYPES.forEach((responseType) => {
      expect(checkFlowType(responseType)).toBe(OIDCFlowType.Hybrid);
    });
  });

  test("Detects `token` flow", () => {
    const validResponseTypes = ["token"];

    validResponseTypes.forEach((responseType) => {
      expect(checkFlowType(responseType)).toBe(OIDCFlowType.Token);
    });
  });

  test("Detects invalid flow", () => {
    const invalidResponseTypes = ["value", "value1 value2"];

    invalidResponseTypes.forEach((responseType) => {
      expect(checkFlowType(responseType)).toBe(null);
    });
  });
});
