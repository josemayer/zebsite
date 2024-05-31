import React from "react";
import { AiOutlineLoading } from "react-icons/ai";

const Loading: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <AiOutlineLoading className="text-3xl animate-spin" />
    </div>
  );
};

export default Loading;
