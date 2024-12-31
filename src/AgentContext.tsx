import { Agent } from "@atproto/api";
import { createContext } from "react";

export const AgentContext = createContext<Agent | null>(null);
