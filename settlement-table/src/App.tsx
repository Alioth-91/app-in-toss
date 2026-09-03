import { useState } from "react";

import { SettlementFormProvider } from "./components/SettlementFormProvider";
import { ExpenseScreen } from "./screens/ExpenseScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { SetupScreen } from "./screens/SetupScreen";

type AppScreen = "home" | "setup" | "expenses";

export default function App() {
  return (
    <SettlementFormProvider>
      <AppContent />
    </SettlementFormProvider>
  );
}

function AppContent() {
  const [screen, setScreen] = useState<AppScreen>("home");

  if (screen === "setup") {
    return (
      <SetupScreen
        onBack={() => setScreen("home")}
        onComplete={() => setScreen("expenses")}
      />
    );
  }

  if (screen === "expenses") {
    return <ExpenseScreen onBack={() => setScreen("setup")} />;
  }

  return <HomeScreen onStart={() => setScreen("setup")} />;
}
