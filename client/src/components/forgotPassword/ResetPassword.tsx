import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import {
  useValidTmpTokenMutation,
  useResetPasswordMutation,
  // MeQuery,
  // MeDocument,
} from "../../generated/graphql";
import { Alert } from "../Alert";
import { Loading } from "../Loading";

interface ForgotPasswordProps {
  token: string;
}

export const ResetPassword: React.FC<ForgotPasswordProps> = ({ token }) => {
  const history = useHistory();
  const [loading, setLoading] = useState<boolean>(true);
  const [active, setActive] = useState<boolean>(false);
  const [validToken, setValidToken] = useState<boolean>(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);
  const [alertMessage, setAlertMessage] = useState<string>("");

  const [verifyToken] = useValidTmpTokenMutation();
  const [resetPassword] = useResetPasswordMutation();

  useEffect(() => {
    const isTokenValid = async () => {
      setLoading(true);
      const res = await verifyToken({ variables: { token } });

      if (res.data && res.data.validTmpToken) {
        setValidToken(true);
        return;
      }

      setValidToken(false);
    };

    isTokenValid();
    setLoading(false);
  }, [token, verifyToken]);

  const handleSubmit = async () => {
    if (!passwordRef.current || !confirmationRef.current) {
      return;
    }

    const password = passwordRef.current.value;
    const confirmation = confirmationRef.current.value;

    // check for empty fields
    if (!password.length || !confirmation.length) {
      setAlertMessage("Make sure all fields are filled out");
      setActive(true);
      return;
    }

    if (password !== confirmation) {
      setAlertMessage("Passwords don't match");
      setActive(true);
      let tmp = false;
      if (tmp) {
        history.push("/");
      }
      return;
    }

    // check for length
    if (password.length < 8) {
      setAlertMessage("Your password has to be at least 8 characters long");
      setActive(true);
      return;
    }

    try {
      const { data } = await resetPassword({
        variables: { token, confirmation: confirmation, newPassword: password },
      });
      if (data && data.resetPassword) {
        history.push("/login");
      }
    } catch (err) {
      history.push("/login");
    }
  };

  const alertProps = {
    active,
    setActive,
    text: alertMessage,
    type: "danger",
  };

  return !loading ? (
    <div className="email-confirmation">
      <Alert {...alertProps} />
      <div className="email-confirmation-card">
        <div>
          {validToken ? (
            <>
              <h2 style={{ width: "100%" }}>Reset Your Password</h2>
              <h4 style={{ width: "100%" }}>Keep it in mind this time!</h4>
              <input
                className="rounded-input emphasized margin-20"
                placeholder="New Password"
                ref={passwordRef}
              />
              <input
                className="rounded-input emphasized margin-20"
                placeholder="Confirm Your Password"
                ref={confirmationRef}
              />
              <br />
              <button
                className="rounded-btn emphasized"
                onClick={handleSubmit}
                style={{ margin: "40px" }}
              >
                Reset Your Password
              </button>
            </>
          ) : (
            <>
              <h2>Invalid Token</h2>
            </>
          )}
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  );
};