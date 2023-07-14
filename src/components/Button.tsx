import clsx from "clsx";
import Link from "next/link";
import { LinkProps } from "next/link";
import { ButtonHTMLAttributes } from "react";

interface IButton extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
}

export const Button = ({
  icon,
  children,
  className,
  ...restOfProps
}: IButton): JSX.Element => {
  return (
    <button
      {...restOfProps}
      className={clsx(
        "font-medium bg-gray-100 p-2 rounded-lg border text-sm border-gray-200",
        className
      )}
    >
      <span className="grid grid-flow-col gap-1 items-center">
        {icon}
        {children}
      </span>
    </button>
  );
};

type IButtonLink = LinkProps &
  ButtonHTMLAttributes<HTMLAnchorElement> & {
    icon?: React.ReactNode;
  };

export const ButtonLink = ({
  icon,
  children,
  className,
  ...restOfProps
}: IButtonLink): JSX.Element => {
  return (
    <Link {...restOfProps}>
      <button
        className={clsx(
          "font-medium bg-gray-100 p-2 rounded-lg border text-sm border-gray-200",
          className
        )}
      >
        <div className="grid grid-flow-col gap-1 items-center">
          {icon}
          {children}
        </div>
      </button>
    </Link>
  );
};
