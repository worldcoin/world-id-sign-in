export enum OIDCResponseType {
  Code = "code",
  IdToken = "id_token",
  Token = "token",
}

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
  nonce?: string;
  scope?: string;
  state?: string;
}

export enum ValidationMessage {
  Required = "This attribute is required",
}

export enum OIDCFlowType {
  AuthorizationCode = "authorization_code",
  Implicit = "implicit",
  Hybrid = "hybrid",
  Token = "token",
}

export enum OIDCScope {
  OpenID = "openid",
  Profile = "profile",
  Email = "email",
}
