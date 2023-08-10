export enum OIDCResponseType {
  Code = "code", // authorization code
  JWT = "jwt", // implicit flow
}

export const OIDCResponseTypeMapping = {
  code: OIDCResponseType.Code,
  id_token: OIDCResponseType.JWT,
  token: OIDCResponseType.JWT,
};

export enum OIDCResponseMode {
  Query = "query",
  Fragment = "fragment",
  FormPost = "form_post",
}

export interface IAuthorizeRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  response_mode?: OIDCResponseMode;
  nonce: string;
  scope?: string;
  state?: string;
}
