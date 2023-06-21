import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import HomePage from "./pages/HomePage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <HomePage />
      </div>
    </QueryClientProvider>
  );
}

export default App;
