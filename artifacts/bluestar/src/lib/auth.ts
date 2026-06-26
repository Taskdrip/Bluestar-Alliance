import { setAuthTokenGetter } from "@workspace/api-client-react";

export function initAuth() {
  setAuthTokenGetter(() => {
    return localStorage.getItem("bluestar_token");
  });
}
