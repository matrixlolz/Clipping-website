"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type NavLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & {
  to?: string;
  href?: string;
  activeClassName?: string;
  pendingClassName?: string;
};

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, activeClassName, to, href, children, ...props }, ref) => {
    const pathname = usePathname();
    const destination = to || href || "/";
    const isActive = pathname === destination || pathname.startsWith(destination + "/");

    return (
      <Link
        ref={ref}
        href={destination}
        className={cn(className, isActive && activeClassName)}
        {...props}
      >
        {children}
      </Link>
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
