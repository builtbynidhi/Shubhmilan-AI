import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 hover:scale-[1.02] focus-visible:ring-indigo-400",
        gold: "bg-amber-500 text-white shadow-lg shadow-amber-500/25 hover:bg-amber-400 hover:scale-[1.02] focus-visible:ring-amber-400",
        destructive:
          "bg-error text-white shadow-sm hover:bg-red-500 focus-visible:ring-error",
        outline:
          "border border-white/20 bg-transparent text-text-primary hover:bg-white/5 hover:border-white/40 focus-visible:ring-indigo-400",
        "gold-outline":
          "border-2 border-accent bg-transparent text-accent hover:bg-accent/10 hover:border-accent-glow focus-visible:ring-accent",
        secondary:
          "bg-white/10 text-text-primary hover:bg-white/15 focus-visible:ring-white/20",
        ghost:
          "text-text-primary hover:bg-white/10 focus-visible:ring-white/20",
        link: "text-indigo underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-13 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
