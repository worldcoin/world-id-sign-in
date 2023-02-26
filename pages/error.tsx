import { Button } from "@/components/Button";
import { Footer } from "@/components/Footer";
import { IconDanger, IconReload } from "@/components/icons";

export default function Error(): JSX.Element {
  return (
    <div className="flex justify-center items-center h-full">
      <div>
        <div className="bg-white py-8 px-12 rounded-xl text-center max-w-sm">
          <div className="flex justify-center">
            <div className="bg-danger-light rounded-full w-[72px] h-[72px] flex justify-center items-center">
              <IconDanger className="text-danger mt-1" />
            </div>
          </div>

          <h1 className="font-medium text-xl mt-6">Something went wrong</h1>
          <div className="text-text-muted text-sm mt-2">
            There was a problem verifying your request, please try again.
          </div>
          <div className="mt-6">
            <Button icon={<IconReload />}>Try again</Button>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
