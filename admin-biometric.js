const base64URLToBytes = (value) => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0));
const bytesToBase64URL = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export const parseCreationOptions = (options) => {
  options.challenge = base64URLToBytes(options.challenge);
  options.user.id = base64URLToBytes(options.user.id);
  options.excludeCredentials?.forEach((credential) => { credential.id = base64URLToBytes(credential.id); });
  return options;
};

export const parseRequestOptions = (options) => {
  options.challenge = base64URLToBytes(options.challenge);
  options.allowCredentials?.forEach((credential) => { credential.id = base64URLToBytes(credential.id); });
  return options;
};

export const serializeCredential = (credential) => {
  const result = {
    id: credential.id,
    rawId: bytesToBase64URL(credential.rawId),
    type: credential.type,
    response: {},
    clientExtensionResults: credential.getClientExtensionResults(),
  };
  if (typeof credential.getTransports === "function") result.transports = credential.getTransports();
  for (const [key, value] of Object.entries(credential.response)) {
    if (value instanceof ArrayBuffer) result.response[key] = bytesToBase64URL(value);
  }
  if (credential.response.attestationObject) result.response.attestationObject = bytesToBase64URL(credential.response.attestationObject);
  if (credential.response.clientDataJSON) result.response.clientDataJSON = bytesToBase64URL(credential.response.clientDataJSON);
  return result;
};

export const serializeAssertion = (credential) => {
  const result = serializeCredential(credential);
  if (credential.response.authenticatorData) result.response.authenticatorData = bytesToBase64URL(credential.response.authenticatorData);
  if (credential.response.signature) result.response.signature = bytesToBase64URL(credential.response.signature);
  if (credential.response.userHandle) result.response.userHandle = bytesToBase64URL(credential.response.userHandle);
  return result;
};
