import React, { createContext, useContext, useState } from "react";
import { setToken as setApiToken } from "../api";

const ctx = createContext();
export const useUser = () => useContext(ctx);

export function UserProvider({ children }){
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  function saveToken(t){
    setToken(t);
    setApiToken(t);
  }

  return (
    <ctx.Provider value={{ user, setUser, token, setToken: saveToken }}>
      {children}
    </ctx.Provider>
  );
}
