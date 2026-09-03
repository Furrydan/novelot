import {
    useState,
    type ChangeEvent,
    type FormEvent,
    type ReactNode,
} from "react";
import { IoEye, IoEyeOff } from "react-icons/io5";
import "./AuthForm.css";

type AuthFormProps = {
    children: ReactNode;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function AuthForm({ children, onSubmit }: AuthFormProps) {
    return (
        <form className="auth-form" onSubmit={onSubmit}>
            {children}
        </form>
    );
}

type FormErrorProps = {
    message?: string | null;
};

export function FormError({ message }: FormErrorProps) {
    if (!message) return null;
    return <p className="auth-form__error">{message}</p>;
}

type EmailInputProps = {
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    label?: string;
    required?: boolean;
};

export function EmailInput({
    value,
    onChange,
    label = "Email",
    required = true,
}: EmailInputProps) {
    return (
        <label className="auth-form__label">
            {label}
            <input
                className="auth-form__input"
                type="email"
                value={value}
                onChange={onChange}
                required={required}
            />
        </label>
    );
}

type PasswordInputProps = {
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    label?: string;
    name?: string;
    autoComplete?: string;
    required?: boolean;
};

export function PasswordInput({
    value,
    onChange,
    label = "Password",
    name,
    autoComplete,
    required = true,
}: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <label className="auth-form__label">
            {label}
            <div className="auth-form__password-container">
                <input
                    className="auth-form__input"
                    type={showPassword ? "text" : "password"}
                    name={name}
                    autoComplete={autoComplete}
                    value={value}
                    onChange={onChange}
                    required={required}
                />
                <button
                    className="auth-form__password-container__button"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <IoEye /> : <IoEyeOff />}
                </button>
            </div>
        </label>
    );
}

type SubmitButtonProps = {
    children: ReactNode;
    disabled?: boolean;
};

export function SubmitButton({ children, disabled }: SubmitButtonProps) {
    return (
        <button
            className="auth-form__button"
            type="submit"
            disabled={disabled}>
            {children}
        </button>
    );
}
