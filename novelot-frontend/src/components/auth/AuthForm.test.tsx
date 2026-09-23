import { useState, type SubmitEvent } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthForm, EmailInput, FormError, PasswordInput, SubmitButton } from "./AuthForm";

type TestFormProps = {
    onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
};

function TestForm({ onSubmit }: TestFormProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    return (
        <AuthForm onSubmit={onSubmit}>
            <EmailInput value={email} onChange={(event) => setEmail(event.target.value)} />
            <PasswordInput value={password} onChange={(event) => setPassword(event.target.value)} />
            <SubmitButton>Submit</SubmitButton>
        </AuthForm>
    );
}

describe("AuthForm", () => {
    afterEach(cleanup);

    it.each([
        { caseName: "an empty email", email: "", password: "password123" },
        { caseName: "an invalid email", email: "invalid-email", password: "password123" },
        { caseName: "an empty password", email: "reader@example.com", password: "" },
    ])("does not submit with $caseName", async ({ email, password }) => {
        const onSubmit = vi.fn((event: SubmitEvent<HTMLFormElement>) => event.preventDefault());
        const user = userEvent.setup();
        render(<TestForm onSubmit={onSubmit} />);

        if (email) await user.type(screen.getByRole("textbox", { name: "Email" }), email);
        if (password) await user.type(screen.getByLabelText("Password"), password);
        await user.click(screen.getByRole("button", { name: "Submit" }));

        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("submits when required fields contain a valid email and password", async () => {
        const onSubmit = vi.fn((event: SubmitEvent<HTMLFormElement>) => event.preventDefault());
        const user = userEvent.setup();
        render(<TestForm onSubmit={onSubmit} />);

        await user.type(screen.getByRole("textbox", { name: "Email" }), "reader@example.com");
        await user.type(screen.getByLabelText("Password"), "password123");
        await user.click(screen.getByRole("button", { name: "Submit" }));

        expect(onSubmit).toHaveBeenCalledOnce();
    });

    it("toggles password visibility without submitting", async () => {
        const onSubmit = vi.fn((event: SubmitEvent<HTMLFormElement>) => event.preventDefault());
        const user = userEvent.setup();
        render(<TestForm onSubmit={onSubmit} />);

        const password = screen.getByLabelText("Password");
        const toggle = within(screen.getByText("Password").closest("label")!).getByRole("button");
        await user.type(password, "password123");

        expect(password).toHaveAttribute("type", "password");
        await user.click(toggle);
        expect(password).toHaveAttribute("type", "text");
        expect(password).toHaveValue("password123");
        await user.click(toggle);
        expect(password).toHaveAttribute("type", "password");
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("shows an error only when a message is provided", () => {
        const { rerender } = render(<FormError message="Invalid credentials" />);

        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
        rerender(<FormError message={null} />);
        expect(screen.queryByText("Invalid credentials")).not.toBeInTheDocument();
    });
});
