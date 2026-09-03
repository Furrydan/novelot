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

type RegisterFormProps = {
    onSuccess: () => void;
};

function RegisterForm({ onSuccess }: RegisterFormProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const { register, isLoading } = useAuth();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        try {
            await register(email, password);
            setEmail("");
            setPassword("");
            setConfirmPassword("");
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordInput
                label="Confirm Password"
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <SubmitButton disabled={isLoading}>
                {isLoading ? "Creating account..." : "Register"}
            </SubmitButton>
        </AuthForm>
    );
}

export default RegisterForm;
