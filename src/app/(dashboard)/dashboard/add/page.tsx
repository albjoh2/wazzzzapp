import { FC } from "react";

interface pageProps {}

const page: FC<pageProps> = ({}) => {
  return (
    <main>
      <h1 className="font-bold text-5xl mb-8">Add a friend</h1>
      <AddFrientButton />
    </main>
  );
};

export default page;
