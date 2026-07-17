import * as React from "react";
import { type VariantProps } from "class-variance-authority";
declare const buttonVariants: (props?: ({
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined;
    size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg" | null | undefined;
} & import("class-variance-authority/dist/types").ClassProp) | undefined) => string;
interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}
declare function Button({ className, variant, size, asChild, ...props }: ButtonProps): React.JSX.Element;
export { Button, buttonVariants, type ButtonProps };
//# sourceMappingURL=button.d.ts.map