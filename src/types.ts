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
  nonce: string;
  scope?: string;
  state?: string;
}
