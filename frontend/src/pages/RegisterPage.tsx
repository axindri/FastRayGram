import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Button, Card, Form, Input, Spin, Typography } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

import { buildAuthLink, registerUser, validateRegistrationCode } from "../api";
import { HintTooltip } from "../components/HintTooltip";
import { ThemeFooterControls } from "../components/ThemeFooterControls";
import { useAuth } from "../auth";
import { getApiErrorMessage } from "../utils/apiError";
import { MARK_HINT, MARK_MAX_LENGTH, requiredMarkFormRules } from "../utils/mark";
import { USERNAME_HINT, USERNAME_MAX_LENGTH, usernameFormRules } from "../utils/username";

const { Title, Text } = Typography;

type RegisterForm = {
  username: string;
  mark: string;
};

export function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code")?.trim() || "";

  const [validating, setValidating] = useState(true);
  const [codeValid, setCodeValid] = useState(false);
  const [registrationExpiryDays, setRegistrationExpiryDays] = useState(3);
  const [validationError, setValidationError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/profile", { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    if (!code) {
      setValidating(false);
      setCodeValid(false);
      setValidationError("Недействительная ссылка для регистрации");
      return;
    }

    let cancelled = false;

    void (async () => {
      setValidating(true);
      setValidationError("");

      try {
        const result = await validateRegistrationCode(code);
        if (cancelled) {
          return;
        }

        setCodeValid(result.valid);
        setRegistrationExpiryDays(result.registration_expiry_days);
        if (!result.valid) {
          setValidationError("Код регистрации недействителен или истёк");
        }
      } catch (error) {
        if (!cancelled) {
          setCodeValid(false);
          setValidationError(getApiErrorMessage(error, "Не удалось проверить код регистрации"));
        }
      } finally {
        if (!cancelled) {
          setValidating(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  const onFinish = async (values: RegisterForm) => {
    if (!codeValid) {
      return;
    }

    setLoading(true);
    setSubmitError("");

    try {
      const token = await registerUser({
        code,
        username: values.username.trim(),
        mark: values.mark.trim(),
      });
      window.location.replace(buildAuthLink(token));
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Не удалось зарегистрироваться"));
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "64px 16px 24px",
        boxSizing: "border-box",
      }}
    >
      <Title level={3} style={{ textAlign: "center" }}>
        Регистрация
      </Title>

      <Card style={{ maxWidth: 440, width: "100%", margin: "0 auto" }}>
        {validating ? (
          <div style={{ display: "grid", placeItems: "center", minHeight: 120 }}>
            <Spin indicator={<LoadingOutlined spin />} />
          </div>
        ) : !codeValid ? (
          <Alert type="error" showIcon title="Регистрация недоступна" description={validationError} />
        ) : (
          <Form layout="vertical" onFinish={onFinish}>
            <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
              Заполните данные для создания аккаунта
            </Text>

            <Form.Item label="Username" name="username" extra={USERNAME_HINT} rules={usernameFormRules}>
              <Input placeholder="Alex" autoComplete="username" maxLength={USERNAME_MAX_LENGTH} />
            </Form.Item>

            <Form.Item
              label={
                <span>
                  Контакт для связи <HintTooltip title="Укажите Telegram или e-mail, по которому с вами можно связаться. Номер телефона указывать не нужно." />
                </span>
              }
              name="mark"
              extra={MARK_HINT}
              rules={requiredMarkFormRules}
            >
              <Input placeholder="@username или name@example.com" autoComplete="email" maxLength={MARK_MAX_LENGTH} />
            </Form.Item>

            <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
              {`После регистрации подписка будет активна ${registrationExpiryDays} дн.`}
            </Text>

            <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
              После входа ссылку для повторного входа можно скопировать в профиле.
            </Text>

            {submitError ? <Alert type="error" title={submitError} showIcon style={{ marginBottom: 16 }} /> : null}

            <Button type="primary" htmlType="submit" loading={loading} block>
              Зарегистрироваться
            </Button>
          </Form>
        )}
      </Card>

      <div style={{ marginTop: "auto", display: "flex", justifyContent: "center", paddingTop: 24 }}>
        <ThemeFooterControls />
      </div>
    </main>
  );
}
