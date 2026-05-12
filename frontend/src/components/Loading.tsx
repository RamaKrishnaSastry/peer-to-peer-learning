import { ReactNode } from "react";

interface LoadingProps {
  isLoading: boolean;
  children: ReactNode;
}

export const Loading = ({ isLoading, children }: LoadingProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
};
