import { AuthForm, SubmitButton } from "../auth/AuthForm";
import { useAuth } from "@/context/AuthContext";

function AccountDropdown() {
  const { logout, isLoading } = useAuth();
  return (
    <AuthForm onSubmit={logout}>
      <SubmitButton disabled={isLoading}>
        {isLoading ? "Logging Out..." : "Logout"}
      </SubmitButton>
    </AuthForm>
  );
}

export default AccountDropdown;
