import { Head, useForm } from "@inertiajs/react";
import PasswordInput from "@/Components/UI/PasswordInput";
import Logo from "@/Components/UI/Logo";

export default function ChangePassword({ role, current_name }) {
  const isLeader = role === "leader";

  const { data, setData, post, processing, errors } = useForm({
    name: current_name ?? "",
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  function handleSubmit(e) {
    e.preventDefault();
    post("/change-password");
  }

  const inputStyle = (hasError) => ({
    width: "100%",
    padding: "0.625rem 0.75rem",
    background: "var(--background)",
    border: `1px solid ${hasError ? "var(--destructive)" : "var(--border)"}`,
    borderRadius: "var(--radius-md)",
    color: "var(--foreground)",
    fontSize: "0.9375rem",
    outline: "none",
    boxSizing: "border-box",
  });

  return (
    <>
      <Head title="Set New Password" />

      <div
        style={{
          minHeight: "100vh",
          background: "var(--background)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <Logo height={80} style={{ marginBottom: "1.5rem" }} />

        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
          }}
        >
          <h1
            style={{
              color: "var(--foreground)",
              fontSize: "1.125rem",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: "0.5rem",
            }}
          >
            Set Your Password
          </h1>
          <p
            style={{
              color: "var(--muted-foreground)",
              fontSize: "0.875rem",
              textAlign: "center",
              marginBottom: "1.75rem",
            }}
          >
            {isLeader
              ? "Enter your real name and set a personal password before continuing."
              : "You must set a personal password before continuing."}
          </p>

          <form onSubmit={handleSubmit}>
            {/* Name — leaders only */}
            {isLeader && (
              <div style={{ marginBottom: "1rem" }}>
                <label
                  htmlFor="name"
                  style={{
                    display: "block",
                    color: "var(--foreground)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    marginBottom: "0.375rem",
                  }}
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                  placeholder="Your full name"
                  autoFocus
                  style={inputStyle(!!errors.name)}
                />
                {errors.name && (
                  <p
                    style={{
                      color: "var(--destructive)",
                      fontSize: "0.8125rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    {errors.name}
                  </p>
                )}
              </div>
            )}

            {/* Current password */}
            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="current_password"
                style={{
                  display: "block",
                  color: "var(--foreground)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  marginBottom: "0.375rem",
                }}
              >
                Current Password
              </label>
              <PasswordInput
                id="current_password"
                value={data.current_password}
                onChange={(e) => setData("current_password", e.target.value)}
                placeholder="Enter your current password"
                hasError={!!errors.current_password}
              />
              {errors.current_password && (
                <p
                  style={{
                    color: "var(--destructive)",
                    fontSize: "0.8125rem",
                    marginTop: "0.25rem",
                  }}
                >
                  {errors.current_password}
                </p>
              )}
            </div>

            {/* New password */}
            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  color: "var(--foreground)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  marginBottom: "0.375rem",
                }}
              >
                New Password
              </label>
              <PasswordInput
                id="password"
                value={data.password}
                onChange={(e) => setData("password", e.target.value)}
                placeholder="At least 8 characters"
                hasError={!!errors.password}
                autoFocus={!isLeader}
              />
              {errors.password && (
                <p
                  style={{
                    color: "var(--destructive)",
                    fontSize: "0.8125rem",
                    marginTop: "0.25rem",
                  }}
                >
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="password_confirmation"
                style={{
                  display: "block",
                  color: "var(--foreground)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  marginBottom: "0.375rem",
                }}
              >
                Confirm Password
              </label>
              <PasswordInput
                id="password_confirmation"
                value={data.password_confirmation}
                onChange={(e) =>
                  setData("password_confirmation", e.target.value)
                }
                placeholder="Re-enter your password"
                hasError={!!errors.password_confirmation}
              />
              {errors.password_confirmation && (
                <p
                  style={{
                    color: "var(--destructive)",
                    fontSize: "0.8125rem",
                    marginTop: "0.25rem",
                  }}
                >
                  {errors.password_confirmation}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={processing}
              style={{
                width: "100%",
                padding: "0.6875rem",
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontSize: "0.9375rem",
                fontWeight: 600,
                cursor: processing ? "not-allowed" : "pointer",
                opacity: processing ? 0.7 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {processing ? "Saving…" : "Save & Continue"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
