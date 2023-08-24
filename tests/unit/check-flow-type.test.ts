import { checkFlowType } from "@/app/authorize/route";
import { OIDCFlowType } from "@/types";

describe("Check flow type", () => {
  test("Detects authorization code flow", () => {
    const validResponseTypes = ["code"];

    validResponseTypes.forEach((responseType) => {
      expect(checkFlowType(responseType)).toBe(OIDCFlowType.AuthorizationCode);
    });
  });

  test("Detects implicit flow", () => {
    const validResponseTypes = ["token id_token", "id_token token", "id_token"];
    validResponseTypes.forEach((responseType) => {
      expect(checkFlowType(responseType)).toBe(OIDCFlowType.Implicit);
    });
  });

  test("Detects hybrid flow", () => {
    const validResponseTypes = [
      "code id_token",
      "id_token code",
      "code token",
      "token code",
      "code id_token token",
      "code token id_token",
      "token code id_token",
      "token id_token code",
      "id_token code token",
      "id_token token code",
    ];

    validResponseTypes.forEach((responseType) => {
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
