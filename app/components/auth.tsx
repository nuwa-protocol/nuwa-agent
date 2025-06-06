import { useNavigate } from "react-router-dom";
import { Path } from "@/app/constant";
import { useAccessStore } from "@/app/store";
import Locale from "@/app/locales";
import BotIcon from "@/app/icons/bot.svg";
import { useEffect, useState } from "react";
import { getClientConfig } from "@/app/config/client";
import { parseDid } from "@/app/utils/did";

import styles from "./auth.module.scss";

export function AuthPage() {
  const navigate = useNavigate();
  const accessStore = useAccessStore();
  const [didError, setDidError] = useState("");

  const goHome = () => navigate(Path.Home);
  const goChat = () => navigate(Path.Chat);
  const resetAccessCode = () => {
    accessStore.update((access) => {
      access.openaiApiKey = "";
      access.accessCode = "";
      access.didCredential = "";
    });
  };

  const handleDidInput = (value: string) => {
    accessStore.update((access) => {
      access.didCredential = value;
    });

    // Validate DID format
    if (value) {
      const validation = parseDid(value);
      if (!validation.isValid) {
        setDidError(Locale.Auth.Did.InvalidFormat);
      } else {
        setDidError("");
      }
    } else {
      setDidError("");
    }
  };

  const switchAuthMethod = (method: "traditional" | "did") => {
    accessStore.update((access) => {
      access.authMethod = method;
    });
  };

  useEffect(() => {
    if (getClientConfig()?.isApp) {
      navigate(Path.Settings);
    }
  }, [navigate]);

  return (
    <div className={styles["auth-page"]}>
      {/* Logo */}
      <div className={`no-dark ${styles["auth-logo"]}`}>
        <BotIcon />
      </div>

      {/* Title */}
      <div className={styles["auth-title"]}>{Locale.Auth.Title}</div>

      {/* Auth Method Selector */}
      <div className={styles["auth-method-selector"]}>
        <div className={styles["auth-method-label"]}>
          {Locale.Auth.Did.AuthMethod}
        </div>
        <div className={styles["auth-method-buttons"]}>
          <button
            className={`${styles["auth-method-button"]} ${
              accessStore.authMethod === "did" ? styles["active"] : ""
            }`}
            onClick={() => switchAuthMethod("did")}
          >
            {Locale.Auth.Did.DidAuth}
          </button>
          <button
            className={`${styles["auth-method-button"]} ${
              accessStore.authMethod === "traditional" ? styles["active"] : ""
            }`}
            onClick={() => switchAuthMethod("traditional")}
          >
            {Locale.Auth.Did.Traditional}
          </button>
        </div>
      </div>

      {/* Traditional Authentication Form */}
      {accessStore.authMethod === "did" ? (
        /* DID Authentication Form */
        <div className={styles["auth-form"]}>
          <div className={styles["auth-tips"]}>{Locale.Auth.Did.Tips}</div>
          <input
            className={styles["auth-input"]}
            type="text"
            placeholder={Locale.Auth.Did.Input}
            value={accessStore.didCredential}
            onChange={(e) => handleDidInput(e.currentTarget.value)}
          />
          {didError && <div className={styles["auth-error"]}>{didError}</div>}
        </div>
      ) : (
        <div className={styles["auth-form"]}>
          <div className={styles["auth-tips"]}>{Locale.Auth.Tips}</div>
          <input
            className={styles["auth-input"]}
            type="password"
            placeholder={Locale.Auth.Input}
            value={accessStore.accessCode}
            onChange={(e) => {
              accessStore.update(
                (access) => (access.accessCode = e.currentTarget.value),
              );
            }}
          />
          {!accessStore.hideUserApiKey && (
            <>
              <div className={styles["auth-tips"]}>{Locale.Auth.SubTips}</div>
              <input
                className={styles["auth-input-second"]}
                type="password"
                placeholder={Locale.Settings.Access.OpenAI.ApiKey.Placeholder}
                value={accessStore.openaiApiKey}
                onChange={(e) => {
                  accessStore.update(
                    (access) => (access.openaiApiKey = e.currentTarget.value),
                  );
                }}
              />
              <input
                className={styles["auth-input-second"]}
                type="password"
                placeholder={Locale.Settings.Access.Google.ApiKey.Placeholder}
                value={accessStore.googleApiKey}
                onChange={(e) => {
                  accessStore.update(
                    (access) => (access.googleApiKey = e.currentTarget.value),
                  );
                }}
              />
            </>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles["auth-actions"]}>
        <button
          className={`${styles["auth-action-button"]} ${styles["auth-action-primary"]}`}
          onClick={goChat}
        >
          {Locale.Auth.Confirm}
        </button>
        <button
          className={styles["auth-action-button"]}
          onClick={() => {
            resetAccessCode();
            goHome();
          }}
        >
          {Locale.Auth.Later}
        </button>
      </div>
    </div>
  );
}
