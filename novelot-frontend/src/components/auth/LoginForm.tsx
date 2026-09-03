import { useState, type FormEvent } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import {
    AuthForm,
    EmailInput,
    FormError,
    PasswordInput,
    SubmitButton,
} from "./AuthForm";

type LoginFormProps = {
    onSuccess: () => void;
};

function LoginForm({ onSuccess }: LoginFormProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const { login, isLoading } = useAuth();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        try {
            await login(email, password);
            setEmail("");
            setPassword("");
            onSuccess();
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError("Something went wrong. Please try again.");
            }
        }
    };

    return (
        <AuthForm onSubmit={handleSubmit}>
            <FormError message={error} />
            <EmailInput
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <PasswordInput
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <SubmitButton disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
            </SubmitButton>
        </AuthForm>
    );
}

export default LoginForm;
