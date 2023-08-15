export enum OIDCResponseType {
  Code = "code", // authorization code
  JWT = "jwt", // implicit flow
}

export const OIDCResponseTypeMapping = {
  code: OIDCResponseType.Code,
  id_token: OIDCResponseType.JWT,
  token: OIDCResponseType.JWT,
};

export interface IAuthorizeRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  nonce: string;
  scope?: string;
  state?: string;
}

export enum ValidationMessage {
  Required = "This attribute is required",
}

export enum FlowType {
  AuthorizationCode,
  Implicit,
  Hybrid,
}
