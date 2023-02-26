import { IconLock } from "./icons";

export const Footer = () => {
  return (
    <div className="w-full flex mt-4 text-gray-400 text-sm">
      <div className="grid grid-flow-col gap-1 items-center">
        <IconLock /> Secured by World ID
      </div>
      <div className="flex-grow text-right">
        <a
          href="https://worldcoin.org/privacy-statement"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy
        </a>
      </div>
    </div>
  );
};
