import type { ReactNode } from "react";

type ButtonProps = {
    children: ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary";
    className?: string;
};

function Button({
    children,
    onClick,
    variant = "primary",
    className = "",
}: ButtonProps) {
    return (
        <button className={`btn btn-${variant} ${className}`} onClick={onClick}>
            {children}
        </button>
    );
}

export default Button;
