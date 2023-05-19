import { IconLock } from "./icons";

const Footer = () => (
  <div className="w-full flex mt-4 text-gray-400 text-sm">
    <div className="grid grid-flow-col gap-1 items-center">
      <IconLock /> Secured by{" "}
      <a href="https://worldcoin.org/world-id" target="_blank" rel="noreferrer">
        World ID
      </a>
    </div>
    <div className="flex-grow text-right">
      <a
        target="_blank"
        rel="noopener noreferrer"
        className="cursor-pointer"
        href="https://worldcoin.org/privacy"
      >
        Privacy
      </a>
    </div>
  </div>
);

export default Footer;
