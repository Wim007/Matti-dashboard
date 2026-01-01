import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import ApiKeys from "./pages/ApiKeys";
import Demographics from "./pages/Demographics";
import Engagement from "./pages/Engagement";
import RiskAssessment from "./pages/RiskAssessment";
import ImpactReport from "./pages/ImpactReport";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path="/demographics" component={Demographics} />
      <Route path="/engagement" component={Engagement} />
      <Route path="/risk-assessment" component={RiskAssessment} />
      <Route path="/impact-report" component={ImpactReport} />
      <Route path="/api-keys" component={ApiKeys} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
