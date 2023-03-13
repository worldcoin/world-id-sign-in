import clsx from "clsx";

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
