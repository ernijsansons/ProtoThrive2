import { UserButton } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center space-x-4">
        <Sparkles className="h-8 w-8 text-primary neon-glow" />
        <h1 className="text-2xl font-bold text-primary drop-shadow-lg">ProtoThrive</h1>
      </div>
      <div className="flex-1 mx-8">
        {/* Conversational AI Chat Bar Placeholder */}
        <input 
          type="text" 
          placeholder="Ask ProtoThrive anything..." 
          className="w-full p-2 rounded-md bg-input border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
        />
      </div>
      <div className="flex items-center space-x-4">
        {/* Global Thrive Pill Placeholder */}
        <div className="flex items-center space-x-2 bg-card p-2 rounded-full border border-border">
          <span className="text-sm text-muted-foreground">Thrive:</span>
          <div className="w-10 h-4 bg-secondary rounded-full relative overflow-hidden">
            <div className="absolute inset-0 bg-primary rounded-full" style={{ width: '70%' }}></div>
          </div>
          <span className="text-sm font-bold text-primary">70%</span>
        </div>
        {/* Profile Dropdown (UserButton from Clerk) */}
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
