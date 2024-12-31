import { Agent } from "@atproto/api";
import {
  BrowserOAuthClient,
  OAuthSession,
} from "@atproto/oauth-client-browser";
import { PropsWithChildren, useEffect, useState } from "react";
import { AgentContext } from "./AgentContext";

const IS_DEV = process.env.NODE_ENV == "development";
const ORIGIN = IS_DEV ? "http://127.0.0.1:5173" : "TODO";

const SCOPE = "atproto transition:generic";
// const REDIRECT_URI = `${ORIGIN}/atproto-oauth-callback`;
const REDIRECT_URI = ORIGIN;

const enc = encodeURIComponent;

const oauthClient = new BrowserOAuthClient({
  handleResolver: "https://bsky.social",
  clientMetadata: {
    client_id: IS_DEV
      ? `http://localhost?redirect_uri=${enc(REDIRECT_URI)}&scope=${enc(SCOPE)}`
      : `${ORIGIN}/oauth/client-metadata.json`,
    redirect_uris: [REDIRECT_URI],
    scope: SCOPE,
    token_endpoint_auth_method: "none",
  },
});

async function getSession() {
  const result = await oauthClient.init();
  let session: OAuthSession | null = null;

  if (result) {
    if ("state" in result && result.state != null) {
      console.log(
        `${result.session.sub} was successfully authenticated (state: ${result.state})`,
      );
    } else {
      console.log(`${result.session.sub} was restored (last active session)`);
    }
    session = result.session;
  } else {
    try {
      await oauthClient.signIn("https://bsky.social");
    } catch (error) {
      console.error(error);
      console.log(
        'The user aborted the authorization process by navigating "back"',
      );
    }
  }

  return session as OAuthSession;
}

export function AgentProvider({ children }: PropsWithChildren) {
  const [agent, setAgent] = useState<Agent | null>(null);
  useEffect(() => {
    getSession().then((session) => setAgent(new Agent(session)));
  }, []);

  return (
    <AgentContext.Provider value={agent}>{children}</AgentContext.Provider>
  );
}
